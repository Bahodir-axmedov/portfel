"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { EASE } from "@/components/ui/motion"
import { useLockBodyScroll } from "@/hooks"

export type GalleryPhoto = {
	id: string
	title: string
	url: string
	thumbUrl: string
	category: string | null
}

export type GalleryLabels = {
	close: string
	prev: string
	next: string
}

const CONTROL_CLASS =
	"grid h-10 w-10 place-items-center rounded-full border border-line bg-glass text-ink backdrop-blur-md transition hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"

/**
 * Masonry gallery with a keyboard-accessible lightbox.
 * Arrow keys move between photos, Escape closes.
 */
export function GalleryGrid({
	photos,
	labels,
}: {
	photos: GalleryPhoto[]
	labels: GalleryLabels
}) {
	const [index, setIndex] = useState<number | null>(null)
	const isOpen = index !== null

	useLockBodyScroll(isOpen)

	const close = useCallback(() => setIndex(null), [])

	const step = useCallback(
		(delta: number) => {
			setIndex((current) =>
				current === null
					? current
					: (current + delta + photos.length) % photos.length,
			)
		},
		[photos.length],
	)

	useEffect(() => {
		if (!isOpen) return

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") close()
			if (event.key === "ArrowRight") step(1)
			if (event.key === "ArrowLeft") step(-1)
		}

		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [isOpen, close, step])

	const active = index === null ? null : photos[index]

	return (
		<>
			<div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
				{photos.map((photo, position) => (
					<button
						key={photo.id}
						type="button"
						onClick={() => setIndex(position)}
						className="group relative block w-full overflow-hidden rounded-lg border border-line bg-base-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
					>
						<Image
							src={photo.thumbUrl}
							alt={photo.title}
							width={800}
							height={600}
							sizes="(max-width: 768px) 50vw, 33vw"
							className="h-auto w-full object-cover transition duration-500 ease-premium group-hover:scale-[1.04]"
						/>
						<span className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3 text-left opacity-0 transition duration-300 group-hover:opacity-100">
							<span className="text-xs font-semibold text-ink">
								{photo.title}
							</span>
							{photo.category ? (
								<span className="text-[11px] text-ink-muted">
									{photo.category}
								</span>
							) : null}
						</span>
					</button>
				))}
			</div>

			<AnimatePresence>
				{active ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.24 }}
						className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
						onClick={close}
						role="dialog"
						aria-modal="true"
						aria-label={active.title}
					>
						<button
							type="button"
							aria-label={labels.close}
							onClick={close}
							className={`absolute right-4 top-4 ${CONTROL_CLASS}`}
						>
							<X className="h-4 w-4" strokeWidth={1.8} />
						</button>

						{photos.length > 1 ? (
							<>
								<button
									type="button"
									aria-label={labels.prev}
									onClick={(event) => {
										event.stopPropagation()
										step(-1)
									}}
									className={`absolute left-3 top-1/2 -translate-y-1/2 md:left-6 ${CONTROL_CLASS}`}
								>
									<ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
								</button>
								<button
									type="button"
									aria-label={labels.next}
									onClick={(event) => {
										event.stopPropagation()
										step(1)
									}}
									className={`absolute right-3 top-1/2 -translate-y-1/2 md:right-6 ${CONTROL_CLASS}`}
								>
									<ChevronRight className="h-4 w-4" strokeWidth={1.8} />
								</button>
							</>
						) : null}

						<motion.figure
							key={active.id}
							initial={{ opacity: 0, scale: 0.97, y: 8 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							transition={{ duration: 0.35, ease: EASE }}
							className="relative w-full max-w-4xl"
							onClick={(event) => event.stopPropagation()}
						>
							<Image
								src={active.url}
								alt={active.title}
								width={1600}
								height={1200}
								sizes="(max-width: 1024px) 92vw, 900px"
								className="h-auto max-h-[76vh] w-full rounded-lg object-contain"
								priority
							/>
							<figcaption className="mt-3 text-center text-sm text-ink-muted">
								{active.title}
								<span className="ml-2 text-xs tabular-nums text-ink-faint">
									{(index ?? 0) + 1}/{photos.length}
								</span>
							</figcaption>
						</motion.figure>
					</motion.div>
				) : null}
			</AnimatePresence>
		</>
	)
}
