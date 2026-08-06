import type { Locale } from "@/i18n/routing"
import { parseArray } from "./utils"

/**
 * Database rows keep Uzbek in the base column and optional translations in
 * `<field>Ru` / `<field>En`. `pick` resolves the right one and always falls
 * back to the base value, so a missing translation never renders empty.
 *
 *   pick(project, "summary", "ru") → project.summaryRu ?? project.summary
 */
export function pick<T extends Record<string, unknown>>(
	row: T | null | undefined,
	field: string,
	locale: Locale | string,
): string {
	if (!row) return ""
	const suffix = locale === "ru" ? "Ru" : locale === "en" ? "En" : ""
	const localized = suffix ? row[`${field}${suffix}`] : undefined
	const base = row[field]
	const value = (localized ?? base) as unknown
	return typeof value === "string" ? value : value == null ? "" : String(value)
}

/** Same as `pick`, but for JSON-encoded list columns. */
export function pickArray<T extends Record<string, unknown>>(
	row: T | null | undefined,
	field: string,
	locale: Locale | string,
): string[] {
	if (!row) return []
	const suffix = locale === "ru" ? "Ru" : locale === "en" ? "En" : ""
	const localized = suffix ? parseArray(row[`${field}${suffix}`]) : []
	return localized.length ? localized : parseArray(row[field])
}

/**
 * Localises a whole row: for every `<field>Ru`/`<field>En` column found, the
 * base field is replaced with the localized value and the suffixed columns are
 * dropped. Handy when passing rows to client components.
 */
export function localizeRow<T extends Record<string, unknown>>(
	row: T,
	locale: Locale | string,
): T {
	const suffix = locale === "ru" ? "Ru" : locale === "en" ? "En" : ""
	const result: Record<string, unknown> = {}

	for (const [key, value] of Object.entries(row)) {
		// A key is a translation column only when the *base* column also exists.
		// Skipping on the suffix alone would silently drop any real field whose
		// name happens to end in "Ru" or "En".
		const isTranslationColumn =
			(key.endsWith("Ru") || key.endsWith("En")) &&
			Object.hasOwn(row, key.slice(0, -2))
		if (isTranslationColumn) continue
		const localized = suffix ? row[`${key}${suffix}`] : undefined
		result[key] =
			localized === undefined || localized === null || localized === ""
				? value
				: localized
	}

	return result as T
}

export function localizeRows<T extends Record<string, unknown>>(
	rows: T[],
	locale: Locale | string,
): T[] {
	return rows.map((row) => localizeRow(row, locale))
}
