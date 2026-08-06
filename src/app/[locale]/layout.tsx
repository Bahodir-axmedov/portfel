import type { Metadata } from "next"
import type { ReactNode } from "react"
import Script from "next/script"
import { notFound } from "next/navigation"
import { Inter, JetBrains_Mono } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import {
	AmbientBackground,
	Cursor,
	LoadingScreen,
	ScrollProgress,
	SmoothScroll,
} from "@/components/layout/SiteChrome"
import { SITE_NAME } from "@/constants"
import { GA_ID, gaEnabled } from "@/lib/analytics"
import { pick } from "@/lib/i18n-content"
import { getProfile, getSeoForRoute, getSocialLinks } from "@/lib/queries"
import { buildMetadata, jsonLd, personSchema, websiteSchema } from "@/lib/seo"
import { parseArray } from "@/lib/utils"
import { htmlLang, isLocale, type Locale } from "@/i18n/routing"
import "../globals.css"

/* Content is served from SQLite and edited live from the admin panel, so the
   public pages are rendered per request instead of frozen at build time. */
export const dynamic = "force-dynamic"

const GTAG_SRC = "https:" + "//" + "www.googletagmanager.com/gtag/js?id="

const sans = Inter({
	subsets: ["latin", "cyrillic"],
	display: "swap",
	variable: "--font-sans",
})

const mono = JetBrains_Mono({
	subsets: ["latin", "cyrillic"],
	display: "swap",
	variable: "--font-mono",
})

function resumeField(locale: Locale) {
	if (locale === "ru") return "resumeRu"
	if (locale === "en") return "resumeEn"
	return "resumeUz"
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale: raw } = await params
	const locale: Locale = isLocale(raw) ? raw : "uz"

	const [profile, seo] = await Promise.all([getProfile(), getSeoForRoute("/")])

	const jobTitle = pick(profile, "jobTitle", locale)
	const fallbackTitle = profile?.fullName
		? `${profile.fullName} — ${jobTitle}`
		: SITE_NAME

	return buildMetadata({
		locale,
		path: "/",
		title: pick(seo, "title", locale) || fallbackTitle,
		description:
			pick(seo, "description", locale) || pick(profile, "shortBio", locale),
		keywords: parseArray(seo?.keywords),
		image:
			seo?.ogImage ?? (profile?.ogImage as string | null | undefined) ?? null,
		noIndex: seo?.noIndex ?? false,
		type: "profile",
	})
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale: raw } = await params
	if (!isLocale(raw)) notFound()
	const locale: Locale = raw

	const [messages, profile, socialLinks] = await Promise.all([
		getMessages({ locale }),
		getProfile(),
		getSocialLinks(),
	])

	const resumeUrl = (profile?.[resumeField(locale)] as string | null) ?? null
	const description = pick(profile, "shortBio", locale)

	const structuredData = [
		personSchema({
			name: profile?.fullName ?? SITE_NAME,
			jobTitle: pick(profile, "jobTitle", locale),
			description,
			image: profile?.avatarUrl ?? null,
			email: profile?.email ?? null,
			telephone: profile?.phone ?? null,
			locality: pick(profile, "location", locale),
			sameAs: socialLinks.map((social) => social.url),
			knowsAbout: parseArray(profile?.interests),
		}),
		websiteSchema(SITE_NAME, description),
	]

	return (
		<html
			lang={htmlLang[locale]}
			className={`${sans.variable} ${mono.variable}`}
			suppressHydrationWarning
		>
			<body>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
				/>

				<a
					href="#main"
					className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-md focus:border focus:border-line-strong focus:bg-base-raised focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
				>
					Skip to content
				</a>

				<NextIntlClientProvider
					locale={locale}
					messages={messages}
					timeZone="Asia/Tashkent"
				>
					<LoadingScreen />
					<AmbientBackground />
					<ScrollProgress />
					<Cursor />

					<SmoothScroll>
						<Navbar resumeUrl={resumeUrl} />
						<main id="main" className="relative">
							{children}
						</main>
						<Footer
							profile={profile}
							socialLinks={socialLinks}
							locale={locale}
						/>
					</SmoothScroll>
				</NextIntlClientProvider>

				{gaEnabled ? (
					<>
						<Script src={GTAG_SRC + GA_ID} strategy="afterInteractive" />
						<Script id="ga-init" strategy="afterInteractive">
							{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
						</Script>
					</>
				) : null}
			</body>
		</html>
	)
}
