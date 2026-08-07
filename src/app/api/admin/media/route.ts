import { z } from "zod"
import { readdir, stat, unlink } from "node:fs/promises"
import { extname, join, resolve, sep } from "node:path"
import { requireSession } from "@/lib/auth"
import {
	fail,
	handleApiError,
	ok,
	readJson,
	requireSameOrigin,
	unprocessable,
} from "@/lib/api"
import { formatZodError } from "@/lib/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "public/uploads"

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"])
const VIDEO_EXT = new Set([".mp4", ".webm"])
const DOC_EXT = new Set([".pdf"])

function publicUrl(filename: string) {
	const dir = UPLOAD_DIR.replace(/\\/g, "/")
		.replace(/^\.\//, "")
		.replace(/\/+$/, "")
	if (dir === "public") return `/${filename}`
	if (dir.startsWith("public/")) return `/${dir.slice(7)}/${filename}`
	return `/api/uploads/${filename}`
}

function kindOf(ext: string): "image" | "video" | "document" | "other" {
	if (IMAGE_EXT.has(ext)) return "image"
	if (VIDEO_EXT.has(ext)) return "video"
	if (DOC_EXT.has(ext)) return "document"
	return "other"
}

/**
 * Media library listing.
 *
 * The admin previously had no way to see what had been uploaded: every file
 * was write-only, orphaned files accumulated on the volume forever, and the
 * only way to reuse an image was to remember its URL.
 */
export async function GET(request: Request) {
	try {
		await requireSession()

		const url = new URL(request.url)
		const kindFilter = url.searchParams.get("kind") ?? "all"
		const term = (url.searchParams.get("q") ?? "").trim().toLowerCase()

		const root = resolve(UPLOAD_DIR)

		let entries: string[] = []
		try {
			entries = await readdir(root)
		} catch {
			// Directory does not exist yet (fresh deploy, nothing uploaded).
			return ok({ files: [], totalBytes: 0, count: 0 })
		}

		const files = []
		let totalBytes = 0

		for (const name of entries) {
			if (name.startsWith(".")) continue

			const filePath = join(root, name)
			let info
			try {
				info = await stat(filePath)
			} catch {
				continue
			}
			if (!info.isFile()) continue

			const ext = extname(name).toLowerCase()
			const kind = kindOf(ext)

			totalBytes += info.size

			if (kindFilter !== "all" && kind !== kindFilter) continue
			if (term && !name.toLowerCase().includes(term)) continue

			files.push({
				name,
				url: publicUrl(name),
				size: info.size,
				kind,
				modifiedAt: new Date(info.mtimeMs).toISOString(),
			})
		}

		files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))

		return ok({ files, totalBytes, count: files.length })
	} catch (error) {
		return handleApiError(error, "api/admin/media")
	}
}

const deleteSchema = z.object({
	names: z.array(z.string().min(1).max(255)).min(1).max(100),
})

/** Deletes uploaded files. */
export async function DELETE(request: Request) {
	try {
		await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const parsedBody = await readJson(request)
		if (!parsedBody.ok) return parsedBody.response

		const parsed = deleteSchema.safeParse(parsedBody.body)
		if (!parsed.success) return unprocessable(formatZodError(parsed.error))

		const root = resolve(UPLOAD_DIR)
		let deleted = 0

		for (const name of parsed.data.names) {
			// Names come from the client, so every one is re-validated: reject
			// separators and NUL outright, then prove the resolved path is still
			// inside the upload root before unlinking anything.
			if (
				name.includes("/") ||
				name.includes("\\") ||
				name.includes("\0") ||
				name === "." ||
				name === ".."
			) {
				return fail(`Yaroqsiz fayl nomi: ${name}`, 400)
			}

			const filePath = resolve(join(root, name))
			if (!filePath.startsWith(root + sep)) {
				return fail(`Yaroqsiz fayl yo'li: ${name}`, 400)
			}

			try {
				await unlink(filePath)
				deleted += 1
			} catch {
				// Already gone — treat as success for idempotency.
			}
		}

		return ok({ deleted })
	} catch (error) {
		return handleApiError(error, "api/admin/media")
	}
}
