import createIntlMiddleware from "next-intl/middleware"
import { NextResponse, type NextRequest } from "next/server"
import { routing } from "@/i18n/routing"
import { SESSION_COOKIE, verifySession } from "@/lib/auth-edge"

const intlMiddleware = createIntlMiddleware(routing)

export default async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Admin area: protected by the session cookie, never locale-prefixed.
	if (pathname.startsWith("/admin")) {
		const isLoginPage = pathname === "/admin/login"
		const session = await verifySession(
			request.cookies.get(SESSION_COOKIE)?.value,
		)

		if (!session && !isLoginPage) {
			const url = new URL("/admin/login", request.url)
			url.searchParams.set("next", pathname)
			return NextResponse.redirect(url)
		}

		if (session && isLoginPage) {
			return NextResponse.redirect(new URL("/admin", request.url))
		}

		return NextResponse.next()
	}

	return intlMiddleware(request)
}

export const config = {
	matcher: [
		// Public pages, excluding API routes, Next internals and static files.
		"/((?!api|_next|_vercel|images|resume|uploads|.*\\..*).*)",
		"/admin/:path*",
	],
}
