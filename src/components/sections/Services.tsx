import { getTranslations } from "next-intl/server"
import { ArrowRight, Check } from "lucide-react"
import { Icon } from "@/components/ui/Icon"
import { GlassCard } from "@/components/ui/interactive"
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/motion"
import {
	buttonClass,
	Container,
	Section,
	SectionHeading,
} from "@/components/ui/primitives"
import { pick, pickArray } from "@/lib/i18n-content"
import type { Locale } from "@/i18n/routing"

type ServiceRow = Record<string, unknown> & {
	id: string
	icon?: string | null
}

export async function Services({
	services,
	locale,
}: {
	services: ServiceRow[]
	locale: Locale
}) {
	const t = await getTranslations("services")
	if (services.length === 0) return null

	return (
		<Section id="services">
			<Container>
				<Reveal>
					<SectionHeading
						eyebrow={t("eyebrow")}
						title={t("title")}
						description={t("subtitle")}
						actions={
							<a href="#contact" className={buttonClass("secondary", "md")}>
								{t("cta")}
								<ArrowRight className="h-4 w-4" strokeWidth={1.8} />
							</a>
						}
					/>
				</Reveal>

				<StaggerGroup
					step={0.06}
					className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
				>
					{services.map((service) => {
						const bullets = pickArray(service, "bullets", locale)

						return (
							<StaggerItem key={service.id} className="h-full">
								<GlassCard className="group h-full p-6">
									<div className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-brand-gradient-soft text-brand-400 transition-all duration-300 group-hover:border-brand-500/50 group-hover:text-ink">
										<Icon
											name={service.icon}
											className="h-[18px] w-[18px]"
											strokeWidth={1.6}
										/>
									</div>

									<h3 className="mt-5 text-[15.5px] font-semibold tracking-tight text-ink">
										{pick(service, "title", locale)}
									</h3>
									<p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-muted">
										{pick(service, "description", locale)}
									</p>

									{bullets.length > 0 ? (
										<ul className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
											{bullets.map((bullet) => (
												<li
													key={bullet}
													className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-faint"
												>
													<Check
														className="mt-[3px] h-3 w-3 shrink-0 text-brand-400"
														strokeWidth={2.2}
													/>
													{bullet}
												</li>
											))}
										</ul>
									) : null}
								</GlassCard>
							</StaggerItem>
						)
					})}
				</StaggerGroup>
			</Container>
		</Section>
	)
}
