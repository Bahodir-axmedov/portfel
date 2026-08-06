"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/* ------------------------------------------------------------------ *
 * Media queries / motion preferences
 * ------------------------------------------------------------------ */

export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false)

	useEffect(() => {
		if (typeof window === "undefined") return
		const list = window.matchMedia(query)
		const update = () => setMatches(list.matches)
		update()
		list.addEventListener("change", update)
		return () => list.removeEventListener("change", update)
	}, [query])

	return matches
}

export function usePrefersReducedMotion(): boolean {
	return useMediaQuery("(prefers-reduced-motion: reduce)")
}

export function useIsDesktop(): boolean {
	return useMediaQuery("(min-width: 768px)")
}

export function useIsTouch(): boolean {
	return useMediaQuery("(hover: none), (pointer: coarse)")
}

/** Base animations: on everywhere unless the OS asks for reduced motion. */
export function useAnimationEnabled(): boolean {
	return !usePrefersReducedMotion()
}

/**
 * Heavy effects (cursor follow, magnetic buttons, 3D tilt, mouse parallax).
 * Automatically switched off on phones and for reduced-motion users.
 */
export function useHeavyAnimationEnabled(): boolean {
	const reduced = usePrefersReducedMotion()
	const desktop = useIsDesktop()
	const touch = useIsTouch()
	return !reduced && desktop && !touch
}

/** Marks the moment hydration finished — avoids SSR/CSR mismatch flashes. */
export function useMounted(): boolean {
	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), [])
	return mounted
}

/* ------------------------------------------------------------------ *
 * Animated counter
 * ------------------------------------------------------------------ */

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

/**
 * Counts from 0 to `target` once `active` becomes true.
 * Returns the target immediately when animations are disabled.
 */
export function useCounter(
	target: number,
	active = true,
	duration = 1600,
): number {
	const [value, setValue] = useState(0)
	const animate = useAnimationEnabled()
	const frame = useRef<number>()

	useEffect(() => {
		if (!active) return
		if (!animate || duration <= 0) {
			setValue(target)
			return
		}

		const startedAt = performance.now()
		const tick = (now: number) => {
			const progress = Math.min((now - startedAt) / duration, 1)
			setValue(target * easeOutExpo(progress))
			if (progress < 1) frame.current = requestAnimationFrame(tick)
			else setValue(target)
		}

		frame.current = requestAnimationFrame(tick)
		return () => {
			if (frame.current) cancelAnimationFrame(frame.current)
		}
	}, [target, active, duration, animate])

	return value
}

/* ------------------------------------------------------------------ *
 * Typing effect (hero titles)
 * ------------------------------------------------------------------ */

export type TypingOptions = {
	typeSpeed?: number
	deleteSpeed?: number
	holdTime?: number
	loop?: boolean
}

export function useTyping(words: string[], options: TypingOptions = {}) {
	const typeSpeed = options.typeSpeed ?? 70
	const deleteSpeed = options.deleteSpeed ?? 34
	const holdTime = options.holdTime ?? 1500
	const loop = options.loop !== false

	const list = useMemo(() => (words.length > 0 ? words : [""]), [words])

	const animate = useAnimationEnabled()
	const [index, setIndex] = useState(0)
	const [text, setText] = useState("")
	const [deleting, setDeleting] = useState(false)

	useEffect(() => {
		if (!animate) {
			setText(list[0] ?? "")
			return
		}

		const word = list[index % list.length] ?? ""

		if (!deleting && text === word) {
			if (!loop && index === list.length - 1) return
			const timer = setTimeout(() => setDeleting(true), holdTime)
			return () => clearTimeout(timer)
		}

		if (deleting && text === "") {
			setDeleting(false)
			setIndex((prev) => (prev + 1) % list.length)
			return
		}

		const timer = setTimeout(
			() => {
				setText((prev) =>
					deleting
						? word.slice(0, prev.length - 1)
						: word.slice(0, prev.length + 1),
				)
			},
			deleting ? deleteSpeed : typeSpeed,
		)
		return () => clearTimeout(timer)
	}, [
		text,
		deleting,
		index,
		list,
		animate,
		typeSpeed,
		deleteSpeed,
		holdTime,
		loop,
	])

	return { text, deleting, index }
}

/* ------------------------------------------------------------------ *
 * Pointer / scroll
 * ------------------------------------------------------------------ */

export type Point = { x: number; y: number }

/** Pointer position normalised to -0.5 … 0.5 of the viewport. Hero parallax. */
export function useMousePosition(enabled = true): Point {
	const [point, setPoint] = useState<Point>({ x: 0, y: 0 })

	useEffect(() => {
		if (!enabled || typeof window === "undefined") return
		let frame = 0

		const onMove = (event: MouseEvent) => {
			cancelAnimationFrame(frame)
			frame = requestAnimationFrame(() => {
				setPoint({
					x: event.clientX / window.innerWidth - 0.5,
					y: event.clientY / window.innerHeight - 0.5,
				})
			})
		}

		window.addEventListener("mousemove", onMove, { passive: true })
		return () => {
			cancelAnimationFrame(frame)
			window.removeEventListener("mousemove", onMove)
		}
	}, [enabled])

	return point
}

/** Page scroll progress, 0 … 1. Drives the top progress bar. */
export function useScrollProgress(): number {
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		const update = () => {
			const scrollable =
				document.documentElement.scrollHeight - window.innerHeight
			setProgress(scrollable > 0 ? window.scrollY / scrollable : 0)
		}
		update()
		window.addEventListener("scroll", update, { passive: true })
		window.addEventListener("resize", update)
		return () => {
			window.removeEventListener("scroll", update)
			window.removeEventListener("resize", update)
		}
	}, [])

	return progress
}

/** True after the page has been scrolled past `offset` — used by the navbar. */
export function useScrolled(offset = 24): boolean {
	const [scrolled, setScrolled] = useState(false)

	useEffect(() => {
		const update = () => setScrolled(window.scrollY > offset)
		update()
		window.addEventListener("scroll", update, { passive: true })
		return () => window.removeEventListener("scroll", update)
	}, [offset])

	return scrolled
}

/** Highlights the nav link of the section currently on screen. */
export function useActiveSection(ids: string[], offset = 120): string {
	const [active, setActive] = useState(ids[0] ?? "")

	useEffect(() => {
		if (ids.length === 0) return

		const update = () => {
			let current = ids[0] ?? ""
			for (const id of ids) {
				const element = document.getElementById(id)
				if (!element) continue
				if (element.getBoundingClientRect().top - offset <= 0) current = id
			}
			setActive(current)
		}

		update()
		window.addEventListener("scroll", update, { passive: true })
		return () => window.removeEventListener("scroll", update)
	}, [ids, offset])

	return active
}

/* ------------------------------------------------------------------ *
 * UI helpers
 * ------------------------------------------------------------------ */

export function useLockBodyScroll(locked: boolean): void {
	useEffect(() => {
		if (!locked) return
		const previous = document.body.style.overflow
		document.body.style.overflow = "hidden"
		return () => {
			document.body.style.overflow = previous
		}
	}, [locked])
}

export function useCopyToClipboard(resetAfter = 2000) {
	const [copied, setCopied] = useState(false)

	const copy = useCallback(
		async (value: string) => {
			try {
				await navigator.clipboard.writeText(value)
				setCopied(true)
				setTimeout(() => setCopied(false), resetAfter)
				return true
			} catch {
				return false
			}
		},
		[resetAfter],
	)

	return { copied, copy }
}

/** Closes dropdowns / modals when clicking anywhere outside. */
export function useClickOutside<T extends HTMLElement>(
	handler: () => void,
	active = true,
) {
	const ref = useRef<T>(null)

	useEffect(() => {
		if (!active) return
		const onPointerDown = (event: PointerEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) handler()
		}
		document.addEventListener("pointerdown", onPointerDown)
		return () => document.removeEventListener("pointerdown", onPointerDown)
	}, [handler, active])

	return ref
}
