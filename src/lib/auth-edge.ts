import { jwtVerify } from "jose"

/**
 * Edge-safe session helpers.
 *
 * `middleware.ts` runs on the Edge runtime where bcrypt and `next/headers`
 * are unavailable, so JWT verification is isolated here and Node-only helpers
 * live in `auth.ts`.
 */

export const SESSION_COOKIE = "portfolio_session"
export const ISSUER = "bahodir.dev"
export const AUDIENCE = "bahodir.dev/admin"

export type SessionPayload = {
	email: string
	role: "admin"
	exp?: number
}

export function getSecretKey(): Uint8Array {
	const secret = process.env.AUTH_SECRET
	if (!secret || secret.length < 32) {
		throw new Error(
			"AUTH_SECRET must be set and at least 32 characters long. Generate one with: openssl rand -base64 32",
		)
	}
	return new TextEncoder().encode(secret)
}

/** Returns the session payload, or null when the token is missing/invalid. */
export async function verifySession(
	token: string | undefined | null,
): Promise<SessionPayload | null> {
	if (!token) return null
	try {
		const { payload } = await jwtVerify(token, getSecretKey(), {
			issuer: ISSUER,
			audience: AUDIENCE,
		})
		if (payload.role !== "admin" || typeof payload.email !== "string") {
			return null
		}
		return {
			email: payload.email,
			role: "admin",
			exp: payload.exp,
		}
	} catch {
		return null
	}
}
