import { ANALYTICS_RETENTION_DAYS } from "@/constants"
import { prisma } from "./prisma"

/**
 * Lightweight first-party analytics.
 *
 * Page views are stored in the local SQLite database so the admin dashboard
 * has real numbers without depending on an external provider. Google Analytics
 * is optional and only loads when NEXT_PUBLIC_GA_ID is configured.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ""
export const gaEnabled = GA_ID.length > 0

/**
 * Hard cap on the rows scanned when building the daily chart.
 *
 * The previous implementation called `findMany` for every view in the window
 * with no `take`. On a site that gets popular that loads the entire table into
 * the Node heap on every dashboard render — an unbounded query is a latent
 * out-of-memory crash, not a slow page.
 */
const DAILY_SCAN_LIMIT = 50_000

export type PageViewInput = {
	path: string
	locale?: string | null
	referrer?: string | null
	userAgent?: string | null
	country?: string | null
}

/** Records a page view. Never throws — analytics must not break a request. */
export async function recordPageView(input: PageViewInput): Promise<void> {
	try {
		await prisma.pageView.create({
			data: {
				path: input.path.slice(0, 512),
				locale: input.locale ?? null,
				referrer: input.referrer ? input.referrer.slice(0, 512) : null,
				userAgent: input.userAgent ? input.userAgent.slice(0, 512) : null,
				country: input.country ?? null,
			},
		})
	} catch {
		// Swallow: a failed analytics write should never surface to the visitor.
	}
}

/**
 * Deletes page views older than the retention window.
 *
 * Railway volumes are a fixed size and there is no cron container in this
 * deployment, so retention is enforced opportunistically from the dashboard.
 * It never throws and never blocks rendering.
 */
export async function pruneOldPageViews(): Promise<number> {
	try {
		const result = await prisma.pageView.deleteMany({
			where: { createdAt: { lt: daysAgo(ANALYTICS_RETENTION_DAYS) } },
		})
		return result.count
	} catch {
		return 0
	}
}

function daysAgo(days: number): Date {
	const date = new Date()
	date.setDate(date.getDate() - days)
	date.setHours(0, 0, 0, 0)
	return date
}

/**
 * Reduces a referrer URL to its host so `google.com/search?q=a` and
 * `google.com/search?q=b` are counted as one source instead of two.
 */
function referrerHost(value: string | null): string | null {
	if (!value) return null
	try {
		const { host } = new URL(value)
		return host || null
	} catch {
		// Not a parseable URL (some clients send a bare token) — keep it as-is.
		return value.slice(0, 64)
	}
}

export type AnalyticsSummary = {
	total: number
	last7Days: number
	last30Days: number
	previous30Days: number
	/** Percentage change between the last 30 days and the 30 before that. */
	trend: number
	topPaths: Array<{ path: string; views: number }>
	byLocale: Array<{ locale: string; views: number }>
	byCountry: Array<{ country: string; views: number }>
	topReferrers: Array<{ referrer: string; views: number }>
	daily: Array<{ date: string; views: number }>
	unreadMessages: number
}

/** Aggregated numbers for the admin dashboard. */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
	const since7 = daysAgo(7)
	const since30 = daysAgo(30)
	const since60 = daysAgo(60)

	const [
		total,
		last7Days,
		last30Days,
		previous30Days,
		pathGroups,
		localeGroups,
		countryGroups,
		referrerGroups,
		recent,
		unreadMessages,
	] = await Promise.all([
		prisma.pageView.count(),
		prisma.pageView.count({ where: { createdAt: { gte: since7 } } }),
		prisma.pageView.count({ where: { createdAt: { gte: since30 } } }),
		prisma.pageView.count({
			where: { createdAt: { gte: since60, lt: since30 } },
		}),
		prisma.pageView.groupBy({
			by: ["path"],
			_count: { path: true },
			orderBy: { _count: { path: "desc" } },
			take: 8,
		}),
		prisma.pageView.groupBy({
			by: ["locale"],
			_count: { locale: true },
		}),
		prisma.pageView.groupBy({
			by: ["country"],
			_count: { country: true },
			orderBy: { _count: { country: "desc" } },
			take: 8,
		}),
		prisma.pageView.groupBy({
			by: ["referrer"],
			_count: { referrer: true },
			where: { referrer: { not: null }, createdAt: { gte: since30 } },
			orderBy: { _count: { referrer: "desc" } },
			take: 40,
		}),
		prisma.pageView.findMany({
			where: { createdAt: { gte: since30 } },
			select: { createdAt: true },
			orderBy: { createdAt: "desc" },
			take: DAILY_SCAN_LIMIT,
		}),
		prisma.contactMessage.count({ where: { read: false, archived: false } }),
	])

	// Bucket the last 30 days locally so SQLite stays portable.
	const counts = new Map<string, number>()
	for (let index = 29; index >= 0; index -= 1) {
		const date = daysAgo(index).toISOString().slice(0, 10)
		counts.set(date, 0)
	}
	for (const row of recent) {
		const key = row.createdAt.toISOString().slice(0, 10)
		if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
	}

	// Collapse referrers by host after grouping so the chart shows sources,
	// not individual query strings.
	const referrerTotals = new Map<string, number>()
	for (const group of referrerGroups) {
		const host = referrerHost(group.referrer)
		if (!host) continue
		referrerTotals.set(
			host,
			(referrerTotals.get(host) ?? 0) + group._count.referrer,
		)
	}

	const trend =
		previous30Days === 0
			? last30Days > 0
				? 100
				: 0
			: Math.round(((last30Days - previous30Days) / previous30Days) * 100)

	return {
		total,
		last7Days,
		last30Days,
		previous30Days,
		trend,
		topPaths: pathGroups.map((group) => ({
			path: group.path,
			views: group._count.path,
		})),
		byLocale: localeGroups.map((group) => ({
			locale: group.locale ?? "unknown",
			views: group._count.locale,
		})),
		byCountry: countryGroups
			.filter((group) => Boolean(group.country))
			.map((group) => ({
				country: group.country as string,
				views: group._count.country,
			})),
		topReferrers: Array.from(referrerTotals, ([referrer, views]) => ({
			referrer,
			views,
		}))
			.sort((a, b) => b.views - a.views)
			.slice(0, 8),
		daily: Array.from(counts, ([date, views]) => ({ date, views })),
		unreadMessages,
	}
}
