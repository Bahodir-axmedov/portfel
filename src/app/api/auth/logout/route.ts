import { NextResponse } from "next/server"
import { requireSameOrigin } from "@/lib/api"
import { destroySession } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Clears the admin session cookie.
 *
 * The Origin check is not ceremony: without it any external page can force a
 * logged-in admin's browser to POST here and silently end the session
 * (login-CSRF's mirror image). Every other mutating endpoint enforces the same
 * rule, so logout must not be the one exception.
 */
export async function POST(request: Request) {
	const crossOrigin = requireSameOrigin(request)
	if (crossOrigin) return crossOrigin

	await destroySession()
	return NextResponse.json({ ok: true })
}
