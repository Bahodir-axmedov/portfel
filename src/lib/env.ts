/**
 * Environment variable helpers.
 *
 * `Number(process.env.X ?? 12)` is a trap: when the variable exists but is an
 * empty string (very common on Railway, where clearing a field leaves ""),
 * `Number("")` evaluates to `0` instead of falling back to the default. A
 * session length of 0 hours logs the admin out instantly; an upload limit of
 * 0 MB rejects every file. Every numeric env read goes through `envNumber`.
 *
 * This module is intentionally dependency-free so it can be imported from both
 * server and client bundles.
 */

export const isProduction = process.env.NODE_ENV === "production"
export const isDevelopment = process.env.NODE_ENV === "development"

/** Trimmed string, or the fallback when unset / blank. */
export function envString(raw: string | undefined, fallback: string): string {
	const value = (raw ?? "").trim()
	return value.length > 0 ? value : fallback
}

/** Finite number within optional bounds, or the fallback. */
export function envNumber(
	raw: string | undefined,
	fallback: number,
	bounds: { min?: number; max?: number } = {},
): number {
	const value = (raw ?? "").trim()
	if (value.length === 0) return fallback

	const parsed = Number(value)
	if (!Number.isFinite(parsed)) return fallback
	if (bounds.min !== undefined && parsed < bounds.min) return fallback
	if (bounds.max !== undefined && parsed > bounds.max) return fallback
	return parsed
}

/** `"a, b ,c"` -> `["a", "b", "c"]`. Empty input yields an empty array. */
export function envList(raw: string | undefined): string[] {
	return (raw ?? "")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean)
}

/** `"1" | "true" | "yes" | "on"` -> true. Anything else -> the fallback. */
export function envBoolean(raw: string | undefined, fallback = false): boolean {
	const value = (raw ?? "").trim().toLowerCase()
	if (value.length === 0) return fallback
	return value === "1" || value === "true" || value === "yes" || value === "on"
}
