import { getTranslations } from "next-intl/server"
import { Hero } from "@/components/sections/Hero"
import { About } from "@/components/sections/About"
import { Services } from "@/components/sections/Services"
import { Skills } from "@/components/sections/Skills"
import { Projects } from "@/components/sections/Projects"
import { Stats } from "@/components/sections/Stats"
import { Journey } from "@/components/sections/Journey"
import { Gallery } from "@/components/sections/Gallery"
import { Testimonials } from "@/components/sections/Testimonials"
import { Contact } from "@/components/sections/Contact"
import { pick } from "@/lib/i18n-content"
import { getHomeData } from "@/lib/queries"
import { parseArray } from "@/lib/utils"
import { isLocale, type Locale } from "@/i18n/routing"

export const dynamic = "force-dynamic"

function resumeFor(
	profile: Record<string, unknown> | null,
	locale: Locale,
): string | null {
	if (!profile) return null
	const field =
		locale === "ru" ? "resumeRu" : locale === "en" ? "resumeEn" : "resumeUz"
	return (profile[field] as string | null) ?? null
}

export default async function HomePage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale: raw } = await params
	const locale: Locale = isLocale(raw) ? raw : "uz"

	const [t, data] = await Promise.all([getTranslations("hero"), getHomeData()])

	const { profile } = data

	const heroSocials = data.socialLinks
		.filter((social) => social.showInHero)
		.map((social) => ({
			platform: social.platform,
			label: social.label,
			url: social.url,
			icon: social.icon,
		}))

	/* The three headline numbers next to the hero come straight from the same
	   editable stats that power the statistics band further down the page. */
	const highlights = data.stats.slice(0, 3).map((stat) => ({
		label: pick(stat, "label", locale),
		value: `${stat.value}${stat.suffix ?? ""}`,
	}))

	return (
		<>
			<Hero
				fullName={profile?.fullName ?? ""}
				headline={t("headline")}
				subheadline={t("subheadline")}
				roles={parseArray(profile?.typingRoles)}
				photo={
					profile?.heroImage || profile?.avatarUrl || "/images/profile.png"
				}
				location={pick(profile, "location", locale)}
				openToWork={profile?.availability === "open_to_work"}
				resumeUrl={resumeFor(profile, locale)}
				socials={heroSocials}
				highlights={highlights}
			/>

			<About profile={profile} locale={locale} />

			<Services services={data.services} locale={locale} />

			<Skills skills={data.skills} languages={data.languages} locale={locale} />

			<Projects projects={data.projects} locale={locale} limit={3} />

			<Stats stats={data.stats} locale={locale} />

			<Journey
				experiences={data.experiences}
				education={data.education}
				certificates={data.certificates}
				achievements={data.achievements}
				timeline={data.timeline}
				locale={locale}
			/>

			<Gallery items={data.gallery} locale={locale} />

			<Testimonials items={data.testimonials} locale={locale} />

			<Contact
				profile={profile}
				socialLinks={data.socialLinks}
				qrCodes={data.qrCodes}
				locale={locale}
			/>
		</>
	)
}
