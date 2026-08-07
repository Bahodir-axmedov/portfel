"use client"

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Icon } from "@/components/ui/Icon"
import { cn } from "@/lib/utils"

/**
 * Toast notifications for the admin panel.
 *
 * Every mutation previously reported success by silently navigating and
 * failure through `window.alert`, which blocks the main thread and cannot be
 * styled. This gives the panel non-blocking, accessible feedback.
 */

type ToastKind = "success" | "error" | "info"

type Toast = {
	id: number
	kind: ToastKind
	message: string
}

type ToastContextValue = {
	toast: (message: string, kind?: ToastKind) => void
	success: (message: string) => void
	error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DURATION = 4000

const STYLES: Record<ToastKind, { icon: string; className: string }> = {
	success: {
		icon: "Check",
		className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
	},
	error: {
		icon: "X",
		className: "border-rose-500/30 bg-rose-500/10 text-rose-200",
	},
	info: {
		icon: "Sparkles",
		className: "border-sky-500/30 bg-sky-500/10 text-sky-200",
	},
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([])
	const counter = useRef(0)
	// Timers are tracked so unmounting mid-flight cannot call setState on a
	// dead component (a classic React memory-leak warning).
	const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

	const dismiss = useCallback((id: number) => {
		setToasts((current) => current.filter((item) => item.id !== id))
		const timer = timers.current.get(id)
		if (timer) {
			clearTimeout(timer)
			timers.current.delete(id)
		}
	}, [])

	const toast = useCallback(
		(message: string, kind: ToastKind = "info") => {
			counter.current += 1
			const id = counter.current
			setToasts((current) => [...current.slice(-3), { id, kind, message }])
			timers.current.set(
				id,
				setTimeout(() => dismiss(id), DURATION),
			)
		},
		[dismiss],
	)

	useEffect(() => {
		const pending = timers.current
		return () => {
			for (const timer of pending.values()) clearTimeout(timer)
			pending.clear()
		}
	}, [])

	const value = useMemo<ToastContextValue>(
		() => ({
			toast,
			success: (message: string) => toast(message, "success"),
			error: (message: string) => toast(message, "error"),
		}),
		[toast],
	)

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div
				/* polite: announced without interrupting whatever is focused */
				aria-live="polite"
				aria-atomic="false"
				className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2"
			>
				<AnimatePresence initial={false}>
					{toasts.map((item) => (
						<motion.div
							key={item.id}
							layout
							initial={{ opacity: 0, y: 12, scale: 0.97 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 8, scale: 0.97 }}
							transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
							className={cn(
								"pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-xl",
								STYLES[item.kind].className,
							)}
						>
							<Icon
								name={STYLES[item.kind].icon}
								className="mt-0.5 size-4 shrink-0"
							/>
							<p className="flex-1 leading-snug">{item.message}</p>
							<button
								type="button"
								onClick={() => dismiss(item.id)}
								className="rounded p-0.5 opacity-60 transition hover:opacity-100"
								aria-label="Yopish"
							>
								<Icon name="X" className="size-3.5" />
							</button>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	)
}

/**
 * Returns a no-op implementation when used outside the provider so a component
 * rendered in isolation (or in a test) never crashes on a missing context.
 */
export function useToast(): ToastContextValue {
	const context = useContext(ToastContext)
	if (context) return context
	return {
		toast: () => {},
		success: () => {},
		error: () => {},
	}
}
