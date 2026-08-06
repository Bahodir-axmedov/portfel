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
 * Ambient background
 * ------------------------------------------------------------------ */

export function AmbientBackground() {
	return (
		<div
			aria-hidden
			className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
		>
			<div className="absolute left-1/2 top-[-18%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand-500/[0.13] blur-[130px]" />
			<div className="absolute right-[-12%] top-[36%] h-[420px] w-[520px] rounded-full bg-accent-500/[0.10] blur-[140px]" />
			<div className="absolute bottom-[-14%] left-[-10%] h-[420px] w-[560px] rounded-full bg-brand-600/[0.09] blur-[150px]" />
			<div className="ambient-grid absolute inset-0" />
			<div className="noise-overlay absolute inset-0" />
		</div>
	)
}
