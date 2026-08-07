"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { useAnimationEnabled, useCounter } from "@/hooks"
import { cn } from "@/lib/utils"

const EASE_OUT = [0.16, 1, 0.3, 1] as const

/* ------------------------------------------------------------------ *
 * Counting stat value
 * ------------------------------------------------------------------ */

/**
 * Counts up to `value` when the card scrolls into view.
 *
 * `useCounter` returns a float mid-flight, so it is rounded here rather than
 * inside the hook: the hook is also used for decimal figures elsewhere, and
 * rounding at the source would break those.
 */
export function StatValue({ value }: { value: number }) {
	const ref = useRef<HTMLSpanElement>(null)
	const inView = useInView(ref, { once: true, margin: "-10% 0px" })
	const current = useCounter(value, inView, 1100)

	return (
		<span ref={ref} className="tabular-nums">
			{Math.round(current).toLocaleString("uz-UZ")}
		</span>
	)
}

/* ------------------------------------------------------------------ *
 * Daily traffic chart
 * ------------------------------------------------------------------ */

export type TrafficPoint = { date: string; views: number }

/**
 * Daily page-view bars.
 *
 * Design notes:
 *
 * - Bars animate `scaleY` from a bottom origin rather than `height`, so the
 *   growth is composited instead of forcing a layout pass per frame across
 *   thirty elements.
 * - The stagger is capped with `Math.min(index * 0.018, 0.5)`. With a 90-day
 *   range a naive per-index delay would push the last bar past four seconds,
 *   which stops reading as one motion and starts reading as a slow loop.
 * - The tooltip is React state on a single shared element, not one hidden node
 *   per bar. Thirty always-mounted absolutely-positioned tooltips is wasted
 *   DOM, and the native `title` attribute is kept as the accessible fallback.
 */
export function TrafficChart({ data }: { data: TrafficPoint[] }) {
	const animate = useAnimationEnabled()
	const ref = useRef<HTMLDivElement>(null)
	const inView = useInView(ref, { once: true, margin: "-10% 0px" })
	const [hovered, setHovered] = useState<TrafficPoint | null>(null)

	if (data.length === 0) {
		return (
			<p className="py-8 text-center text-xs text-ink-faint">
				Hozircha tashrif qayd etilmagan.
			</p>
		)
	}

	const max = Math.max(...data.map((point) => point.views), 1)

	return (
		<div>
			<div className="mb-2 flex h-5 items-center justify-end">
				{hovered ? (
					<span className="rounded-md border border-line bg-base-raised px-2 py-0.5 font-mono text-[10.5px] text-ink">
						{hovered.date} — {hovered.views}
					</span>
				) : null}
			</div>

			<div
				ref={ref}
				className="flex h-32 items-end gap-[3px]"
				onMouseLeave={() => setHovered(null)}
			>
				{data.map((point, index) => {
					const ratio = Math.max(0.03, point.views / max)
					const empty = point.views === 0

					return (
						<div
							key={point.date}
							className="group relative flex h-full flex-1 items-end"
							onMouseEnter={() => setHovered(point)}
							title={`${point.date}: ${point.views}`}
						>
							<motion.div
								className={cn(
									"w-full rounded-t bg-brand-gradient transition-opacity duration-200 group-hover:opacity-100",
									empty ? "opacity-[0.16]" : "opacity-80",
								)}
								style={{
									height: `${Math.round(ratio * 100)}%`,
									transformOrigin: "bottom",
								}}
								initial={animate ? { scaleY: 0 } : false}
								animate={inView || !animate ? { scaleY: 1 } : { scaleY: 0 }}
								transition={{
									duration: 0.6,
									ease: EASE_OUT,
									delay: Math.min(index * 0.018, 0.5),
								}}
							/>
						</div>
					)
				})}
			</div>

			<div className="mt-2 flex justify-between font-mono text-[10px] text-ink-faint">
				<span>{data[0]?.date ?? ""}</span>
				<span>{data[data.length - 1]?.date ?? ""}</span>
			</div>
		</div>
	)
}

/* ------------------------------------------------------------------ *
 * Horizontal bar list
 * ------------------------------------------------------------------ */

/**
 * Ranked horizontal bars (top pages, locales, referrers).
 *
 * The fill animates `scaleX` from a left origin for the same compositing reason
 * as the traffic chart. The label row is rendered immediately and only the fill
 * animates, so the numbers are readable before the motion finishes.
 */
export function AnimatedBarList({
	items,
}: {
	items: Array<{ label: string; value: number }>
}) {
	const animate = useAnimationEnabled()
	const ref = useRef<HTMLUListElement>(null)
	const inView = useInView(ref, { once: true, margin: "-10% 0px" })

	if (items.length === 0) {
		return <p className="text-xs text-ink-faint">Ma&apos;lumot yo&apos;q.</p>
	}

	const max = Math.max(...items.map((item) => item.value), 1)

	return (
		<ul ref={ref} className="space-y-2.5">
			{items.map((item, index) => (
				<li key={item.label} className="group space-y-1">
					<div className="flex items-baseline justify-between gap-3 text-xs">
						<span className="truncate text-ink-muted transition-colors group-hover:text-ink">
							{item.label}
						</span>
						<span className="shrink-0 tabular-nums text-ink-faint">
							{item.value}
						</span>
					</div>
					<div className="h-1.5 overflow-hidden rounded-full bg-base-raised">
						<motion.div
							className="h-full rounded-full bg-brand-gradient"
							style={{
								width: `${Math.round((item.value / max) * 100)}%`,
								transformOrigin: "left",
							}}
							initial={animate ? { scaleX: 0 } : false}
							animate={inView || !animate ? { scaleX: 1 } : { scaleX: 0 }}
							transition={{
								duration: 0.7,
								ease: EASE_OUT,
								delay: index * 0.06,
							}}
						/>
					</div>
				</li>
			))}
		</ul>
	)
}
