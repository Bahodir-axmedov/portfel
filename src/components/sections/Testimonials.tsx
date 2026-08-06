import { getTranslations } from "next-intl/server"
import { Info, Quote, Star } from "lucide-react"
import { GlassCard } from "@/components/ui/interactive"
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/motion"
import { Container, Section, SectionHeading } from "@/components/ui/primitives"
import { pick } from "@/lib/i18n-content"
import { initials } from "@/lib/utils"
import type { Locale } from "@/i18n/routing"

type TestimonialRow = Record<string, unknown> & {
	id: string
	author: string
	role?: string | null
	company?: string | null
	rating?: number | null
	isPlaceholder?: boolean | null
}

/**
 * Real testimonials replace the seeded placeholders as soon as they are added
 * from the admin panel — the placeholder notice disappears automatically.
 */
export async function Testimonials({
	items,
	locale,
}: {
	items: TestimonialRow[]
	locale: Locale
}) {
	const t = await getTranslations("testimonials")
	if (items.length === 0) return null

	const hasPlaceholders = items.some((item) => item.isPlaceholder === true)

	return (
		<Section id="testimonials">
			<Container>
				<Reveal>
					<SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
				</Reveal>

				{hasPlaceholders ? (
					<Reveal delay={0.05}>
						<div className="mt-6 flex items-start gap-2.5 rounded-md border border-line bg-glass px-4 py-3">
							<Info
								className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
								strokeWidth={1.8}
							/>
							<p className="text-sm leading-relaxed text-ink-muted">
								{t("placeholderNotice")}
							</p>
						</div>
					</Reveal>
				) : null}

				<StaggerGroup
					step={0.08}
					className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
				>
					{items.map((item) => {
						const author = String(item.author ?? "")
						const rating = Math.max(0, Math.min(5, Number(item.rating ?? 5)))
						const meta = [item.role, item.company]
							.filter(Boolean)
							.map((value) => String(value))
							.join(" · ")

						return (
							<StaggerItem key={item.id}>
								<GlassCard className="flex h-full flex-col p-5 md:p-6">
									<Quote
										className="h-5 w-5 text-brand-400/70"
										strokeWidth={1.6}
									/>

									<p className="mt-3.5 flex-1 text-sm leading-relaxed text-ink-muted">
										{pick(item, "quote", locale)}
									</p>

									<div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
										<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-[11px] font-bold tracking-wide text-white">
											{initials(author)}
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold text-ink">
												{author}
											</p>
											{meta ? (
												<p className="truncate text-xs text-ink-faint">{meta}</p>
											) : null}
										</div>
										<div className="flex shrink-0 gap-0.5" aria-label={`${rating}/5`}>
											{Array.from({ length: rating }).map((_, star) => (
												<Star
													key={star}
													className="h-3 w-3 fill-warning text-warning"
													strokeWidth={1.5}
												/>
											))}
										</div>
									</div>
								</GlassCard>
							</StaggerItem>
						)
					})}
				</StaggerGroup>
			</Container>
		</Section>
	)
}
