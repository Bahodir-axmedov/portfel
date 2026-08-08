import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import { Award, Briefcase, GraduationCap, Route, Trophy } from "lucide-react"
import { Icon } from "@/components/ui/Icon"
import { GlassCard } from "@/components/ui/interactive"
import {
	Reveal,
	slideLeft,
	slideRight,
	StaggerGroup,
	StaggerItem,
} from "@/components/ui/motion"
import {
	Badge,
	Container,
	EmptyState,
	Section,
	SectionHeading,
} from "@/components/ui/primitives"
import { TimelineRail } from "./TimelineRail"
import { pick, pickArray } from "@/lib/i18n-content"
import { parseArray } from "@/lib/utils"
import type { Locale } from "@/i18n/routing"

const LOCALE_TAGS: Record<string, string> = {
	uz: "uz-UZ",
	ru: "ru-RU",
	en: "en-US",
}

/** Short month + year, always resolved in the author's own timezone. */
function monthYear(value: unknown, locale: Locale): string {
	if (!value) return ""
	const date = value instanceof Date ? value : new Date(String(value))
	if (Number.isNaN(date.getTime())) return ""
	return new Intl.DateTimeFormat(LOCALE_TAGS[locale] ?? LOCALE_TAGS.uz, {
		month: "short",
		year: "numeric",
		timeZone: "Asia/Tashkent",
	}).format(date)
}

function GroupTitle({ icon, label }: { icon: ReactNode; label: string }) {
	return (
		<div className="flex items-center gap-2.5">
			<span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-glass text-brand-400">
				{icon}
			</span>
			<h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
				{label}
			</h3>
		</div>
	)
}

function Bullets({ items }: { items: string[] }) {
	if (items.length === 0) return null
	return (
		<ul className="mt-3 space-y-1.5">
			{items.map((line) => (
				<li
					key={line}
					className="flex gap-2 text-sm leading-relaxed text-ink-muted"
				>
					<span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-accent-500" />
					<span>{line}</span>
				</li>
			))}
		</ul>
	)
}

type Row = Record<string, unknown> & { id: string }

export async function Journey({
	experiences,
	education,
	certificates,
	achievements,
	timeline,
	locale,
}: {
	experiences: Row[]
	education: Row[]
	certificates: Row[]
	achievements: Row[]
	timeline: Row[]
	locale: Locale
}) {
	const t = await getTranslations("timeline")

	return (
		<Section id="journey">
			<Container>
				<Reveal>
					<SectionHeading
						eyebrow={t("eyebrow")}
						title={t("title")}
						description={t("subtitle")}
					/>
				</Reveal>

				<div className="mt-11 grid gap-11 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
					<div className="space-y-10">
						{experiences.length > 0 ? (
							<div>
								<GroupTitle
									icon={<Briefcase className="h-4 w-4" strokeWidth={1.7} />}
									label={t("experience")}
								/>
								<StaggerGroup step={0.08} className="mt-5 space-y-4">
									{experiences.map((item) => {
										const highlights = pickArray(item, "highlights", locale)
										const stack = parseArray(item.stack)
										const description = pick(item, "description", locale)

										return (
											<StaggerItem key={item.id} variant={slideLeft}>
												<GlassCard className="p-5 md:p-6">
													<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
														<div className="min-w-0">
															<h4 className="text-base font-semibold text-ink">
																{pick(item, "role", locale)}
															</h4>
															<p className="mt-0.5 text-sm text-ink-muted">
																{String(item.company ?? "")}
															</p>
														</div>
														<span className="shrink-0 text-xs font-medium tabular-nums text-ink-faint">
															{monthYear(item.startDate, locale)}
															{" — "}
															{item.current
																? t("present")
																: monthYear(item.endDate, locale)}
														</span>
													</div>

													<div className="mt-3.5 flex flex-wrap gap-1.5">
														<Badge tone="brand">
															{t(
																`employment.${String(item.employment ?? "full_time")}`,
															)}
														</Badge>
														<Badge tone="muted">
															{t(
																`locationType.${String(item.locationType ?? "onsite")}`,
															)}
														</Badge>
														{item.location ? (
															<Badge tone="neutral">
																{String(item.location)}
															</Badge>
														) : null}
													</div>

													{description ? (
														<p className="mt-3.5 text-sm leading-relaxed text-ink-muted">
															{description}
														</p>
													) : null}

													<Bullets items={highlights} />

													{stack.length > 0 ? (
														<div className="mt-4 flex flex-wrap gap-1.5">
															{stack.map((tech) => (
																<span
																	key={tech}
																	className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-ink-faint"
																>
																	{tech}
																</span>
															))}
														</div>
													) : null}
												</GlassCard>
											</StaggerItem>
										)
									})}
								</StaggerGroup>
							</div>
						) : null}

						{education.length > 0 ? (
							<div>
								<GroupTitle
									icon={<GraduationCap className="h-4 w-4" strokeWidth={1.7} />}
									label={t("education")}
								/>
								<StaggerGroup step={0.08} className="mt-5 space-y-4">
									{education.map((item) => {
										const field = pick(item, "field", locale)
										const description = pick(item, "description", locale)

										return (
											<StaggerItem key={item.id} variant={slideLeft}>
												<GlassCard className="p-5 md:p-6">
													<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
														<div className="min-w-0">
															<h4 className="text-base font-semibold text-ink">
																{pick(item, "school", locale)}
															</h4>
															<p className="mt-0.5 text-sm text-ink-muted">
																{pick(item, "degree", locale)}
															</p>
															{field ? (
																<p className="mt-1.5 text-sm font-medium text-brand-400">
																	{field}
																</p>
															) : null}
														</div>
														<span className="shrink-0 text-xs font-medium tabular-nums text-ink-faint">
															{String(item.startYear ?? "")}
															{" — "}
															{item.current
																? t("present")
																: String(item.endYear ?? "")}
														</span>
													</div>
													{description ? (
														<p className="mt-3.5 text-sm leading-relaxed text-ink-muted">
															{description}
														</p>
													) : null}
												</GlassCard>
											</StaggerItem>
										)
									})}
								</StaggerGroup>
							</div>
						) : null}
					</div>

					{timeline.length > 0 ? (
						<div>
							<GroupTitle
								icon={<Route className="h-4 w-4" strokeWidth={1.7} />}
								label={t("journey")}
							/>
							<TimelineRail>
								<StaggerGroup step={0.06} className="space-y-7">
									{timeline.map((event) => {
										const bullets = pickArray(event, "bullets", locale)
										const description = pick(event, "description", locale)

										return (
											<StaggerItem key={event.id} variant={slideRight}>
												<div className="relative">
													<span
														aria-hidden
														className="absolute -left-8 top-1 grid h-[21px] w-[21px] place-items-center rounded-full border border-line-strong bg-base-raised"
													>
														<span className="h-[7px] w-[7px] rounded-full bg-brand-gradient" />
													</span>

													<div className="flex items-center gap-2">
														<span className="text-sm font-semibold tabular-nums text-brand-400">
															{String(event.year ?? "")}
														</span>
														<Icon
															name={String(event.icon ?? "Milestone")}
															className="h-3.5 w-3.5 text-ink-faint"
															strokeWidth={1.8}
														/>
													</div>

													<h4 className="mt-1 text-[15px] font-semibold text-ink">
														{pick(event, "title", locale)}
													</h4>
													{description ? (
														<p className="mt-1 text-sm leading-relaxed text-ink-muted">
															{description}
														</p>
													) : null}
													<Bullets items={bullets} />
												</div>
											</StaggerItem>
										)
									})}
								</StaggerGroup>
							</TimelineRail>
						</div>
					) : null}
				</div>

				<div className="mt-12 grid gap-6 md:grid-cols-2">
					<div>
						<GroupTitle
							icon={<Award className="h-4 w-4" strokeWidth={1.7} />}
							label={t("certificates")}
						/>
						<div className="mt-5">
							{certificates.length === 0 ? (
								<EmptyState
									title={t("certificates")}
									description={t("emptyCertificates")}
								/>
							) : (
								<StaggerGroup step={0.06} className="grid gap-3">
									{certificates.map((item) => (
										<StaggerItem key={item.id} variant={slideLeft}>
											<GlassCard className="p-4">
												<h4 className="text-sm font-semibold text-ink">
													{pick(item, "title", locale)}
												</h4>
												<p className="mt-1 text-xs text-ink-faint">
													{[
														String(item.issuer ?? ""),
														monthYear(item.issueDate, locale),
													]
														.filter(Boolean)
														.join(" · ")}
												</p>
											</GlassCard>
										</StaggerItem>
									))}
								</StaggerGroup>
							)}
						</div>
					</div>

					<div>
						<GroupTitle
							icon={<Trophy className="h-4 w-4" strokeWidth={1.7} />}
							label={t("achievements")}
						/>
						<div className="mt-5">
							{achievements.length === 0 ? (
								<EmptyState
									title={t("achievements")}
									description={t("emptyAchievements")}
								/>
							) : (
								<StaggerGroup step={0.06} className="grid gap-3">
									{achievements.map((item) => (
										<StaggerItem key={item.id} variant={slideLeft}>
											<GlassCard className="flex items-start gap-3 p-4">
												<Icon
													name={String(item.icon ?? "Trophy")}
													className="mt-0.5 h-4 w-4 shrink-0 text-accent-400"
													strokeWidth={1.8}
												/>
												<div className="min-w-0">
													<h4 className="text-sm font-semibold text-ink">
														{pick(item, "title", locale)}
													</h4>
													<p className="mt-1 text-xs leading-relaxed text-ink-faint">
														{pick(item, "description", locale)}
													</p>
												</div>
											</GlassCard>
										</StaggerItem>
									))}
								</StaggerGroup>
							)}
						</div>
					</div>
				</div>
			</Container>
		</Section>
	)
}
