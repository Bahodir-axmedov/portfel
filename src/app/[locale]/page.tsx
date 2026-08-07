import type { ReactNode } from "react"
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
import { SectionBoundary } from "@/components/ui/SectionBoundary"
import { pick } from "@/lib/i18n-content"
import { getHomeData } from "@/lib/queries"
import { parseArray } from "@/lib/utils"
import { isLocale, type Locale } from "@/i18n/routing"

export const dynamic = "force-dynamic"

/**
 * React masks Server Component errors in production builds: the browser and the
 * default server log only receive an opaque digest, and `onRequestError`
 * receives the already-wrapped error whose stack is empty. The only place the
 * original error still exists is inside the component body that threw.
 *
 * Every section below is an async Server Component, so its body can be executed
 * inside a try/catch by invoking it directly and awaiting the result. The
 * rendered output is identical to `<About ... />`; the only difference is that
 * a failure is written to stderr with its real name, message, cause chain and
 * stack before it is re-thrown to the nearest error boundary.
 *
 * `Promise.all` keeps the sections resolving concurrently, so this adds no
 * latency, and on a successful render it produces no output at all.
 */
async function section(
	name: string,
	render: () => Promise<ReactNode>,
): Promise<ReactNode> {
	try {
		return await render()
	} catch (error) {
		const bar = "=".repeat(72)
		const lines = ["", bar, `[section:${name}] RENDER FAILED`, bar]

		let current: unknown = error
		let depth = 0
		while (current instanceof Error && depth < 5) {
			const pad = "  ".repeat(depth)
			lines.push(`${pad}name    : ${current.name}`)
			lines.push(`${pad}message : ${current.message}`)
			const code = (current as Error & { code?: unknown }).code
			if (code !== undefined) lines.push(`${pad}code    : ${String(code)}`)
			if (current.stack) {
				lines.push(`${pad}stack   :`)
				for (const entry of current.stack.split("\n").slice(0, 14)) {
					lines.push(`${pad}  ${entry.trim()}`)
				}
			}
			current = current.cause
			depth += 1
			if (current !== undefined)
				lines.push(`${"  ".repeat(depth - 1)}cause   :`)
		}

		if (!(error instanceof Error)) {
			lines.push(`thrown  : ${String(error)}`)
		}

		lines.push(bar, "")
		process.stderr.write(`${lines.join("\n")}\n`)
		throw error
	}
}

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

	const [
		aboutNode,
		servicesNode,
		skillsNode,
		projectsNode,
		statsNode,
		journeyNode,
		galleryNode,
		testimonialsNode,
		contactNode,
	] = await Promise.all([
		section("About", () => About({ profile, locale })),
		section("Services", () => Services({ services: data.services, locale })),
		section("Skills", () =>
			Skills({ skills: data.skills, languages: data.languages, locale }),
		),
		section("Projects", () =>
			Projects({ projects: data.projects, locale, limit: 3 }),
		),
		section("Stats", () => Stats({ stats: data.stats, locale })),
		section("Journey", () =>
			Journey({
				experiences: data.experiences,
				education: data.education,
				certificates: data.certificates,
				achievements: data.achievements,
				timeline: data.timeline,
				locale,
			}),
		),
		section("Gallery", () => Gallery({ items: data.gallery, locale })),
		section("Testimonials", () =>
			Testimonials({ items: data.testimonials, locale }),
		),
		section("Contact", () =>
			Contact({
				profile,
				socialLinks: data.socialLinks,
				qrCodes: data.qrCodes,
				locale,
			}),
		),
	])

	/* Each section is additionally wrapped in a client error boundary. The
	   `section()` helper above only sees failures inside the async Server
	   Component bodies; anything that throws while React renders the client
	   components to HTML (Hero, SkillsBoard, GalleryGrid, ContactForm and the
	   motion primitives) surfaces here instead of taking down the whole route. */
	return (
		<>
			<SectionBoundary name="Hero">
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
			</SectionBoundary>

			<SectionBoundary name="About">{aboutNode}</SectionBoundary>
			<SectionBoundary name="Services">{servicesNode}</SectionBoundary>
			<SectionBoundary name="Skills">{skillsNode}</SectionBoundary>
			<SectionBoundary name="Projects">{projectsNode}</SectionBoundary>
			<SectionBoundary name="Stats">{statsNode}</SectionBoundary>
			<SectionBoundary name="Journey">{journeyNode}</SectionBoundary>
			<SectionBoundary name="Gallery">{galleryNode}</SectionBoundary>
			<SectionBoundary name="Testimonials">{testimonialsNode}</SectionBoundary>
			<SectionBoundary name="Contact">{contactNode}</SectionBoundary>
		</>
	)
}
