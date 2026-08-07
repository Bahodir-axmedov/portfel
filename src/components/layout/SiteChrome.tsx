"use client"

import Lenis from "lenis"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { LogoMark } from "@/components/ui/LogoMark"
import { EASE } from "@/components/ui/motion"
import {
	useAnimationEnabled,
	useHeavyAnimationEnabled,
	useScrollProgress,
} from "@/hooks"
import { cn } from "@/lib/utils"

/**
 * Site-wide chrome: smooth scrolling, scroll progress bar, custom cursor,
 * intro loading screen and the ambient gradient background.
 *
 * Every piece degrades gracefully: reduced-motion users and phones get a
 * static, fully functional site with no heavy effects.
 */

const NAV_OFFSET = -88

/* ------------------------------------------------------------------ *
 * Lenis smooth scroll
 * ------------------------------------------------------------------ */

export function SmoothScroll({ children }: { children: ReactNode }) {
	const enabled = useAnimationEnabled()

	useEffect(() => {
		if (!enabled) return

		const lenis = new Lenis({
			duration: 1.05,
			easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			smoothWheel: true,
			touchMultiplier: 1.4,
		})

		let frame = requestAnimationFrame(function raf(time: number) {
			lenis.raf(time)
			frame = requestAnimationFrame(raf)
		})

		// Anchor links scroll smoothly and stop below the fixed navbar.
		const onClick = (event: MouseEvent) => {
			const element = event.target as HTMLElement | null
			const anchor = element?.closest<HTMLAnchorElement>('a[href^="#"]')
			const hash = anchor?.getAttribute("href")
			if (!anchor || !hash || hash === "#") return
			const target = document.querySelector(hash)
			if (!target) return
			event.preventDefault()
			lenis.scrollTo(target as HTMLElement, { offset: NAV_OFFSET })
			window.history.replaceState(null, "", hash)
		}

		document.addEventListener("click", onClick)
		return () => {
			cancelAnimationFrame(frame)
			document.removeEventListener("click", onClick)
			lenis.destroy()
		}
	}, [enabled])

	return <>{children}</>
}

/* ------------------------------------------------------------------ *
 * Scroll progress bar
 * ------------------------------------------------------------------ */

export function ScrollProgress() {
	const progress = useScrollProgress()

	return (
		<div
			aria-hidden
			className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] bg-transparent"
		>
			<div
				className="h-full origin-left bg-brand-gradient transition-transform duration-150 ease-out"
				style={{ transform: `scaleX(${progress})` }}
			/>
		</div>
	)
}

/* ------------------------------------------------------------------ *
 * Custom cursor (desktop only)
 * ------------------------------------------------------------------ */

export function Cursor() {
	const enabled = useHeavyAnimationEnabled()
	const dotRef = useRef<HTMLDivElement>(null)
	const ringRef = useRef<HTMLDivElement>(null)
	const [active, setActive] = useState(false)
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		if (!enabled) return

		const pointer = { x: 0, y: 0 }
		const ring = { x: 0, y: 0 }
		let frame = 0

		const onMove = (event: MouseEvent) => {
			pointer.x = event.clientX
			pointer.y = event.clientY
			setVisible(true)

			const element = event.target as HTMLElement | null
			const interactive = element?.closest(
				"a, button, [role=button], input, textarea, select, [data-cursor]",
			)
			setActive(Boolean(interactive))
		}

		const onLeave = () => setVisible(false)

		const render = () => {
			ring.x += (pointer.x - ring.x) * 0.16
			ring.y += (pointer.y - ring.y) * 0.16
			if (dotRef.current) {
				dotRef.current.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`
			}
			if (ringRef.current) {
				ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`
			}
			frame = requestAnimationFrame(render)
		}

		window.addEventListener("mousemove", onMove, { passive: true })
		document.addEventListener("mouseleave", onLeave)
		frame = requestAnimationFrame(render)

		return () => {
			cancelAnimationFrame(frame)
			window.removeEventListener("mousemove", onMove)
			document.removeEventListener("mouseleave", onLeave)
		}
	}, [enabled])

	if (!enabled) return null

	return (
		<div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
			<div
				ref={ringRef}
				className={cn(
					"fixed left-0 top-0 rounded-full border border-brand-400/60 transition-[width,height,opacity,background-color] duration-300 ease-out",
					active ? "h-11 w-11 bg-brand-500/10" : "h-8 w-8",
					visible ? "opacity-100" : "opacity-0",
				)}
			/>
			<div
				ref={dotRef}
				className={cn(
					"fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-brand-400 transition-opacity duration-300",
					visible && !active ? "opacity-100" : "opacity-0",
				)}
			/>
		</div>
	)
}

/* ------------------------------------------------------------------ *
 * Loading screen (once per browser session)
 * ------------------------------------------------------------------ */

const INTRO_KEY = "intro-played"
const INTRO_DURATION = 1800

export function LoadingScreen() {
	const animate = useAnimationEnabled()
	const [visible, setVisible] = useState(false)
	const [ready, setReady] = useState(false)

	useEffect(() => {
		setReady(true)
		if (!animate) return
		if (sessionStorage.getItem(INTRO_KEY)) return

		setVisible(true)
		document.body.style.overflow = "hidden"

		const timer = setTimeout(() => {
			sessionStorage.setItem(INTRO_KEY, "1")
			setVisible(false)
			document.body.style.overflow = ""
		}, INTRO_DURATION)

		return () => {
			clearTimeout(timer)
			document.body.style.overflow = ""
		}
	}, [animate])

	if (!ready) return null

	return (
		<AnimatePresence>
			{visible ? (
				<motion.div
					key="intro"
					className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-base"
					initial={{ opacity: 1 }}
					exit={{ opacity: 0, filter: "blur(8px)" }}
					transition={{ duration: 0.55, ease: EASE }}
				>
					<LogoMark size={72} animated />
					<div className="h-px w-40 overflow-hidden rounded-full bg-white/10">
						<motion.div
							className="h-full bg-brand-gradient"
							initial={{ width: "0%" }}
							animate={{ width: "100%" }}
							transition={{ duration: INTRO_DURATION / 1000, ease: EASE }}
						/>
					</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	)
}

/* ------------------------------------------------------------------ *
 * Click ripple
 * ------------------------------------------------------------------ */

/**
 * Material-style click ripple for every button and link-button.
 *
 * Implemented as ONE delegated `pointerdown` listener on the document rather
 * than per-button React state. That keeps `ui/primitives.tsx` a server
 * component (its `buttonClass` is called from server sections, so it must not
 * gain a "use client" directive) and costs a single listener for the whole
 * page no matter how many buttons render.
 *
 * The ripple node removes itself on `animationend`, so nothing accumulates in
 * the DOM.
 */
export function RippleEffect() {
	const enabled = useAnimationEnabled()

	useEffect(() => {
		if (!enabled) return

		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as HTMLElement | null
			const host = target?.closest<HTMLElement>(".btn-sweep")
			if (!host) return

			const rect = host.getBoundingClientRect()
			// Diameter must cover the farthest corner from the click point.
			const size = Math.max(rect.width, rect.height)
			const ripple = document.createElement("span")
			ripple.className = "ripple"
			ripple.style.width = `${size}px`
			ripple.style.height = `${size}px`
			ripple.style.left = `${event.clientX - rect.left - size / 2}px`
			ripple.style.top = `${event.clientY - rect.top - size / 2}px`
			ripple.addEventListener("animationend", () => ripple.remove(), {
				once: true,
			})
			host.appendChild(ripple)
		}

		document.addEventListener("pointerdown", onPointerDown)
		return () => document.removeEventListener("pointerdown", onPointerDown)
	}, [enabled])

	return null
}

/* ------------------------------------------------------------------ *
 * Ambient background
 * ------------------------------------------------------------------ */

/**
 * Apple-style spotlight that trails the pointer.
 *
 * The rAF loop writes two CSS custom properties instead of calling React
 * state, so a pointer move costs one style write and zero re-renders. The
 * easing factor (0.08) makes the light lag slightly behind the cursor, which
 * is what sells the "liquid glass" feel.
 *
 * Desktop only: `useHeavyAnimationEnabled` is false on touch devices and for
 * `prefers-reduced-motion`, where the component renders nothing at all.
 */
export function MouseLight() {
	const enabled = useHeavyAnimationEnabled()
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!enabled) return
		const node = ref.current
		if (!node) return

		const pointer = { x: window.innerWidth / 2, y: window.innerHeight * 0.4 }
		const eased = { x: pointer.x, y: pointer.y }
		let frame = 0

		const onMove = (event: MouseEvent) => {
			pointer.x = event.clientX
			pointer.y = event.clientY
			node.dataset.active = "true"
		}
		const onLeave = () => {
			node.dataset.active = "false"
		}

		const render = () => {
			eased.x += (pointer.x - eased.x) * 0.08
			eased.y += (pointer.y - eased.y) * 0.08
			node.style.setProperty("--mx", `${eased.x.toFixed(1)}px`)
			node.style.setProperty("--my", `${eased.y.toFixed(1)}px`)
			frame = requestAnimationFrame(render)
		}

		window.addEventListener("mousemove", onMove, { passive: true })
		document.addEventListener("mouseleave", onLeave)
		frame = requestAnimationFrame(render)

		return () => {
			cancelAnimationFrame(frame)
			window.removeEventListener("mousemove", onMove)
			document.removeEventListener("mouseleave", onLeave)
		}
	}, [enabled])

	if (!enabled) return null
	return <div ref={ref} aria-hidden className="mouse-light" />
}

/**
 * Particle positions are a hardcoded table rather than `Math.random()`.
 * Random values would differ between the server render and the client
 * hydration pass and produce a hydration mismatch, so the "randomness" is
 * baked in at authoring time instead.
 */
const PARTICLES = [
	{ left: "8%", top: "78%", size: 2, duration: 17, delay: 0 },
	{ left: "21%", top: "88%", size: 3, duration: 23, delay: 3 },
	{ left: "34%", top: "72%", size: 2, duration: 19, delay: 7 },
	{ left: "47%", top: "92%", size: 2.5, duration: 26, delay: 1 },
	{ left: "59%", top: "80%", size: 2, duration: 21, delay: 9 },
	{ left: "68%", top: "95%", size: 3, duration: 29, delay: 5 },
	{ left: "79%", top: "74%", size: 2, duration: 18, delay: 12 },
	{ left: "91%", top: "86%", size: 2.5, duration: 24, delay: 2 },
] as const

/**
 * Ambient background: grid + aurora + nebula + three parallax star layers +
 * shooting stars + floating particles + the pointer spotlight.
 *
 * Layer order (back to front) matters: nebula and aurora sit behind the stars
 * so the stars read as foreground, and the grid sits on top of everything
 * with a radial mask so it fades out below the hero.
 */
export function AmbientBackground() {
	return (
		<div
			aria-hidden
			className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
		>
			{/* Deep space base tint */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,rgba(23,37,84,0.55),transparent_65%)]" />

			{/* Slow nebula clouds */}
			<div className="nebula nebula-a" />
			<div className="nebula nebula-b" />

			{/* Aurora ribbons */}
			<div className="aurora aurora-a" />
			<div className="aurora aurora-b" />

			{/* Parallax starfield */}
			<div className="star-layer star-layer-sm" />
			<div className="star-layer star-layer-md star-twinkle" />
			<div className="star-layer star-layer-lg" />

			{/* Shooting stars */}
			<div className="shooting-star shooting-star-1" />
			<div className="shooting-star shooting-star-2" />
			<div className="shooting-star shooting-star-3" />

			{/* Rising particles */}
			{PARTICLES.map((particle) => (
				<span
					key={particle.left}
					className="particle"
					style={{
						left: particle.left,
						top: particle.top,
						height: particle.size,
						width: particle.size,
						animationDuration: `${particle.duration}s`,
						animationDelay: `-${particle.delay}s`,
					}}
				/>
			))}

			{/* Pointer spotlight */}
			<MouseLight />

			{/* Grid + film grain on top */}
			<div className="ambient-grid absolute inset-0" />
			<div className="noise-overlay absolute inset-0" />
		</div>
	)
}
