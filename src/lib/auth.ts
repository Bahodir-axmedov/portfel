import "server-only"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import {
	AUDIENCE,
	ISSUER,
	SESSION_COOKIE,
	getSecretKey,
	verifySession,
	type SessionPayload,
} from "./auth-edge"

/**
 * Node-runtime auth helpers (bcrypt hashing + cookie management).
 * Edge-safe verification lives in `auth-edge.ts` so middleware can reuse it.
 */

const SESSION_HOURS = Number(process.env.AUTH_SESSION_HOURS ?? 12)

export async function hashPassword(password: string) {
	return bcrypt.hash(password, 12)
}

export async function verifyCredentials(email: string, password: string) {
	const adminEmail = process.env.ADMIN_EMAIL
	const hash = process.env.ADMIN_PASSWORD_HASH

	if (!adminEmail || !hash) {
		throw new Error(
			'ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be set in .env. Generate a hash with: npm run hash -- "your-password"',
		)
	}

	const emailMatches =
		email.trim().toLowerCase() === adminEmail.trim().toLowerCase()
	// Always run bcrypt so the response time does not leak whether the email
	// was correct.
	const passwordMatches = await bcrypt.compare(password, hash)

	return emailMatches && passwordMatches
}

export async function createSession(email: string) {
	const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000)

	const token = await new SignJWT({ email, role: "admin" })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setIssuer(ISSUER)
		.setAudience(AUDIENCE)
		.setExpirationTime(`${SESSION_HOURS}h`)
		.sign(getSecretKey())

	const store = await cookies()
	store.set(SESSION_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		expires: expiresAt,
	})

	return token
}

export async function destroySession() {
	const store = await cookies()
	store.set(SESSION_COOKIE, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 0,
	})
}

/** Current admin session, or null. */
export async function getSession(): Promise<SessionPayload | null> {
	const store = await cookies()
	return verifySession(store.get(SESSION_COOKIE)?.value)
}

/** Throws when there is no valid session — use inside admin API routes. */
export async function requireSession(): Promise<SessionPayload> {
	const session = await getSession()
	if (!session) throw new AuthError("Unauthorized")
	return session
}

export class AuthError extends Error {
	status = 401
	constructor(message = "Unauthorized") {
		super(message)
		this.name = "AuthError"
	}
}

export { SESSION_COOKIE }
