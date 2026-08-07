"use client"

import { motion } from "framer-motion"
import { useId } from "react"
import { cn } from "@/lib/utils"

/**
 * "B" gradient monogram inside a glass tile.
 *
 * The three strokes are drawn with `pathLength` so the loading screen can
 * animate the logo being written. The same shape is exported to
 * `public/logo-mark.svg` for the favicon set.
 *
 * Gradient ids are generated with `useId` instead of being hardcoded. SVG
 * `id`s live in the global DOM id namespace, and this component renders in the
 * navbar, the footer, the loading screen and the admin sidebar at the same
 * time. With fixed ids every `url(#bmGrad)` resolves against whichever copy
 * mounted first, so unmounting the loading screen deleted the gradients the
 * navbar logo was still pointing at and the mark rendered black.
 * `useId` is also stable across server and client, so it introduces no
 * hydration mismatch.
 */
export function LogoMark({
	size = 40,
	animated = false,
	className,
}: {
	size?: number
	animated?: boolean
	className?: string
}) {
	// `useId` returns a value containing colons, which are not valid in a CSS
	// url(#...) reference in every engine — strip them.
	const rawId = useId()
	const uid = rawId.replace(/:/g, "")
	const gradId = `bmGrad-${uid}`
	const edgeId = `bmEdge-${uid}`
	const glassId = `bmGlass-${uid}`

	const strokes = [
		"M23 15V49",
		"M23 15h9.5a8.5 8.5 0 0 1 0 17H23",
		"M23 32h11a8.5 8.5 0 0 1 0 17H23",
	]

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 64 64"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn("shrink-0", className)}
			aria-hidden="true"
		>
			<defs>
				<linearGradient id={gradId} x1="14" y1="12" x2="52" y2="52">
					<stop offset="0%" stopColor="#3B82F6" />
					<stop offset="50%" stopColor="#22A6E8" />
					<stop offset="100%" stopColor="#06B6D4" />
				</linearGradient>
				<linearGradient id={edgeId} x1="5" y1="5" x2="59" y2="59">
					<stop offset="0%" stopColor="#3B82F6" stopOpacity="0.75" />
					<stop offset="60%" stopColor="#06B6D4" stopOpacity="0.35" />
					<stop offset="100%" stopColor="#06B6D4" stopOpacity="0.08" />
				</linearGradient>
				<linearGradient id={glassId} x1="10" y1="6" x2="54" y2="58">
					<stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.10" />
					<stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
				</linearGradient>
			</defs>

			<rect
				x="5"
				y="5"
				width="54"
				height="54"
				rx="16"
				fill={`url(#${glassId})`}
				stroke={`url(#${edgeId})`}
				strokeWidth="1.5"
			/>

			{strokes.map((d, index) =>
				animated ? (
					<motion.path
						key={d}
						d={d}
						stroke={`url(#${gradId})`}
						strokeWidth="5.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						fill="none"
						initial={{ pathLength: 0, opacity: 0 }}
						animate={{ pathLength: 1, opacity: 1 }}
						transition={{
							duration: 0.55,
							ease: [0.16, 1, 0.3, 1],
							delay: 0.12 + index * 0.22,
						}}
					/>
				) : (
					<path
						key={d}
						d={d}
						stroke={`url(#${gradId})`}
						strokeWidth="5.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						fill="none"
					/>
				),
			)}
		</svg>
	)
}

/** Logo + wordmark, used in the navbar and footer. */
export function Logo({
	className,
	size = 34,
	label = "Bahodir",
	suffix = ".dev",
}: {
	className?: string
	size?: number
	label?: string
	suffix?: string
}) {
	return (
		<span className={cn("inline-flex items-center gap-2.5", className)}>
			<LogoMark size={size} />
			<span className="text-[15px] font-semibold tracking-tight text-ink">
				{label}
				<span className="gradient-text">{suffix}</span>
			</span>
		</span>
	)
}
