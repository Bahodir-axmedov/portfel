import { getTranslations } from "next-intl/server"
import { Icon } from "@/components/ui/Icon"
import { Counter, GlassCard } from "@/components/ui/interactive"
import { blurUp, StaggerGroup, StaggerItem } from "@/components/ui/motion"
import { Container, Section } from "@/components/ui/primitives"
import { pick } from "@/lib/i18n-content"
import type { Locale } from "@/i18n/routing"

type StatRow = Record<string, unknown> & {
	id: string
	key: string
	value: number
	suffix?: string | null
	icon?: string | null
}

export async function Stats({
	stats,
	locale,
}: {
	stats: StatRow[]
	locale: Locale
}) {
	const t = await getTranslations("stats")
	if (stats.length === 0) return null

	return (
		<Section className="py-[56px] md:py-[72px]">
			<Container>
				<StaggerGroup
					step={0.07}
					className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5"
				>
					{stats.map((stat) => (
						<StaggerItem key={stat.id} variant={blurUp} className="h-full">
							<GlassCard className="group h-full p-5">
								<span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-line bg-white/[0.03] text-brand-400 transition-colors duration-300 group-hover:border-brand-500/45">
									<Icon
										name={stat.icon}
										className="h-3.5 w-3.5"
										strokeWidth={1.8}
									/>
								</span>

								<p className="mt-4 text-[30px] font-semibold leading-none tracking-[-0.03em]">
									<Counter
										value={stat.value}
										suffix={stat.suffix ?? ""}
										className="gradient-text"
									/>
								</p>
								<p className="mt-2 text-[12.5px] leading-snug text-ink-muted">
									{pick(stat, "label", locale)}
								</p>
							</GlassCard>
						</StaggerItem>
					))}
				</StaggerGroup>

				<p className="sr-only">
					{t("title")} — {t("subtitle")}
				</p>
			</Container>
		</Section>
	)
}
