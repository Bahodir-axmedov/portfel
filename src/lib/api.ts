import "server-only"
import { NextResponse } from "next/server"
import { AuthError } from "./auth"
import { isProduction } from "./env"
import { ADMIN_MAX_PAGE_SIZE, ADMIN_PAGE_SIZE } from "@/constants"
import type { AdminListQuery, AdminResourceConfig, FieldError } from "@/types"

/**
 * Shared HTTP plumbing for the API routes.
 *
 * Before this module every route re-implemented its own error mapping, and
 * three of them returned `error.message` straight to the client on a 500 —
 * leaking Prisma internals, column names and absolute filesystem paths to an
 * anonymous caller. Centralising it means one place to audit and one place to
 * change.
 */

export function ok<T extends Record<string, unknown>>(
	data: T,
	init?: ResponseInit,
) {
	return NextResponse.json({ ok: true, ...data }, init)
}

export function fail(
	error: string,
	status: number,
	extra?: Record<string, unknown>,
) {
	return NextResponse.json({ ok: false, error, ...extra }, { status })
}

export function unprocessable(fieldErrors: FieldError[]) {
	return NextResponse.json({ ok: false, fieldErrors }, { status: 422 })
}

export function notFound(message = "Topilmadi") {
	return fail(message, 404)
}

export function unauthorized(message = "Unauthorized") {
	return fail(message, 401)
}

/**
 * Parses a JSON body without letting malformed input become a 500.
 *
 * `await request.json()` throws a SyntaxError on invalid JSON. Unguarded, that
 * bubbled into the catch-all handler and answered 500 "Unexpected token" for
 * what is unambiguously a client mistake (400).
 */
export async function readJson(
	request: Request,
): Promise<
	{ ok: true; body: unknown } | { ok: false; response: NextResponse }
> {
	try {
		const body = await request.json()
		if (body === null || typeof body !== "object" || Array.isArray(body)) {
			return { ok: false, response: fail("JSON obyekt kutilgan edi", 400) }
		}
		return { ok: true, body }
	} catch {
		return { ok: false, response: fail("Yaroqsiz JSON", 400) }
	}
}

/**
 * Rejects cross-site mutations.
 *
 * The session cookie is already `SameSite=Lax`, which blocks cookies on
 * cross-site POST/PATCH/DELETE. This is the second, independent layer: if the
 * cookie policy is ever relaxed, or a browser bug lets one through, the origin
 * check still stops it. `Origin` is set by the browser on every state-changing
 * fetch and cannot be forged from page JavaScript.
 */
export function requireSameOrigin(request: Request): NextResponse | null {
	const origin = request.headers.get("origin")
	if (!origin) return null // non-browser client (curl, server-to-server)

	const host = request.headers.get("host")
	if (!host) return fail("Yaroqsiz so'rov", 400)

	try {
		if (new URL(origin).host !== host) {
			return fail("Cross-origin so'rov rad etildi", 403)
		}
	} catch {
		return fail("Yaroqsiz Origin", 400)
	}

	return null
}

/** Recognisable Prisma failures mapped to the right status code. */
function mapPrismaError(message: string): NextResponse | null {
	if (message.includes("Unique constraint")) {
		return fail(
			"Bu qiymat allaqachon mavjud (takrorlanmas bo'lishi kerak)",
			409,
		)
	}
	if (
		message.includes("Record to update not found") ||
		message.includes("Record to delete does not exist") ||
		message.includes("No record was found")
	) {
		return notFound()
	}
	if (message.includes("Foreign key constraint")) {
		return fail("Bu yozuv boshqa ma'lumotlarga bog'langan", 409)
	}
	if (message.includes("Argument") && message.includes("is missing")) {
		return fail("Majburiy maydon to'ldirilmagan", 422)
	}
	return null
}

/**
 * Single error funnel for every admin route.
 *
 * In development the real message is returned so debugging stays fast; in
 * production the client only ever sees a generic sentence while the full error
 * goes to the server log.
 */
export function handleApiError(error: unknown, scope: string): NextResponse {
	if (error instanceof AuthError) return unauthorized(error.message)

	const message = error instanceof Error ? error.message : String(error)

	const mapped = mapPrismaError(message)
	if (mapped) return mapped

	console.error(`[${scope}]`, error)
	return fail(isProduction ? "Serverda xatolik yuz berdi" : message, 500)
}

function toInt(raw: string | null, fallback: number): number {
	if (!raw) return fallback
	const parsed = Number.parseInt(raw, 10)
	return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Parses and *validates* list query parameters.
 *
 * `sort` is checked against the resource's declared columns and fields rather
 * than passed through: `orderBy: { [userInput]: dir }` with an arbitrary key
 * makes Prisma throw, and an attacker-chosen relation name could be used to
 * probe the schema. Only names the admin UI can legitimately produce are
 * accepted; anything else silently falls back to the default sort.
 */
export function parseListQuery(
	url: URL,
	config: AdminResourceConfig,
): AdminListQuery {
	const params = url.searchParams

	const sortable = new Set<string>([
		...config.columns.map((column) => column.name),
		...config.fields.map((field) => field.name),
		"createdAt",
		"updatedAt",
	])

	const requestedSort = params.get("sort")?.trim() ?? ""
	const sort = sortable.has(requestedSort)
		? requestedSort
		: config.defaultSort?.field

	const requestedDirection = params.get("dir")?.trim().toLowerCase()
	const direction =
		requestedDirection === "asc" || requestedDirection === "desc"
			? requestedDirection
			: (config.defaultSort?.direction ?? "asc")

	const pageSize = Math.min(
		ADMIN_MAX_PAGE_SIZE,
		Math.max(1, toInt(params.get("pageSize"), ADMIN_PAGE_SIZE)),
	)
	const page = Math.max(1, toInt(params.get("page"), 1))

	const publishedParam = params.get("published")
	const published =
		publishedParam === "true"
			? true
			: publishedParam === "false"
				? false
				: undefined

	return {
		page,
		pageSize,
		sort,
		direction,
		term: params.get("q")?.trim() ?? "",
		published,
	}
}
