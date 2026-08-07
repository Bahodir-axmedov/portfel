"use client"

import {
	motion,
	useInView,
	useScroll,
	useTransform,
	type Variants,
} from "framer-motion"
import { useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useAnimationEnabled } from "@/hooks"

/**
 * Shared motion language for the whole site.
 * One easing curve, one set of variants — so every section feels related.
 */
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
export const EASE_SOFT: [number, number, number, number] = [0.4, 0, 0.2, 1]

export const DURATION = {
	fast: 0.35,
	base: 0.6,
	slow: 0.9,
}

export const fadeUp: Variants = {
	hidden: { opacity: 0, y: 22 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: DURATION.base, ease: EASE },
	},
}

export const fadeIn: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { duration: DURATION.base, ease: EASE },
	},
}

export const scaleIn: Variants = {
	hidden: { opacity: 0, scale: 0.96 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { duration: DURATION.base, ease: EASE },
	},
}

export const blurUp: Variants = {
	hidden: { opacity: 0, y: 18, filter: "blur(10px)" },
	visible: {
		opacity: 1,
		y: 0,
		filter: "blur(0px)",
		transition: { duration: DURATION.slow, ease: EASE },
	},
}

export const slideLeft: Variants = {
	hidden: { opacity: 0, x: -28 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: DURATION.base, ease: EASE },
	},
}

export const slideRight: Variants = {
	hidden: { opacity: 0, x: 28 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: DURATION.base, ease: EASE },
	},
}

/**
 * Slight rotation on entry. Used sparingly (cards that read as physical
 * objects) — applied everywhere it would look like a gimmick.
 */
export const rotateIn: Variants = {
	hidden: { opacity: 0, y: 26, rotate: -2.5, scale: 0.97 },
	visible: {
		opacity: 1,
		y: 0,
		rotate: 0,
		scale: 1,
		transition: { duration: DURATION.slow, ease: EASE },
	},
}

/** Container variant that reveals its children one after another. */
export function stagger(step = 0.08, delay = 0): Variants {
	return {
		hidden: {},
		visible: {
			transition: { staggerChildren: step, delayChildren: delay },
		},
	}
}

export const staggerContainer = stagger()

const VIEWPORT_MARGIN = "-12% 0px -8% 0px"

type RevealProps = {
	children: ReactNode
	className?: string
	/** Seconds to wait before the reveal starts. */
	delay?: number
	variant?: Variants
	once?: boolean
}

/**
 * Scroll reveal wrapper. Renders plain content (no transform) when the visitor
 * prefers reduced motion, so nothing is ever hidden from them.
 */
export function Reveal({
	children,
	className,
	delay = 0,
	variant = fadeUp,
	once = true,
}: RevealProps) {
	const ref = useRef<HTMLDivElement>(null)
	const inView = useInView(ref, { once, margin: VIEWPORT_MARGIN })
	const animate = useAnimationEnabled()

	if (!animate) {
		return <div className={className}>{children}</div>
	}

	const transition = { delay }

	return (
		<motion.div
			ref={ref}
			className={className}
			variants={variant}
			initial="hidden"
			animate={inView ? "visible" : "hidden"}
			transition={transition}
		>
			{children}
		</motion.div>
	)
}

type StaggerGroupProps = {
	children: ReactNode
	className?: string
	step?: number
	delay?: number
	once?: boolean
}

/** Parent for `StaggerItem` children — cards, list rows, skill bars. */
export function StaggerGroup({
	children,
	className,
	step = 0.08,
	delay = 0,
	once = true,
}: StaggerGroupProps) {
	const ref = useRef<HTMLDivElement>(null)
	const inView = useInView(ref, { once, margin: VIEWPORT_MARGIN })
	const animate = useAnimationEnabled()

	if (!animate) {
		return <div className={className}>{children}</div>
	}

	const variants = stagger(step, delay)

	return (
		<motion.div
			ref={ref}
			className={className}
			variants={variants}
			initial="hidden"
			animate={inView ? "visible" : "hidden"}
		>
			{children}
		</motion.div>
	)
}

export function StaggerItem({
	children,
	className,
	variant = fadeUp,
}: {
	children: ReactNode
	className?: string
	variant?: Variants
}) {
	const animate = useAnimationEnabled()
	if (!animate) return <div className={className}>{children}</div>

	return (
		<motion.div className={className} variants={variant}>
			{children}
		</motion.div>
	)
}

/**
 * Scroll-linked parallax. The wrapper translates as it crosses the viewport,
 * which gives sections depth without a scroll listener of our own —
 * `useScroll` reads from the same rAF loop Framer Motion already runs.
 */
export function Parallax({
	children,
	className,
	distance = 60,
}: {
	children: ReactNode
	className?: string
	/** Total travel in pixels across the full crossing. */
	distance?: number
}) {
	const ref = useRef<HTMLDivElement>(null)
	const animate = useAnimationEnabled()
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "end start"],
	})
	const y = useTransform(scrollYProgress, [0, 1], [distance, -distance])

	// Hooks must run unconditionally, so the reduced-motion branch comes after.
	if (!animate) {
		return (
			<div ref={ref} className={className}>
				{children}
			</div>
		)
	}

	return (
		<motion.div ref={ref} className={className} style={{ y }}>
			{children}
		</motion.div>
	)
}

const wordVariant: Variants = {
	hidden: { opacity: 0, y: "0.5em", filter: "blur(6px)" },
	visible: {
		opacity: 1,
		y: "0em",
		filter: "blur(0px)",
		transition: { duration: 0.7, ease: EASE },
	},
}

/** Word-by-word headline reveal used for the big section titles. */
export function TextReveal({
	text,
	className,
	step = 0.045,
	delay = 0,
}: {
	text: string
	className?: string
	step?: number
	delay?: number
}) {
	const ref = useRef<HTMLSpanElement>(null)
	const inView = useInView(ref, { once: true, margin: VIEWPORT_MARGIN })
	const animate = useAnimationEnabled()
	const words = text.split(" ")

	if (!animate) return <span className={className}>{text}</span>

	const container = stagger(step, delay)

	return (
		<motion.span
			ref={ref}
			className={cn("inline-block", className)}
			variants={container}
			initial="hidden"
			animate={inView ? "visible" : "hidden"}
		>
			{words.map((word, index) => (
				<motion.span
					key={`${word}-${index}`}
					className="inline-block whitespace-pre"
					variants={wordVariant}
				>
					{word}
					{index < words.length - 1 ? " " : ""}
				</motion.span>
			))}
		</motion.span>
	)
}

export const pageTransition: Variants = {
	hidden: { opacity: 0, y: 12 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: EASE },
	},
	exit: {
		opacity: 0,
		y: -8,
		transition: { duration: 0.3, ease: EASE_SOFT },
	},
}
