"use client"

import {
	motion,
	useInView,
	useMotionValue,
	useSpring,
	useTransform,
} from "framer-motion"
import {
	type CSSProperties,
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
	useRef,
	useState,
} from "react"
import { cn, compactNumber } from "@/lib/utils"
import {
	useAnimationEnabled,
	useCounter,
	useHeavyAnimationEnabled,
	useTyping,
	type TypingOptions,
} from "@/hooks"
import { EASE } from "./motion"

const MAGNET_SPRING = { stiffness: 190, damping: 17, mass: 0.35 }
const TILT_SPRING = { stiffness: 160, damping: 18, mass: 0.4 }

/* ------------------------------------------------------------------ *
 * Magnetic — buttons that lean toward the cursor
 * ------------------------------------------------------------------ */

export function Magnetic({
	children,
	className,
	strength = 0.32,
}: {
	children: ReactNode
	className?: string
	strength?: number
}) {
	const ref = useRef<HTMLDivElement>(null)
	const enabled = useHeavyAnimationEnabled()
	const x = useMotionValue(0)
	const y = useMotionValue(0)
	const springX = useSpring(x, MAGNET_SPRING)
	const springY = useSpring(y, MAGNET_SPRING)
	const style = { x: springX, y: springY }

	if (!enabled) {
		return <div className={cn("inline-flex", className)}>{children}</div>
	}

	const handleMove = (event: ReactMouseEvent<HTMLDivElement>) => {
		const node = ref.current
		if (!node) return
		const rect = node.getBoundingClientRect()
		x.set((event.clientX - (rect.left + rect.width / 2)) * strength)
		y.set((event.clientY - (rect.top + rect.height / 2)) * strength)
	}

	const reset = () => {
		x.set(0)
		y.set(0)
	}

	return (
		<motion.div
			ref={ref}
			className={cn("inline-flex", className)}
			style={style}
			onMouseMove={handleMove}
			onMouseLeave={reset}
		>
			{children}
		</motion.div>
	)
}

/* ------------------------------------------------------------------ *
 * TiltCard — subtle 3D tilt with a moving sheen
 * ------------------------------------------------------------------ */

export function TiltCard({
	children,
	className,
	max = 7,
	glare = true,
}: {
	children: ReactNode
	className?: string
	max?: number
	glare?: boolean
}) {
	const ref = useRef<HTMLDivElement>(null)
	const enabled = useHeavyAnimationEnabled()
	const [hovered, setHovered] = useState(false)
	const [glarePos, setGlarePos] = useState({ x: 50, y: 50 })

	const px = useMotionValue(0)
	const py = useMotionValue(0)
	const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), TILT_SPRING)
	const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), TILT_SPRING)
	const style = { rotateX, rotateY, transformPerspective: 900 }

	if (!enabled) {
		return <div className={className}>{children}</div>
	}

	const handleMove = (event: ReactMouseEvent<HTMLDivElement>) => {
		const node = ref.current
		if (!node) return
		const rect = node.getBoundingClientRect()
		const nx = (event.clientX - rect.left) / rect.width
		const ny = (event.clientY - rect.top) / rect.height
		px.set(nx - 0.5)
		py.set(ny - 0.5)
		setGlarePos({ x: nx * 100, y: ny * 100 })
	}

	const reset = () => {
		px.set(0)
		py.set(0)
		setHovered(false)
	}

	const glareStyle: CSSProperties = {
		background: `radial-gradient(420px circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.09), transparent 62%)`,
		opacity: hovered ? 1 : 0,
	}

	return (
		<motion.div
			ref={ref}
			className={cn("relative", className)}
			style={style}
			onMouseMove={handleMove}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={reset}
		>
			{children}
			{glare ? (
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
					style={glareStyle}
				/>
			) : null}
		</motion.div>
	)
}

/* ------------------------------------------------------------------ *
 * GlassCard — the base surface used across every section
 * ------------------------------------------------------------------ */

export function GlassCard({
	children,
	className,
	hover = true,
	glow = false,
	tilt = false,
}: {
	children: ReactNode
	className?: string
	hover?: boolean
	glow?: boolean
	tilt?: boolean
}) {
	const card = (
		<div
			className={cn(
				"relative overflow-hidden rounded-lg border border-line bg-white/[0.032] backdrop-blur-xl",
				"transition-colors duration-300",
				hover && "hover:border-line-strong hover:bg-white/[0.055]",
				glow && "shadow-glow",
				className,
			)}
		>
			<span
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
			/>
			{children}
		</div>
	)

	if (!tilt) return card
	return <TiltCard className="h-full rounded-lg">{card}</TiltCard>
}

/* ------------------------------------------------------------------ *
 * Counter — statistics that count up when scrolled into view
 * ------------------------------------------------------------------ */

export function Counter({
	value,
	prefix = "",
	suffix = "",
	duration = 1700,
	compact = true,
	className,
}: {
	value: number
	prefix?: string
	suffix?: string
	duration?: number
	compact?: boolean
	className?: string
}) {
	const ref = useRef<HTMLSpanElement>(null)
	const inView = useInView(ref, { once: true, margin: "-15% 0px" })
	const current = useCounter(value, inView, duration)
	const display = compact ? compactNumber(current) : String(Math.round(current))

	return (
		<span ref={ref} className={className} aria-label={`${prefix}${value}${suffix}`}>
			{prefix}
			{display}
			{suffix}
		</span>
	)
}

/* ------------------------------------------------------------------ *
 * TypingText — rotating hero job titles
 * ------------------------------------------------------------------ */

export function TypingText({
	words,
	className,
	caretClassName,
	options,
}: {
	words: string[]
	className?: string
	caretClassName?: string
	options?: TypingOptions
}) {
	const { text } = useTyping(words, options)
	const animate = useAnimationEnabled()

	return (
		<span className={cn("inline-flex items-center", className)}>
			<span className="gradient-text">{text}</span>
			{animate ? (
				<span
					aria-hidden
					className={cn(
						"ml-1 inline-block h-[1em] w-[2px] translate-y-[0.08em] animate-caret rounded-full bg-brand-400",
						caretClassName,
					)}
				/>
			) : null}
		</span>
	)
}

/* ------------------------------------------------------------------ *
 * ProgressBar — skill levels
 * ------------------------------------------------------------------ */

export function ProgressBar({
	value,
	className,
	delay = 0,
	showValue = false,
}: {
	value: number
	className?: string
	delay?: number
	showValue?: boolean
}) {
	const ref = useRef<HTMLDivElement>(null)
	const inView = useInView(ref, { once: true, margin: "-10% 0px" })
	const animate = useAnimationEnabled()
	const safe = Math.max(0, Math.min(100, value))

	const target = { width: `${safe}%` }
	const initial = { width: "0%" }
	const transition = { duration: 1.1, ease: EASE, delay }

	return (
		<div
			ref={ref}
			className={cn(
				"relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]",
				className,
			)}
			role="progressbar"
			aria-valuenow={safe}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<motion.span
				className="absolute inset-y-0 left-0 rounded-full bg-brand-gradient"
				initial={animate ? initial : target}
				animate={inView || !animate ? target : initial}
				transition={transition}
			/>
			{showValue ? (
				<span className="sr-only">{safe}%</span>
			) : null}
		</div>
	)
}

/* ------------------------------------------------------------------ *
 * Floating — slow drifting decorative elements
 * ------------------------------------------------------------------ */

export function Floating({
	children,
	className,
	amplitude = 10,
	duration = 6,
	delay = 0,
}: {
	children: ReactNode
	className?: string
	amplitude?: number
	duration?: number
	delay?: number
}) {
	const animate = useAnimationEnabled()
	if (!animate) return <div className={className}>{children}</div>

	const floatAnimation = { y: [0, -amplitude, 0] }
	const floatTransition = {
		duration,
		delay,
		repeat: Number.POSITIVE_INFINITY,
		ease: "easeInOut" as const,
	}

	return (
		<motion.div className={className} animate={floatAnimation} transition={floatTransition}>
			{children}
		</motion.div>
	)
}
