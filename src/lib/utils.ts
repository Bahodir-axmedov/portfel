import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/** 940 -> "940", 1000 -> "1k", 1500 -> "1.5k", 2400000 -> "2.4M" */
export function compactNumber(value: number, fractionDigits = 1): string {
	if (!Number.isFinite(value)) return "0"

	const abs = Math.abs(value)
	if (abs < 1000) return String(Math.round(value))

	const units = [
		{ limit: 1_000_000_000, suffix: "B" },
		{ limit: 1_000_000, suffix: "M" },
		{ limit: 1_000, suffix: "k" },
	]

	for (const unit of units) {
		if (abs >= unit.limit) {
			const scaled = value / unit.limit
			const digits = Number.isInteger(scaled) ? 0 : fractionDigits
			return `${Number(scaled.toFixed(digits))}${unit.suffix}`
		}
	}

	return String(value)
}

/**
 * SQLite has no array columns, so every list is stored as a JSON string.
 * This safely turns that column back into a string array.
 */
export function parseArray(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === "string")
	}
	if (typeof value !== "string") return []

	const trimmed = value.trim()
	if (!trimmed) return []

	if (trimmed.startsWith("[")) {
		try {
			const parsed: unknown = JSON.parse(trimmed)
			if (Array.isArray(parsed)) {
				return parsed.map((item) => String(item)).filter(Boolean)
			}
			return []
		} catch {
			return []
		}
	}

	// Fallback: admin pasted plain lines instead of JSON.
	return trimmed
		.split(/\r?\n/)
		.map((item) => item.trim())
		.filter(Boolean)
}

/** Serializes a list back into the JSON string shape the database expects. */
export function stringifyArray(value: string[] | null | undefined): string {
	if (!value || value.length === 0) return "[]"
	return JSON.stringify(value.map((item) => item.trim()).filter(Boolean))
}

/**
 * Full years elapsed since a year (2020), an ISO date, or a Date.
 * Used for the auto-updating "years of experience" stat and for the age.
 */
export function yearsSince(
	from: string | number | Date,
	to: Date = new Date(),
): number {
	let start: Date
	if (from instanceof Date) start = from
	else if (typeof from === "number") start = new Date(from, 0, 1)
	else if (/^\d{4}$/.test(from.trim())) start = new Date(Number(from), 0, 1)
	else start = new Date(from)

	if (Number.isNaN(start.getTime())) return 0

	let years = to.getFullYear() - start.getFullYear()
	const beforeAnniversary =
		to.getMonth() < start.getMonth() ||
		(to.getMonth() === start.getMonth() && to.getDate() < start.getDate())
	if (beforeAnniversary) years -= 1

	return Math.max(0, years)
}

/** Age from a birth date — never hardcoded, always computed at render time. */
export function calculateAge(
	birthDate: string | Date,
	to: Date = new Date(),
): number {
	return yearsSince(birthDate, to)
}

/** "2025-08-01" -> "Avgust 2025" / "Август 2025" / "August 2025" */
export function formatMonthYear(
	value: string | Date | null | undefined,
	locale = "uz",
): string {
	if (!value) return ""
	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime())) return ""
	return new Intl.DateTimeFormat(localeTag(locale), {
		month: "long",
		year: "numeric",
		timeZone: "Asia/Tashkent",
	}).format(date)
}

/** "2025-08-01" -> "1-avgust, 2025" style full date. */
export function formatDate(
	value: string | Date | null | undefined,
	locale = "uz",
): string {
	if (!value) return ""
	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime())) return ""
	return new Intl.DateTimeFormat(localeTag(locale), {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "Asia/Tashkent",
	}).format(date)
}

function localeTag(locale: string): string {
	if (locale === "ru") return "ru-RU"
	if (locale === "en") return "en-US"
	return "uz-UZ"
}

/** Turns "Energy Invest" into "energy-invest". */
export function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/['’`]/g, "")
		.replace(/[^a-z0-9\u0400-\u04FF]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80)
}

/** "Bahodir Axmedov" -> "BA" */
export function initials(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("")
}

/** Builds an absolute URL from NEXT_PUBLIC_SITE_URL — needed for SEO tags. */
export function absoluteUrl(path = "/"): string {
	const base = (
		process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
	).replace(/\/+$/, "")
	const suffix = path.startsWith("/") ? path : `/${path}`
	return `${base}${suffix}`
}

/** Cuts long text without breaking a word — used for meta descriptions. */
export function truncate(value: string, max = 160): string {
	const text = value.replace(/\s+/g, " ").trim()
	if (text.length <= max) return text

	// `lastIndexOf` returns -1 when the first `max` characters contain no
	// space (one very long word, or a CJK string). `slice(0, -1)` would then
	// drop a single trailing character instead of truncating, returning a
	// meta description thousands of characters long. Fall back to a hard cut.
	const boundary = text.lastIndexOf(" ", max - 1)
	const cut = boundary > 0 ? text.slice(0, boundary) : text.slice(0, max - 1)
	return `${cut.trimEnd()}…`
}

/** Deterministic index — keeps decorative variations stable between renders. */
export function hashIndex(value: string, buckets: number): number {
	let hash = 0
	for (let i = 0; i < value.length; i += 1) {
		hash = (hash * 31 + value.charCodeAt(i)) % 100000
	}
	return buckets > 0 ? hash % buckets : 0
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max)
}

/** Small delay helper for staged animations and retries. */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
