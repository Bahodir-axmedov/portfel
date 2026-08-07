import { NextResponse } from "next/server"
import { readFile, stat } from "node:fs/promises"
import { extname, join, resolve, sep } from "node:path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "public/uploads"

/**
 * Only formats the upload endpoint can actually produce are served. Anything
 * else (including .svg and .html, which execute script in the page origin)
 * falls through to a 404 instead of being streamed back.
 */
const MIME: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".avif": "image/avif",
	".gif": "image/gif",
	".pdf": "application/pdf",
	".mp4": "video/mp4",
	".webm": "video/webm",
}

/** Types safe to render inline. Everything else downloads as an attachment. */
const INLINE = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/avif",
	"image/gif",
	"video/mp4",
	"video/webm",
	"application/pdf",
])

function notFound() {
	return new NextResponse("Not found", {
		status: 404,
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	})
}

/**
 * Streams files from the upload directory when it lives outside `public/`
 * (for example a Railway volume mounted at /data).
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path: segments } = await params

	if (!Array.isArray(segments) || segments.length === 0) return notFound()
	if (segments.some((segment) => segment.includes("\0"))) return notFound()

	const root = resolve(UPLOAD_DIR)
	const filePath = resolve(join(root, ...segments))

	// Canonical containment check. `resolve` collapses `..`, `.` and duplicate
	// separators, so comparing the resolved path against the resolved root is
	// the only reliable way to prove the request stayed inside the directory.
	if (filePath !== root && !filePath.startsWith(root + sep)) return notFound()

	const type = MIME[extname(filePath).toLowerCase()]
	if (!type) return notFound()

	try {
		const info = await stat(filePath)
		if (!info.isFile()) return notFound()

		// Cheap conditional response: uploaded files are immutable, so a strong
		// ETag lets the browser skip the body on every repeat view.
		const etag = `"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`
		if (request.headers.get("if-none-match") === etag) {
			return new NextResponse(null, {
				status: 304,
				headers: {
					ETag: etag,
					"Cache-Control": "public, max-age=31536000, immutable",
				},
			})
		}

		const data = await readFile(filePath)

		return new NextResponse(new Uint8Array(data), {
			headers: {
				"Content-Type": type,
				"Content-Length": String(info.size),
				"Cache-Control": "public, max-age=31536000, immutable",
				ETag: etag,
				"Last-Modified": new Date(info.mtimeMs).toUTCString(),
				// Stop content-type sniffing and forbid any script/plugin the file
				// might smuggle from executing in this origin.
				"X-Content-Type-Options": "nosniff",
				"Content-Security-Policy": "default-src 'none'; sandbox",
				"Content-Disposition": INLINE.has(type) ? "inline" : "attachment",
			},
		})
	} catch {
		return notFound()
	}
}
