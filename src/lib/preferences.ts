/**
 * Theme + language preferences.
 *
 * These are stored as ordinary rows in the existing `Setting` table (key /
 * value / group / type) rather than in a new model, so nothing about the
 * database schema, the migrations or the `/admin/settings` CRUD screen has to
 * change. The generic settings table stays the source of truth; this module
 * only describes *which* keys the dedicated Preferences screen owns, what
 * values each key accepts, and what to fall back to when a row is missing.
 *
 * Deliberately dependency-free (no prisma, no "server-only") so the same spec
 * can drive the server page, the API validation and the client form. One list,
 * three consumers - no chance of the form offering a value the API rejects.
 */

export type PreferenceGroup = "theme" | "language"

export type PreferenceKind = "select" | "boolean" | "number" | "locales"

export type PreferenceSpec = {
	key: string
	group: PreferenceGroup
	label: string
	help?: string
	kind: PreferenceKind
	/** Value written to `Setting.type`, kept compatible with the CRUD screen. */
	type: "text" | "number" | "boolean"
	fallback: string
	options?: Array<{ value: string; label: string }>
	min?: number
	max?: number
}

/** Locales the site actually ships with — mirrors `src/i18n/routing.ts`. */
export const PREFERENCE_LOCALES = [
	{ value: "uz", label: "O'zbek" },
	{ value: "ru", label: "Ruscha" },
	{ value: "en", label: "Inglizcha" },
] as const

export const PREFERENCE_SPECS: PreferenceSpec[] = [
	{
		key: "theme.accent",
		group: "theme",
		label: "Asosiy gradient",
		help: "Butun sayt bo'ylab ishlatiladigan brend gradienti",
		kind: "select",
		type: "text",
		fallback: "blue-cyan",
		options: [
			{ value: "blue-cyan", label: "Electric Blue - Cyan (asosiy)" },
			{ value: "violet-blue", label: "Violet - Blue" },
			{ value: "emerald-cyan", label: "Emerald - Cyan" },
			{ value: "amber-rose", label: "Amber - Rose" },
		],
	},
	{
		key: "theme.mode",
		group: "theme",
		label: "Rejim",
		help: "Sayt dark mode uchun qurilgan; system rejimi kontrastni oshiradi",
		kind: "select",
		type: "text",
		fallback: "dark",
		options: [
			{ value: "dark", label: "Doimiy dark" },
			{ value: "system", label: "Tizim sozlamasiga qarab" },
		],
	},
	{
		key: "theme.glowIntensity",
		group: "theme",
		label: "Glow kuchi",
		help: "0 - glow yo'q, 100 - eng kuchli neon yorug'lik",
		kind: "number",
		type: "number",
		fallback: "70",
		min: 0,
		max: 100,
	},
	{
		key: "theme.motionLevel",
		group: "theme",
		label: "Animatsiya darajasi",
		help: "Foydalanuvchining reduced-motion sozlamasi bundan ustun turadi",
		kind: "select",
		type: "text",
		fallback: "full",
		options: [
			{ value: "full", label: "To'liq" },
			{ value: "balanced", label: "Muvozanatli" },
			{ value: "minimal", label: "Minimal" },
		],
	},
	{
		key: "theme.showPlanet",
		group: "theme",
		label: "Hero sayyorasi",
		help: "Hero orqa fonidagi aylanuvchi sayyora va orbita",
		kind: "boolean",
		type: "boolean",
		fallback: "true",
	},
	{
		key: "theme.showParticles",
		group: "theme",
		label: "Uchuvchi zarralar",
		help: "Fon zarralari va meteorlar",
		kind: "boolean",
		type: "boolean",
		fallback: "true",
	},
	{
		key: "language.defaultLocale",
		group: "language",
		label: "Asosiy til",
		help: "Til ko'rsatilmagan manzil shu tilga yo'naltiriladi",
		kind: "select",
		type: "text",
		fallback: "uz",
		options: PREFERENCE_LOCALES.map((locale) => ({
			value: locale.value,
			label: locale.label,
		})),
	},
	{
		key: "language.enabledLocales",
		group: "language",
		label: "Yoqilgan tillar",
		help: "Til almashtirgichda ko'rinadigan tillar",
		kind: "locales",
		type: "text",
		fallback: "uz,ru,en",
	},
	{
		key: "language.showSwitcher",
		group: "language",
		label: "Til almashtirgich ko'rinsin",
		kind: "boolean",
		type: "boolean",
		fallback: "true",
	},
	{
		key: "language.showFlags",
		group: "language",
		label: "Til kodlari o'rniga to'liq nom",
		help: "UZ / RU / EN o'rniga to'liq til nomi chiqadi",
		kind: "boolean",
		type: "boolean",
		fallback: "false",
	},
]

const byKey = new Map(PREFERENCE_SPECS.map((spec) => [spec.key, spec] as const))

/** Every key this screen is allowed to write — the API whitelist. */
export const PREFERENCE_KEYS = PREFERENCE_SPECS.map((spec) => spec.key)

export const PREFERENCE_GROUPS: PreferenceGroup[] = ["theme", "language"]

export function preferenceSpec(key: string): PreferenceSpec | undefined {
	return byKey.get(key)
}

export function specsForGroup(group: PreferenceGroup): PreferenceSpec[] {
	return PREFERENCE_SPECS.filter((spec) => spec.group === group)
}

/** All fallbacks, used both as form defaults and as the reset target. */
export function preferenceDefaults(): Record<string, string> {
	const values: Record<string, string> = {}
	for (const spec of PREFERENCE_SPECS) values[spec.key] = spec.fallback
	return values
}

/**
 * Overlays stored rows on top of the defaults.
 *
 * Unknown rows are ignored on purpose: `/admin/settings` can hold arbitrary
 * keys, and this screen must never render or overwrite keys it does not own.
 */
export function mergePreferences(
	rows: Array<{ key: string; value: string }>,
): Record<string, string> {
	const values = preferenceDefaults()
	for (const row of rows) {
		if (byKey.has(row.key)) values[row.key] = row.value
	}
	return values
}

const LOCALE_VALUES = new Set(PREFERENCE_LOCALES.map((locale) => locale.value))

/**
 * Validates and canonicalises one incoming value.
 *
 * Returns `null` when the value is not acceptable, so the API can answer 422
 * with the offending key instead of writing junk. Every branch returns a
 * *string*, because `Setting.value` is a single TEXT column: booleans become
 * "true" / "false" and numbers are clamped, then stringified.
 */
export function normalizePreference(
	spec: PreferenceSpec,
	raw: unknown,
): string | null {
	if (spec.kind === "boolean") {
		if (typeof raw === "boolean") return raw ? "true" : "false"
		if (raw === "true" || raw === "false") return raw
		return null
	}

	if (spec.kind === "number") {
		const parsed = typeof raw === "number" ? raw : Number(String(raw).trim())
		if (!Number.isFinite(parsed)) return null
		const min = spec.min ?? Number.NEGATIVE_INFINITY
		const max = spec.max ?? Number.POSITIVE_INFINITY
		if (parsed < min || parsed > max) return null
		return String(Math.round(parsed))
	}

	if (spec.kind === "locales") {
		const list = Array.isArray(raw) ? raw : String(raw ?? "").split(",")
		const cleaned: string[] = []
		for (const item of list) {
			const value = String(item).trim()
			if (!LOCALE_VALUES.has(value)) return null
			if (!cleaned.includes(value)) cleaned.push(value)
		}
		// An empty list would leave the site with no reachable locale at all.
		if (cleaned.length === 0) return null
		// Stored in the canonical uz,ru,en order so the value is stable no matter
		// which order the checkboxes were clicked in.
		return PREFERENCE_LOCALES.map((locale) => locale.value)
			.filter((value) => cleaned.includes(value))
			.join(",")
	}

	const value = String(raw ?? "").trim()
	const allowed = spec.options?.some((option) => option.value === value)
	return allowed ? value : null
}

/** `"uz,ru"` -> `["uz", "ru"]`, for reading a `locales` value back. */
export function parseLocaleList(value: string): string[] {
	return value
		.split(",")
		.map((item) => item.trim())
		.filter((item) => LOCALE_VALUES.has(item))
}
