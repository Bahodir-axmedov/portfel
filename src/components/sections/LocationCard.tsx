import { getTranslations } from "next-intl/server"
import { CalendarClock, Clock, ExternalLink, MapPin, Zap } from "lucide-react"
import { GlassCard } from "@/components/ui/interactive"
import { Reveal } from "@/components/ui/motion"
import { buttonClass } from "@/components/ui/primitives"

/**
 * Decorative road lines for the map card. The values are hardcoded rather
 * than randomised so the server pass and the client pass render identical
 * markup; a random layout here would cause a hydration mismatch.
 */
const ROADS = [
	"left-0 top-[26%] h-px w-full rotate-[-6deg]",
	"left-0 top-[64%] h-px w-full rotate-[4deg]",
	"left-[32%] top-0 h-full w-px rotate-[9deg]",
	"left-[70%] top-0 h-full w-px rotate-[-5deg]",
]

/**
 * Location and availability block for the contact section.
 *
 * The map is drawn with CSS instead of embedding Google Maps in an iframe.
 * The content security policy in `next.config.ts` declares
 * `default-src 'self'` with no `frame-src`, so a third-party iframe would be
 * blocked outright, and punching a hole in the policy for a decorative panel
 * is a bad trade. This version costs zero network requests, cannot shift
 * layout, and still sends visitors to the real map through the button.
 *
 * Working hours are UI copy rather than database rows: they change roughly
 * never, so the labels live in `messages/*.json` while the clock values are
 * locale independent.
 */
export async function LocationCard({
	location,
	timezone,
	mapUrl,
}: {
	location: string
	timezone: string
	mapUrl: string
}) {
	const t = await getTranslations("contact")

	const hours = [
		{ id: "weekdays", label: t("hoursWeekdays"), value: "09:00 — 19:00" },
		{ id: "saturday", label: t("hoursSaturday"), value: "10:00 — 16:00" },
		{ id: "sunday", label: t("hoursSunday"), value: "" },
	]

	return (
		<div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
			<Reveal className="h-full">
				<GlassCard className="group h-full overflow-hidden p-0">
					<div className="relative h-[260px] w-full overflow-hidden sm:h-[300px]">
						<span aria-hidden className="absolute inset-0 bg-base-soft" />
						<span aria-hidden className="absolute inset-0 bg-grid opacity-40" />
						<span
							aria-hidden
							className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(59,130,246,0.3),transparent_62%)]"
						/>

						{ROADS.map((road) => (
							<span
								key={road}
								aria-hidden
								className={`absolute bg-line-strong/60 ${road}`}
							/>
						))}

						{/* Pin: soft halo, slow pulse ring, glass badge. */}
						<div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2">
							<span
								aria-hidden
								className="absolute inset-0 -m-7 rounded-full bg-brand-500/25 blur-xl"
							/>
							<span
								aria-hidden
								className="absolute inset-0 -m-3 animate-ping rounded-full border border-brand-400/50"
							/>
							<span className="relative grid h-12 w-12 place-items-center rounded-full border border-brand-400/60 bg-base-raised text-brand-400 shadow-glow transition-transform duration-500 ease-premium group-hover:scale-110">
								<MapPin className="h-5 w-5" strokeWidth={1.8} />
							</span>
						</div>

						{location ? (
							<div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
								<span className="inline-flex max-w-full items-center gap-2 truncate rounded-full border border-line bg-glass px-3.5 py-1.5 text-xs font-medium text-ink backdrop-blur">
									<MapPin
										className="h-3.5 w-3.5 shrink-0 text-brand-400"
										strokeWidth={1.8}
									/>
									{location}
								</span>
							</div>
						) : null}
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 px-5 py-4">
						<div className="min-w-0">
							<p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">
								{t("mapTitle")}
							</p>
							<p className="mt-1 text-sm text-ink-muted">{t("mapHint")}</p>
						</div>

						{mapUrl ? (
							<a
								href={mapUrl}
								target="_blank"
								rel="noreferrer"
								className={buttonClass("ghost", "sm")}
							>
								<MapPin className="h-4 w-4" strokeWidth={1.8} />
								{t("openMap")}
								<ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
							</a>
						) : null}
					</div>
				</GlassCard>
			</Reveal>

			<Reveal delay={0.08} className="h-full">
				<GlassCard className="flex h-full flex-col p-5 md:p-6">
					<h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
						<CalendarClock
							className="h-4 w-4 text-brand-400"
							strokeWidth={1.8}
						/>
						{t("hoursTitle")}
					</h3>

					<ul className="mt-5 space-y-2.5">
						{hours.map((row) => (
							<li
								key={row.id}
								className="flex items-center justify-between gap-3 rounded-md border border-line/70 bg-glass px-3.5 py-3 transition duration-200 hover:border-line-strong"
							>
								<span className="text-sm text-ink-muted">{row.label}</span>
								{row.value ? (
									<span className="font-mono text-sm font-medium text-ink">
										{row.value}
									</span>
								) : (
									<span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] uppercase tracking-[0.12em] text-ink-faint">
										{t("hoursClosed")}
									</span>
								)}
							</li>
						))}
					</ul>

					<div className="mt-4 flex items-start gap-2.5 rounded-md border border-line/70 bg-base-soft px-3.5 py-3">
						<Zap
							className="mt-0.5 h-4 w-4 shrink-0 text-accent-500"
							strokeWidth={1.8}
						/>
						<div>
							<p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">
								{t("responseTitle")}
							</p>
							<p className="mt-1 text-sm font-medium text-ink">
								{t("responseValue")}
							</p>
						</div>
					</div>

					<p className="mt-auto flex flex-wrap items-center gap-1.5 pt-5 text-xs text-ink-faint">
						<Clock className="h-3.5 w-3.5" strokeWidth={1.8} />
						{t("hoursNote")}
						{timezone ? (
							<span className="font-mono text-ink-muted">({timezone})</span>
						) : null}
					</p>
				</GlassCard>
			</Reveal>
		</div>
	)
}
