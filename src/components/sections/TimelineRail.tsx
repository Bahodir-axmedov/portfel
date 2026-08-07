"use client"

import { useRef, type ReactNode } from "react"
import { motion, useScroll, useSpring, useTransform } from "framer-motion"
import { useAnimationEnabled } from "@/hooks"

/**
 * The vertical rail behind the journey timeline.
 *
 * The rail draws itself as the section scrolls through the viewport, so the
 * line appears to be written alongside the entries rather than sitting there
 * pre-drawn.
 *
 * Why it is built this way:
 *
 * - The fill is a `scaleY` transform on a full-height gradient, not an animated
 *   `height`. Height is a layout property: animating it would reflow every
 *   entry below the rail on every scroll frame. `scaleY` is composited.
 * - `transformOrigin: top` is required. The default origin is the centre, which
 *   would make the line grow in both directions from the middle.
 * - The scroll range ends at `end 65%` rather than `end start`, so the rail is
 *   complete by the time the last entry is comfortably in view instead of only
 *   filling once the section is scrolling out.
 * - `useSpring` smooths the raw progress. Without it the line snaps in step
 *   with the wheel, which reads as jitter on trackpads that emit large deltas.
 * - When animation is disabled (reduced motion) the rail renders fully drawn.
 *   A progress indicator that never fills would be worse than a static line.
 */
export function TimelineRail({ children }: { children: ReactNode }) {
	const ref = useRef<HTMLDivElement>(null)
	const animate = useAnimationEnabled()

	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start 85%", "end 65%"],
	})

	const smooth = useSpring(scrollYProgress, {
		stiffness: 120,
		damping: 28,
		mass: 0.4,
	})

	// The glow dot rides the head of the drawn line.
	const dotOffset = useTransform(smooth, [0, 1], ["0%", "100%"])

	return (
		<div ref={ref} className="relative mt-6 pl-8">
			{/* Unfilled track. */}
			<span
				aria-hidden
				className="absolute bottom-3 left-[10px] top-2 w-px bg-white/[0.07]"
			/>

			{/* Drawn fill. */}
			<span
				aria-hidden
				className="absolute bottom-3 left-[10px] top-2 w-px overflow-visible"
			>
				<motion.span
					className="block h-full w-px bg-gradient-to-b from-brand-500 via-violet-500 to-accent-500"
					style={{
						scaleY: animate ? smooth : 1,
						transformOrigin: "top",
					}}
				/>

				{animate ? (
					<motion.span
						className="absolute left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500 shadow-glow-cyan"
						style={{ top: dotOffset }}
					/>
				) : null}
			</span>

			{children}
		</div>
	)
}
