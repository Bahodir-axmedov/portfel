import { getTranslations } from "next-intl/server"
import { CalendarDays, Clock, Compass, MapPin, Quote, Sparkles } from "lucide-react"
import { GlassCard } from "@/components/ui/interactive"
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/motion"
import { Badge, Container, Section, SectionHeading } from "@/components/ui/primitives"
import { pick, pickArray } from "@/lib/i18n-content"
import { calculateAge, yearsSince } from "@/lib/utils"
import type { Locale } from "@/i18n/routing"

type ProfileRow = Record<string, unknown> & {
	birthDate?: Date | string | null
	codingSince?: number | null
	timezone?: string | null
	remoteOk?: boolean | null
}

export async function About({
	profile,
	locale,
}: {
	profile: ProfileRow | null
	locale: Locale
}) {
	const t = await getTranslations("about")
	if (!profile) return null

	const fullBio = pick(profile, "fullBio", locale)
	const paragraphs = fullBio
		.split(/\n{2,}|\n/)
		.map((item) => item.trim())
		.filter(Boolean)

	const philosophy = pick(profile, "philosophy", locale)
	const goals = pick(profile, "goals", locale)
	const motto = pick(profile, "motto", locale)
	const interests = pickArray(profile, "interests", locale)

	const age = profile.birthDate ? calculateAge(profile.birthDate as string | Date) : null
	const years = profile.codingSince ? yearsSince(profile.codingSince) : null

	const facts = [
		age !== null && {
			icon: CalendarDays,
			label: t("age"),
			value: t("ageValue", { age }),
		},
		{
			icon: MapPin,
			label: t("location"),
			value: pick(profile, "location", locale),
		},
		{
			icon: Compass,
			label: t("birthPlace"),
			value: pick(profile, "birthPlace", locale),
		},
		years !== null && {
			icon: Sparkles,
			label: t("experience"),
			value: t("experienceValue", { years }),
		},
		profile.timezone && {
			icon: Clock,
			// The label must be translated like every other fact. It previously
			// read "UTC+5", which hardcoded one offset as if it were a caption and
			// would have become wrong the moment the timezone field changed.
			label: t("timezone"),
			value: String(profile.timezone),
		},
	].filter(Boolean) as Array<{
		icon: typeof MapPin
		label: string
		value: string
	}>

	return (
		<Section id="about">
			<Container>
				<Reveal>
					<SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
				</Reveal>

				<div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
					{/* Narrative */}
					<Reveal className="flex flex-col gap-6">
						<GlassCard className="p-7 md:p-9">
							<div className="flex flex-col gap-5">
								{paragraphs.map((paragraph, index) => (
									<p
										key={index}
										className="text-[15.5px] leading-[1.75] text-ink-muted"
									>
										{paragraph}
									</p>
								))}
							</div>

							{motto ? (
								<figure className="mt-8 flex gap-3.5 border-l-2 border-brand-500/60 pl-5">
									<Quote
										aria-hidden
										className="mt-1 h-4 w-4 shrink-0 text-brand-400"
										strokeWidth={1.8}
									/>
									<blockquote className="text-[16px] font-medium italic leading-relaxed tracking-tight text-ink">
										{motto}
									</blockquote>
								</figure>
							) : null}
						</GlassCard>

						<div className="grid gap-6 sm:grid-cols-2">
							{philosophy ? (
								<GlassCard className="p-6">
									<h3 className="text-[14px] font-semibold tracking-tight text-ink">
										{t("philosophy")}
									</h3>
									<p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
										{philosophy}
									</p>
								</GlassCard>
							) : null}
							{goals ? (
								<GlassCard className="p-6">
									<h3 className="text-[14px] font-semibold tracking-tight text-ink">
										{t("goals")}
									</h3>
									<p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
										{goals}
									</p>
								</GlassCard>
							) : null}
						</div>
					</Reveal>

					{/* Facts + interests */}
					<Reveal delay={0.1} className="flex flex-col gap-6">
						<GlassCard className="p-6">
							<StaggerGroup className="flex flex-col divide-y divide-white/[0.06]">
								{facts.map((fact) => {
									const FactIcon = fact.icon
									return (
										<StaggerItem
											key={fact.label}
											className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
										>
											<span className="inline-flex items-center gap-2.5 text-[13px] text-ink-faint">
												<FactIcon className="h-4 w-4" strokeWidth={1.6} />
												{fact.label}
											</span>
											<span className="text-right text-[13.5px] font-medium tracking-tight text-ink">
												{fact.value}
											</span>
										</StaggerItem>
									)
								})}
							</StaggerGroup>

							<div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
								<Badge tone="success">{t("openToWork")}</Badge>
								{profile.remoteOk ? <Badge tone="brand">{t("remote")}</Badge> : null}
							</div>
						</GlassCard>

						{interests.length > 0 ? (
							<GlassCard className="p-6">
								<h3 className="text-[14px] font-semibold tracking-tight text-ink">
									{t("interests")}
								</h3>
								<ul className="mt-4 flex flex-wrap gap-2">
									{interests.map((interest) => (
										<li key={interest}>
											<span className="inline-flex rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-[12.5px] tracking-tight text-ink-muted transition-colors duration-300 hover:border-brand-500/40 hover:text-ink">
												{interest}
											</span>
										</li>
									))}
								</ul>
							</GlassCard>
						) : null}
					</Reveal>
				</div>
			</Container>
		</Section>
	)
}
