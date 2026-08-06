import { NextResponse } from "next/server"
import { recordPageView } from "@/lib/analytics"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* Generous limit: a real visitor never sends 60 page views per minute. */
const BEACON_LIMIT = { windowMs: 60_000, max: 60 }

/**
 * Crawlers, uptime probes and preview bots would otherwise dominate the
 * dashboard numbers and inflate the PageView table.
 */
const BOT_PATTERN =
	/bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|whatsapp|telegrambot|semrush|ahrefs|mj12|dotbot|petalbot|headlesschrome|lighthouse|gtmetrix|pingdom|uptimerobot|curl\/|wget\/|python-requests|axios\/|node-fetch/i

const noContent = () => new NextResponse(null, { status: 204 })

/**
 * First-party page-view beacon. Always answers 204 so a blocked or failing
 * analytics call never shows up as an error in the visitor's console.
 */
export async function POST(request: Request) {
	const userAgent = request.headers.get("user-agent") ?? ""
	if (!userAgent || BOT_PATTERN.test(userAgent)) return noContent()

	const limit = rateLimit(`pv:${clientIp(request.headers)}`, BEACON_LIMIT)
	if (!limit.success) return noContent()

	const body = (await request.json().catch(() => null)) as {
		path?: unknown
		locale?: unknown
		referrer?: unknown
	} | null

	if (!body || typeof body.path !== "string" || !body.path) return noContent()

	// Never count the admin panel as public traffic.
	if (body.path.startsWith("/admin") || body.path.startsWith("/api")) {
		return noContent()
	}

	// Self-referrals add noise to the "top referrers" panel without adding
	// information — internal navigation is already visible in "top paths".
	const host = request.headers.get("host")
	let referrer = typeof body.referrer === "string" ? body.referrer : null
	if (referrer && host) {
		try {
			if (new URL(referrer).host === host) referrer = null
		} catch {
			referrer = null
		}
	}

	// Fire-and-forget: the visitor should not wait for a write they never see.
	// `recordPageView` already swallows its own errors, and `void` documents
	// that the floating promise is deliberate.
	void recordPageView({
		path: body.path,
		locale: typeof body.locale === "string" ? body.locale : null,
		referrer,
		userAgent,
		country:
			request.headers.get("cf-ipcountry") ||
			request.headers.get("x-vercel-ip-country"),
	})

	return noContent()
}
