import { NextResponse } from "next/server"
import { requireSameOrigin } from "@/lib/api"
import { destroySession, getSession } from "@/lib/auth"
import { logActivity } from "@/lib/activity"

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

	// The session is read before the cookie is cleared. Afterwards there is no
	// way to tell which account ended, and an audit row with an unknown actor
	// is not an audit row.
	const session = await getSession()

	await destroySession()

	if (session) {
		void logActivity({
			action: "logout",
			resource: "auth",
			actor: session.email,
			headers: request.headers,
		})
	}

	return NextResponse.json({ ok: true })
}
