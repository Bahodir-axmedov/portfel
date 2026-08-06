import { NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import { join, resolve, sep } from "node:path"
import { AuthError, requireSession } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { slugify } from "@/lib/utils"
import { isProduction } from "@/lib/env"
import {
	ACCEPTED_DOC_TYPES,
	ACCEPTED_IMAGE_TYPES,
	ACCEPTED_VIDEO_TYPES,
	EXTENSION_BY_MIME,
	MAX_UPLOAD_MB,
	UPLOAD_RATE_LIMIT,
} from "@/constants"
import type { UploadResult } from "@/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "public/uploads"
const ALLOWED = new Set<string>([
	...ACCEPTED_IMAGE_TYPES,
	...ACCEPTED_DOC_TYPES,
	...ACCEPTED_VIDEO_TYPES,
])

/**
 * Uploads inside `public/` are served statically; a volume mounted elsewhere
 * (Railway) is streamed back through /api/uploads instead.
 */
function publicUrl(filename: string) {
	const dir = UPLOAD_DIR.replace(/\\/g, "/")
		.replace(/^\.\//, "")
		.replace(/\/+$/, "")
	if (dir === "public") return `/${filename}`
	if (dir.startsWith("public/")) return `/${dir.slice(7)}/${filename}`
	return `/api/uploads/${filename}`
}

/**
 * Magic-byte sniffing.
 *
 * `file.type` is supplied by the browser and is fully attacker-controlled from
 * a scripted request. Trusting it means an HTML/JS payload can be stored under
 * an image content type. We therefore detect the real format from the file
 * header and only accept the upload when it matches the declared type.
 */
function sniffMime(buffer: Buffer): string | null {
	const startsWith = (...bytes: number[]) =>
		bytes.every((byte, index) => buffer[index] === byte)
	const ascii = (offset: number, length: number) =>
		buffer.subarray(offset, offset + length).toString("latin1")

	if (buffer.length < 12) return null

	if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png"
	if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg"
	if (startsWith(0x47, 0x49, 0x46, 0x38)) return "image/gif"
	if (startsWith(0x25, 0x50, 0x44, 0x46)) return "application/pdf"
	if (startsWith(0x1a, 0x45, 0xdf, 0xa3)) return "video/webm"

	if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp"

	if (ascii(4, 4) === "ftyp") {
		const brand = ascii(8, 4)
		if (brand === "avif" || brand === "avis") return "image/avif"
		return "video/mp4"
	}

	return null
}

function reject(error: string, status: number) {
	return NextResponse.json({ ok: false, error }, { status })
}

export async function POST(request: Request) {
	try {
		const session = await requireSession()

		// Even an authenticated admin should not be able to fill the volume by
		// accident (or with a stolen cookie).
		const limit = rateLimit(`upload:${session.email}`, UPLOAD_RATE_LIMIT)
		if (!limit.success) {
			return NextResponse.json(
				{ ok: false, error: "Juda ko'p yuklash. Biroz kuting." },
				{ status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
			)
		}

		const form = await request.formData()
		const entry = form.get("file")

		if (!entry || typeof entry === "string") {
			return reject("Fayl tanlanmagan", 400)
		}

		const file = entry as File
		const declaredType = (file.type || "").toLowerCase()

		if (!ALLOWED.has(declaredType)) {
			return reject(
				`Bu fayl turi qo'llab-quvvatlanmaydi: ${declaredType || "noma'lum"}`,
				415,
			)
		}

		const maxBytes = MAX_UPLOAD_MB * 1024 * 1024
		if (file.size > maxBytes) {
			return reject(`Fayl juda katta. Maksimum ${MAX_UPLOAD_MB} MB.`, 413)
		}
		if (file.size === 0) {
			return reject("Fayl bo'sh", 400)
		}

		const buffer = Buffer.from(await file.arrayBuffer())

		// Re-check the real size: `file.size` is metadata, the buffer is truth.
		if (buffer.byteLength > maxBytes) {
			return reject(`Fayl juda katta. Maksimum ${MAX_UPLOAD_MB} MB.`, 413)
		}

		const actualType = sniffMime(buffer)
		if (!actualType || actualType !== declaredType) {
			return reject(
				"Fayl mazmuni uning turiga mos kelmadi. Boshqa fayl tanlang.",
				415,
			)
		}

		// The extension comes from the verified MIME type, never from the
		// client-supplied filename. Otherwise `payload.html` with a spoofed
		// `image/png` content type would be written as .html and served as
		// same-origin HTML — a stored XSS with full access to the admin cookie.
		const ext = EXTENSION_BY_MIME[actualType]
		if (!ext) {
			return reject("Bu fayl turi qo'llab-quvvatlanmaydi", 415)
		}

		const rawName = typeof file.name === "string" ? file.name : "file"
		const stem = slugify(rawName.replace(/\.[^.]*$/, "")).slice(0, 60) || "file"
		const unique = Math.random().toString(36).slice(2, 8)
		const filename = `${stem}-${Date.now().toString(36)}-${unique}${ext}`

		const targetDir = resolve(UPLOAD_DIR)
		const targetPath = resolve(join(targetDir, filename))

		// Defence in depth: `filename` is fully generated above, but a
		// containment assert costs nothing and survives future refactors.
		if (targetPath !== join(targetDir, filename) || !targetPath.startsWith(targetDir + sep)) {
			return reject("Yaroqsiz fayl nomi", 400)
		}

		await mkdir(targetDir, { recursive: true })
		await writeFile(targetPath, buffer)

		const result: UploadResult = {
			url: publicUrl(filename),
			name: filename,
			size: buffer.byteLength,
			type: actualType,
		}

		// Dimensions help the admin preview images without a layout shift.
		if (actualType.startsWith("image/")) {
			try {
				const sharp = (await import("sharp")).default
				const meta = await sharp(buffer).metadata()
				result.width = meta.width
				result.height = meta.height
			} catch {
				// sharp is optional at runtime — skip dimensions if unavailable.
			}
		}

		return NextResponse.json({ ok: true, ...result }, { status: 201 })
	} catch (error) {
		if (error instanceof AuthError) {
			return reject(error.message, 401)
		}
		console.error("[api/upload]", error)
		return reject(
			isProduction
				? "Yuklashda xatolik yuz berdi"
				: `Yuklashda xatolik: ${error instanceof Error ? error.message : String(error)}`,
			500,
		)
	}
}
