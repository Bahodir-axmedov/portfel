/**
 * Tiny in-memory sliding-window rate limiter.
 *
 * Good enough for a single-instance Railway deployment protecting the contact
 * form, the analytics beacon, the upload endpoint and the admin login. If the
 * app is ever scaled horizontally this should be swapped for Redis — the
 * interface is intentionally minimal.
 */

type Bucket = {
	hits: number[]
	/** Window this bucket was created with, so the sweeper prunes correctly. */
	windowMs: number
}

const buckets = new Map<string, Bucket>()

/** Hard ceiling so a flood of unique keys cannot grow the map without bound. */
const MAX_BUCKETS = 10_000
const SWEEP_INTERVAL_MS = 60_000

let lastSweep = Date.now()

/**
 * Drops buckets that have gone completely cold so memory stays bounded.
 *
 * Each bucket is pruned with *its own* window. Using the caller's window (the
 * previous behaviour) meant a 60s contact-form request pruned the 300s login
 * bucket 5x too early, silently resetting the brute-force counter.
 */
function sweep(): void {
	const now = Date.now()
	if (now - lastSweep < SWEEP_INTERVAL_MS) return
	lastSweep = now

	for (const [key, bucket] of buckets) {
		const fresh = bucket.hits.filter((time) => now - time < bucket.windowMs)
		if (fresh.length === 0) buckets.delete(key)
		else bucket.hits = fresh
	}

	// Pathological case: more unique keys than the ceiling. Drop the oldest.
	if (buckets.size > MAX_BUCKETS) {
		const overflow = buckets.size - MAX_BUCKETS
		let removed = 0
		for (const key of buckets.keys()) {
			buckets.delete(key)
			removed += 1
			if (removed >= overflow) break
		}
	}
}

export type RateLimitResult = {
	success: boolean
	remaining: number
	limit: number
	/** Seconds until the caller may retry. `0` when not limited. */
	retryAfter: number
}

export function rateLimit(
	key: string,
	options: { windowMs: number; max: number },
): RateLimitResult {
	const { windowMs, max } = options
	sweep()

	const now = Date.now()
	const bucket = buckets.get(key)
	const previous = bucket && bucket.windowMs === windowMs ? bucket.hits : []
	const hits = previous.filter((time) => now - time < windowMs)

	if (hits.length >= max) {
		const oldest = hits[0] ?? now
		buckets.set(key, { hits, windowMs })
		return {
			success: false,
			remaining: 0,
			limit: max,
			retryAfter: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
		}
	}

	hits.push(now)
	buckets.set(key, { hits, windowMs })

	return {
		success: true,
		remaining: Math.max(0, max - hits.length),
		limit: max,
		retryAfter: 0,
	}
}

/** Clears a bucket, e.g. after a successful login. */
export function resetRateLimit(key: string): void {
	buckets.delete(key)
}

/** Test / maintenance helper — clears every bucket. */
export function clearRateLimits(): void {
	buckets.clear()
}

/**
 * Number of proxies in front of the app. Railway terminates TLS at its edge
 * and appends exactly one hop, so the *last* entry of `x-forwarded-for` is the
 * only value a client cannot forge. Reading `split(",")[0]` — the previous
 * behaviour — let anyone send `X-Forwarded-For: <random>` and get a fresh
 * login bucket on every request, defeating the brute-force limit entirely.
 */
function lastForwardedHop(value: string): string | null {
	const hops = value
		.split(",")
		.map((hop) => hop.trim())
		.filter(Boolean)
	return hops.length > 0 ? (hops[hops.length - 1] ?? null) : null
}

/**
 * Best-effort client IP, ordered from most to least trustworthy.
 *
 * `x-real-ip` and `cf-connecting-ip` are set by the proxy itself and
 * overwrite anything the client sent, so they are preferred. Only if both are
 * absent do we fall back to the last `x-forwarded-for` hop.
 */
export function clientIp(headers: Headers): string {
	const realIp = headers.get("x-real-ip")?.trim()
	if (realIp) return realIp

	const cloudflare = headers.get("cf-connecting-ip")?.trim()
	if (cloudflare) return cloudflare

	const forwarded = headers.get("x-forwarded-for")
	if (forwarded) {
		const hop = lastForwardedHop(forwarded)
		if (hop) return hop
	}

	return "unknown"
}
