import { NextResponse } from "next/server"
import { createSession, verifyCredentials } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit"
import { formatZodError, loginSchema } from "@/lib/validators"
import { LOGIN_RATE_LIMIT } from "@/constants"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Admin login.
 *
 * Rate limited per IP so the single admin account cannot be brute forced.
 * A successful login clears the bucket, sets the httpOnly session cookie and
 * lets the client redirect to /admin.
 */
export async function POST(request: Request) {
	const key = `login:${clientIp(request.headers)}`
	const limit = rateLimit(key, LOGIN_RATE_LIMIT)

	if (!limit.success) {
		return NextResponse.json(
			{
				error: `Juda ko'p urinish. ${limit.retryAfter} soniyadan so'ng qayta urinib ko'ring.`,
			},
			{ status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
		)
	}

	let body: unknown
	try {
		body = await request.json()
	} catch {
		return NextResponse.json(
			{ error: "So'rov formati noto'g'ri" },
			{ status: 400 },
		)
	}

	const parsed = loginSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json(
			{ fieldErrors: formatZodError(parsed.error) },
			{ status: 422 },
		)
	}

	try {
		const valid = await verifyCredentials(
			parsed.data.email,
			parsed.data.password,
		)

		if (!valid) {
			return NextResponse.json(
				{ error: "Email yoki parol noto'g'ri" },
				{ status: 401 },
			)
		}

		await createSession(parsed.data.email)
		resetRateLimit(key)

		// Only successful logins are recorded. Logging failures here would let an
		// attacker fill the table with rows containing attacker-controlled text.
		void logActivity({
			action: "login",
			resource: "auth",
			actor: parsed.data.email,
			headers: request.headers,
		})

		return NextResponse.json({ ok: true })
	} catch (error) {
		console.error("[api/auth/login]", error)
		return NextResponse.json(
			{
				error:
					"Server sozlamalarida xatolik. .env faylida ADMIN_EMAIL, ADMIN_PASSWORD_HASH va AUTH_SECRET to'ldirilganini tekshiring.",
			},
			{ status: 500 },
		)
	}
}
