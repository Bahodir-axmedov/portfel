import { defineRouting } from "next-intl/routing"

export const locales = ["uz", "ru", "en"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "uz"

export const routing = defineRouting({
	locales,
	defaultLocale,
	// Uzbek lives at "/", other locales at "/ru" and "/en".
	localePrefix: "as-needed",
})

export const localeLabels: Record<Locale, string> = {
	uz: "O'zbek",
	ru: "Русский",
	en: "English",
}

export const localeShortLabels: Record<Locale, string> = {
	uz: "UZ",
	ru: "RU",
	en: "EN",
}

/** BCP-47 tags for <html lang> and OpenGraph. */
export const htmlLang: Record<Locale, string> = {
	uz: "uz-UZ",
	ru: "ru-RU",
	en: "en-US",
}

export const ogLocale: Record<Locale, string> = {
	uz: "uz_UZ",
	ru: "ru_RU",
	en: "en_US",
}

export function isLocale(value: string): value is Locale {
	return (locales as readonly string[]).includes(value)
}
