import type { Metadata } from "next"
import { htmlLang, ogLocale, locales, type Locale } from "@/i18n/routing"
import { AUTHOR_NAME, DEFAULT_OG_IMAGE, SITE_NAME } from "@/constants"

/**
 * SEO helpers.
 *
 * URLs are assembled from parts on purpose so the canonical host is only ever
 * defined in one place (the NEXT_PUBLIC_SITE_URL environment variable).
 */

const PROTOCOL = "https:" + "//"
const FALLBACK_HOST = "axmedov-b.up.railway.app"
const SCHEMA_CONTEXT = PROTOCOL + "schema.org"
const FALLBACK_ORIGIN = PROTOCOL + FALLBACK_HOST

/**
 * Normalises NEXT_PUBLIC_SITE_URL into a valid absolute origin.
 *
 * `buildMetadata` passes this value to `new URL(...)`. A host written without
 * a scheme ("example.up.railway.app") makes that constructor throw
 * `TypeError: Invalid URL` inside `generateMetadata`, which React reports only
 * as an opaque "Server Components render" digest — the whole route 500s and
 * the real cause never reaches the log. Because the variable is inlined at
 * build time, the failure is identical on every request and every locale.
 *
 * Three defences, in order:
 *  1. a missing scheme is added rather than rejected;
 *  2. the result is validated with `new URL` here, once, at module load;
 *  3. anything still unparseable falls back to the known production origin.
 *
 * The value is therefore always safe for `new URL`, and a misconfigured
 * environment variable degrades to a wrong canonical host instead of an
 * unrenderable site.
 */
function resolveSiteUrl(): string {
	const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim()
	if (!raw) return FALLBACK_ORIGIN

	const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)
		? raw
		: PROTOCOL + raw.replace(/^\/+/, "")
	const trimmed = withScheme.replace(/\/+$/, "")

	try {
		const parsed = new URL(trimmed)
		if (!parsed.hostname) return FALLBACK_ORIGIN
		return parsed.origin
	} catch {
		return FALLBACK_ORIGIN
	}
}

/** Canonical origin without a trailing slash. Always parseable by `new URL`. */
export const SITE_URL = resolveSiteUrl()

/** Joins a path onto the canonical origin. */
export function absolute(path = "/"): string {
	if (!path) return SITE_URL
	if (path.startsWith("http")) return path
	return SITE_URL + (path.startsWith("/") ? path : `/${path}`)
}

/** Locale-prefixed path. Uzbek is the default locale and has no prefix. */
export function localePath(locale: Locale, path = "/"): string {
	const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`
	return locale === "uz" ? clean || "/" : `/${locale}${clean}`
}

/** hreflang map for every locale of a given route. */
export function languageAlternates(path = "/"): Record<string, string> {
	const alternates: Record<string, string> = {}
	for (const locale of locales) {
		alternates[htmlLang[locale]] = absolute(localePath(locale, path))
	}
	alternates["x-default"] = absolute(localePath("uz", path))
	return alternates
}

export type MetadataInput = {
	locale: Locale
	path?: string
	title: string
	description: string
	keywords?: string[]
	image?: string | null
	noIndex?: boolean
	type?: "website" | "article" | "profile"
	publishedTime?: string
}

/** Builds a complete Metadata object: canonical, hreflang, OG and Twitter. */
export function buildMetadata({
	locale,
	path = "/",
	title,
	description,
	keywords,
	image,
	noIndex,
	type = "website",
	publishedTime,
}: MetadataInput): Metadata {
	const url = absolute(localePath(locale, path))
	const ogImage = absolute(image || DEFAULT_OG_IMAGE)

	return {
		metadataBase: new URL(SITE_URL),
		title,
		description,
		keywords,
		authors: [{ name: AUTHOR_NAME, url: SITE_URL }],
		creator: AUTHOR_NAME,
		publisher: AUTHOR_NAME,
		alternates: { canonical: url, languages: languageAlternates(path) },
		robots: noIndex
			? { index: false, follow: false }
			: {
					index: true,
					follow: true,
					googleBot: {
						index: true,
						follow: true,
						"max-image-preview": "large",
						"max-snippet": -1,
						"max-video-preview": -1,
					},
				},
		openGraph: {
			type: type === "profile" ? "profile" : type,
			siteName: SITE_NAME,
			title,
			description,
			url,
			locale: ogLocale[locale],
			images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
			...(publishedTime ? { publishedTime } : {}),
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [ogImage],
		},
		icons: {
			icon: [
				{ url: "/favicon.ico", sizes: "any" },
				{ url: "/icon-32.png", type: "image/png", sizes: "32x32" },
				{ url: "/icon-192.png", type: "image/png", sizes: "192x192" },
			],
			apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
		},
		manifest: "/manifest.webmanifest",
	}
}

/* ------------------------------------------------------------------ *
 * JSON-LD structured data
 * ------------------------------------------------------------------ */

export type PersonSchemaInput = {
	name: string
	jobTitle: string
	description: string
	image?: string | null
	email?: string | null
	telephone?: string | null
	locality?: string | null
	sameAs?: string[]
	knowsAbout?: string[]
	alumniOf?: string | null
}

export function personSchema(input: PersonSchemaInput) {
	return {
		"@context": SCHEMA_CONTEXT,
		"@type": "Person",
		name: input.name,
		url: SITE_URL,
		jobTitle: input.jobTitle,
		description: input.description,
		...(input.image ? { image: absolute(input.image) } : {}),
		...(input.email ? { email: `mailto:${input.email}` } : {}),
		...(input.telephone ? { telephone: input.telephone } : {}),
		...(input.locality
			? {
					address: {
						"@type": "PostalAddress",
						addressLocality: input.locality,
						addressCountry: "UZ",
					},
				}
			: {}),
		...(input.alumniOf
			? { alumniOf: { "@type": "CollegeOrUniversity", name: input.alumniOf } }
			: {}),
		...(input.knowsAbout?.length ? { knowsAbout: input.knowsAbout } : {}),
		...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
	}
}

export function websiteSchema(name: string, description: string) {
	return {
		"@context": SCHEMA_CONTEXT,
		"@type": "WebSite",
		name,
		description,
		url: SITE_URL,
		inLanguage: locales.map((locale) => htmlLang[locale]),
	}
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
	return {
		"@context": SCHEMA_CONTEXT,
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: absolute(item.path),
		})),
	}
}

export type CreativeWorkInput = {
	name: string
	description: string
	path: string
	image?: string | null
	author: string
	keywords?: string[]
	dateCreated?: string | number | null
}

export function creativeWorkSchema(input: CreativeWorkInput) {
	return {
		"@context": SCHEMA_CONTEXT,
		"@type": "CreativeWork",
		name: input.name,
		description: input.description,
		url: absolute(input.path),
		...(input.image ? { image: absolute(input.image) } : {}),
		author: { "@type": "Person", name: input.author, url: SITE_URL },
		...(input.keywords?.length ? { keywords: input.keywords.join(", ") } : {}),
		...(input.dateCreated ? { dateCreated: String(input.dateCreated) } : {}),
	}
}

/** Serialises JSON-LD safely for inline <script> injection. */
export function jsonLd(data: unknown): string {
	return JSON.stringify(data).replace(/</g, "\\u003c")
}
