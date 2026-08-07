"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Crop dialog shown before an image upload.
 *
 * Everything happens on a canvas in the browser. No cropping package is used:
 * a new dependency changes package-lock.json, and a lockfile mismatch has
 * already broken this project's deploy once.
 *
 * The output is always PNG or JPEG. The upload route verifies the real format
 * from the file header and rejects anything whose bytes disagree with the
 * declared type, so producing WebP or AVIF here would simply be refused.
 */

const VIEW_WIDTH = 520
/** Corner handle size, in on-screen pixels. */
const HANDLE = 18
/** Smallest allowed crop, in source pixels. */
const MIN_SIDE = 24

type Rect = { x: number; y: number; width: number; height: number }
type Size = { width: number; height: number }

const ASPECTS: Array<{ label: string; value: number | null }> = [
	{ label: "Erkin", value: null },
	{ label: "1:1", value: 1 },
	{ label: "16:9", value: 16 / 9 },
	{ label: "4:3", value: 4 / 3 },
	{ label: "3:4", value: 3 / 4 },
]

/** Keeps a rectangle inside the image, honouring the locked aspect ratio. */
function clampRect(rect: Rect, bounds: Size, aspect: number | null): Rect {
	let width = Math.min(Math.max(rect.width, MIN_SIDE), bounds.width)
	let height = Math.min(Math.max(rect.height, MIN_SIDE), bounds.height)

	if (aspect) {
		if (width / aspect > bounds.height) width = bounds.height * aspect
		height = width / aspect
	}

	const x = Math.min(Math.max(0, rect.x), bounds.width - width)
	const y = Math.min(Math.max(0, rect.y), bounds.height - height)
	return { x, y, width, height }
}

type Props = {
	file: File
	busy?: boolean
	onCancel: () => void
	onConfirm: (result: File) => void
}

export function ImageCropper({ file, busy, onCancel, onConfirm }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const imageRef = useRef<HTMLImageElement | null>(null)
	const dragRef = useRef<{
		mode: "move" | "resize"
		startX: number
		startY: number
		rect: Rect
	} | null>(null)

	const [size, setSize] = useState<Size | null>(null)
	const [crop, setCrop] = useState<Rect | null>(null)
	const [aspect, setAspect] = useState<number | null>(null)
	const [failed, setFailed] = useState(false)

	/*
	 * Decode once. The object URL is revoked on cleanup -- without that, every
	 * picked image stays in memory for the lifetime of the tab.
	 */
	useEffect(() => {
		const url = URL.createObjectURL(file)
		const image = new window.Image()

		image.onload = () => {
			imageRef.current = image
			const bounds = { width: image.naturalWidth, height: image.naturalHeight }
			setSize(bounds)
			const side = Math.min(bounds.width, bounds.height)
			setCrop({
				x: (bounds.width - side) / 2,
				y: (bounds.height - side) / 2,
				width: side,
				height: side,
			})
		}
		image.onerror = () => setFailed(true)
		image.src = url

		return () => {
			URL.revokeObjectURL(url)
			imageRef.current = null
		}
	}, [file])

	// Escape closes the dialog, which is what every other modal on the web does.
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCancel()
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [onCancel])

	// Redraw whenever the selection changes.
	useEffect(() => {
		const canvas = canvasRef.current
		const image = imageRef.current
		if (!canvas || !image || !size || !crop) return

		const scale = VIEW_WIDTH / size.width
		const height = Math.max(1, Math.round(size.height * scale))
		canvas.width = VIEW_WIDTH
		canvas.height = height

		const ctx = canvas.getContext("2d")
		if (!ctx) return

		ctx.clearRect(0, 0, VIEW_WIDTH, height)
		ctx.drawImage(image, 0, 0, VIEW_WIDTH, height)

		// Dim everything, then repaint the selection at full strength. This shows
		// exactly what survives the crop instead of only outlining it.
		ctx.fillStyle = "rgba(10, 10, 11, 0.66)"
		ctx.fillRect(0, 0, VIEW_WIDTH, height)

		const view = {
			x: crop.x * scale,
			y: crop.y * scale,
			width: crop.width * scale,
			height: crop.height * scale,
		}

		ctx.save()
		ctx.beginPath()
		ctx.rect(view.x, view.y, view.width, view.height)
		ctx.clip()
		ctx.drawImage(image, 0, 0, VIEW_WIDTH, height)
		ctx.restore()

		ctx.strokeStyle = "#3B82F6"
		ctx.lineWidth = 2
		ctx.strokeRect(view.x, view.y, view.width, view.height)

		ctx.fillStyle = "#3B82F6"
		ctx.fillRect(
			view.x + view.width - HANDLE,
			view.y + view.height - HANDLE,
			HANDLE,
			HANDLE,
		)
	}, [crop, size])

	/** Pointer position in source pixels. */
	const pointOf = useCallback(
		(event: React.PointerEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current
			if (!canvas || !size) return null
			const box = canvas.getBoundingClientRect()
			if (box.width === 0) return null
			// Uses the rendered box, so the maths stays correct when the canvas is
			// scaled down on a narrow screen.
			const ratio = size.width / box.width
			return {
				x: (event.clientX - box.left) * ratio,
				y: (event.clientY - box.top) * ratio,
			}
		},
		[size],
	)

	const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
		if (!crop || !size) return
		const point = pointOf(event)
		if (!point) return

		const grab = (HANDLE * size.width) / VIEW_WIDTH
		const onHandle =
			Math.abs(point.x - (crop.x + crop.width)) < grab &&
			Math.abs(point.y - (crop.y + crop.height)) < grab
		const inside =
			point.x >= crop.x &&
			point.x <= crop.x + crop.width &&
			point.y >= crop.y &&
			point.y <= crop.y + crop.height

		if (!onHandle && !inside) return

		event.currentTarget.setPointerCapture(event.pointerId)
		dragRef.current = {
			mode: onHandle ? "resize" : "move",
			startX: point.x,
			startY: point.y,
			rect: crop,
		}
	}

	const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
		const drag = dragRef.current
		if (!drag || !size) return
		const point = pointOf(event)
		if (!point) return

		const dx = point.x - drag.startX
		const dy = point.y - drag.startY

		if (drag.mode === "move") {
			setCrop(
				clampRect(
					{ ...drag.rect, x: drag.rect.x + dx, y: drag.rect.y + dy },
					size,
					aspect,
				),
			)
			return
		}

		const width = drag.rect.width + dx
		const height = aspect ? width / aspect : drag.rect.height + dy
		setCrop(
			clampRect(
				{ x: drag.rect.x, y: drag.rect.y, width, height },
				size,
				aspect,
			),
		)
	}

	const endDrag = () => {
		dragRef.current = null
	}

	const chooseAspect = (value: number | null) => {
		setAspect(value)
		if (crop && size) setCrop(clampRect(crop, size, value))
	}

	const confirm = () => {
		const image = imageRef.current
		if (!image || !crop) return

		const canvas = document.createElement("canvas")
		canvas.width = Math.max(1, Math.round(crop.width))
		canvas.height = Math.max(1, Math.round(crop.height))
		const ctx = canvas.getContext("2d")
		if (!ctx) return

		ctx.drawImage(
			image,
			crop.x,
			crop.y,
			crop.width,
			crop.height,
			0,
			0,
			canvas.width,
			canvas.height,
		)

		// PNG only for PNG sources, where transparency matters. Re-encoding a
		// photo as PNG would multiply its size and can push it past the upload
		// limit.
		const type = file.type === "image/png" ? "image/png" : "image/jpeg"
		const extension = type === "image/png" ? ".png" : ".jpg"

		canvas.toBlob(
			(blob) => {
				if (!blob) {
					setFailed(true)
					return
				}
				const base = file.name.replace(/\.[^.]+$/, "") || "image"
				onConfirm(new File([blob], base + extension, { type }))
			},
			type,
			0.92,
		)
	}

	return (
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-base/80 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-label="Rasmni kesish"
		>
			<div className="w-full max-w-[600px] rounded-xl border border-line bg-base-soft p-4 shadow-glow-lg">
				<div className="mb-3 flex items-center justify-between gap-3">
					<div>
						<p className="text-sm font-medium text-ink">Rasmni kesish</p>
						<p className="text-xs text-ink-faint">
							{size ? `Manba: ${size.width}×${size.height} px` : "Yuklanmoqda…"}
						</p>
					</div>
					<div className="flex flex-wrap gap-1">
						{ASPECTS.map((item) => (
							<button
								key={item.label}
								type="button"
								onClick={() => chooseAspect(item.value)}
								aria-pressed={aspect === item.value}
								className={cn(
									"h-7 rounded-md border px-2 text-xs transition",
									aspect === item.value
										? "border-brand-500/40 bg-brand-500/10 text-brand-300"
										: "border-line text-ink-faint hover:text-ink",
								)}
							>
								{item.label}
							</button>
						))}
					</div>
				</div>

				{failed ? (
					<p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
						Bu rasmni ochib bo&apos;lmadi. Boshqa fayl tanlang.
					</p>
				) : (
					<canvas
						ref={canvasRef}
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={endDrag}
						onPointerCancel={endDrag}
						// touch-none stops the browser from scrolling the page while a
						// crop is being dragged on a touchscreen.
						className="w-full cursor-move touch-none rounded-md border border-line"
					/>
				)}

				<p className="mt-2 text-[11px] text-ink-faint">
					Ramkani suring, o&apos;ng pastki burchakdan o&apos;lchamini
					o&apos;zgartiring.
					{crop
						? ` Natija: ${Math.round(crop.width)}×${Math.round(crop.height)} px`
						: ""}
				</p>

				<div className="mt-4 flex flex-wrap items-center justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						disabled={busy}
						className="h-9 rounded-md px-3 text-sm text-ink-faint transition hover:text-ink disabled:opacity-60"
					>
						Bekor qilish
					</button>
					<button
						type="button"
						onClick={() => onConfirm(file)}
						disabled={busy}
						className="h-9 rounded-md border border-line px-3 text-sm text-ink-muted transition hover:border-line-strong hover:text-ink disabled:opacity-60"
					>
						Kesmasdan yuklash
					</button>
					<button
						type="button"
						onClick={confirm}
						disabled={busy || failed || !crop}
						className="h-9 rounded-md bg-brand-gradient px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
					>
						{busy ? "Yuklanmoqda…" : "Kesish va yuklash"}
					</button>
				</div>
			</div>
		</div>
	)
}
