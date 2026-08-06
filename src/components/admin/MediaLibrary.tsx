"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/components/admin/Toast"
import { cn } from "@/lib/utils"

type Props = {
	/**
	 * Passed in from the server page rather than read from `@/constants`.
	 * `MAX_UPLOAD_MB` is derived from a non-public environment variable, which
	 * Next.js replaces with `undefined` in the client bundle — the limit shown
	 * to the admin would silently disagree with the limit the API enforces.
	 */
	maxUploadMb: number
}

type MediaFile = {
	name: string
	url: string
	size: number
	kind: "image" | "video" | "document" | "other"
	modifiedAt: string
}

const KINDS = [
	{ value: "all", label: "Hammasi" },
	{ value: "image", label: "Rasmlar" },
	{ value: "video", label: "Videolar" },
	{ value: "document", label: "Hujjatlar" },
] as const

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Media library.
 *
 * Uploads previously had no listing at all, so files could only be added,
 * never reviewed, reused or removed — the volume grew forever with orphans.
 */
export function MediaLibrary({ maxUploadMb }: Props) {
	const { success, error: notifyError } = useToast()
	const [files, setFiles] = useState<MediaFile[]>([])
	const [totalBytes, setTotalBytes] = useState(0)
	const [kind, setKind] = useState<string>("all")
	const [term, setTerm] = useState("")
	const [loading, setLoading] = useState(true)
	const [uploading, setUploading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	const load = useCallback(
		async (signal?: AbortSignal) => {
			setLoading(true)
			try {
				const params = new URLSearchParams({ kind })
				if (term.trim()) params.set("q", term.trim())

				const response = await fetch(`/api/admin/media?${params.toString()}`, {
					signal,
				})
				const payload = (await response.json()) as {
					ok?: boolean
					files?: MediaFile[]
					totalBytes?: number
					error?: string
				}
				if (!response.ok || !payload.ok) {
					notifyError(payload.error ?? "Fayllarni yuklab bo'lmadi")
					return
				}
				setFiles(payload.files ?? [])
				setTotalBytes(payload.totalBytes ?? 0)
			} catch (error) {
				// An aborted request is the expected outcome of a fast re-filter,
				// not a failure worth showing to the user.
				if ((error as Error)?.name !== "AbortError") {
					notifyError("Tarmoq xatosi")
				}
			} finally {
				setLoading(false)
			}
		},
		[kind, notifyError, term],
	)

	useEffect(() => {
		const controller = new AbortController()
		// Debounced so typing in the filter box does not fire a request per key.
		const timer = setTimeout(() => void load(controller.signal), 220)
		return () => {
			clearTimeout(timer)
			controller.abort()
		}
	}, [load])

	const upload = async (fileList: FileList | null) => {
		if (!fileList?.length) return
		setUploading(true)
		let uploaded = 0

		for (const file of Array.from(fileList)) {
			const body = new FormData()
			body.append("file", file)
			try {
				const response = await fetch("/api/upload", { method: "POST", body })
				const payload = (await response.json()) as {
					ok?: boolean
					error?: string
				}
				if (!response.ok || !payload.ok) {
					notifyError(`${file.name}: ${payload.error ?? "yuklanmadi"}`)
					continue
				}
				uploaded += 1
			} catch {
				notifyError(`${file.name}: tarmoq xatosi`)
			}
		}

		setUploading(false)
		if (inputRef.current) inputRef.current.value = ""
		if (uploaded > 0) {
			success(`${uploaded} ta fayl yuklandi`)
			void load()
		}
	}

	const remove = async (name: string) => {
		if (!window.confirm(`"${name}" o'chirilsinmi?`)) return
		try {
			const response = await fetch("/api/admin/media", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ names: [name] }),
			})
			const payload = (await response.json()) as {
				ok?: boolean
				error?: string
			}
			if (!response.ok || !payload.ok) {
				notifyError(payload.error ?? "O'chirib bo'lmadi")
				return
			}
			success("Fayl o'chirildi")
			void load()
		} catch {
			notifyError("Tarmoq xatosi")
		}
	}

	const copy = async (url: string) => {
		try {
			await navigator.clipboard.writeText(url)
			success("Havola nusxalandi")
		} catch {
			notifyError("Nusxalab bo'lmadi")
		}
	}

	const summary = useMemo(
		() => `${files.length} ta fayl · jami ${formatBytes(totalBytes)}`,
		[files.length, totalBytes],
	)

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex h-10 items-center overflow-hidden rounded-md border border-line">
					{KINDS.map((item) => (
						<button
							key={item.value}
							type="button"
							aria-pressed={kind === item.value}
							onClick={() => setKind(item.value)}
							className={cn(
								"h-full px-3 text-xs transition",
								kind === item.value
									? "bg-brand-500/15 text-brand-200"
									: "text-ink-muted hover:text-ink",
							)}
						>
							{item.label}
						</button>
					))}
				</div>

				<input
					type="search"
					value={term}
					onChange={(event) => setTerm(event.target.value)}
					placeholder="Fayl nomi…"
					aria-label="Fayl qidirish"
					className="h-10 w-[200px] rounded-md border border-line bg-base-raised px-3 text-sm outline-none transition focus:border-brand-500/60"
				/>

				<div className="ml-auto flex items-center gap-2">
					<span className="text-xs text-ink-faint">{summary}</span>
					<input
						ref={inputRef}
						type="file"
						multiple
						onChange={(event) => void upload(event.target.files)}
						className="hidden"
						id="media-upload"
						accept="image/png,image/jpeg,image/webp,image/avif,image/gif,application/pdf,video/mp4,video/webm"
					/>
					<label
						htmlFor="media-upload"
						className={cn(
							"inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-brand-gradient px-4 text-sm font-medium text-white shadow-glow transition hover:opacity-95",
							uploading && "pointer-events-none opacity-60",
						)}
					>
						<Icon name="Download" className="h-4 w-4 rotate-180" />
						{uploading ? "Yuklanmoqda…" : "Fayl yuklash"}
					</label>
				</div>
			</div>

			<p className="text-xs text-ink-faint">
				Ruxsat etilgan formatlar: PNG, JPEG, WebP, AVIF, GIF, PDF, MP4, WebM ·
				maksimum {maxUploadMb} MB. SVG xavfsizlik sababli qabul qilinmaydi.
			</p>

			{loading ? (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 8 }).map((_, index) => (
						<div
							key={index}
							className="skeleton aspect-[4/3] rounded-lg"
							aria-hidden="true"
						/>
					))}
				</div>
			) : files.length === 0 ? (
				<div className="card-surface rounded-lg px-6 py-14 text-center">
					<p className="text-sm text-ink-muted">Fayl topilmadi.</p>
				</div>
			) : (
				<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{files.map((file) => (
						<li key={file.name} className="card-surface overflow-hidden rounded-lg">
							<div className="relative aspect-[4/3] bg-base-raised">
								{file.kind === "image" ? (
									<Image
										src={file.url}
										alt={file.name}
										fill
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
										className="object-cover"
										/* Already-optimised uploads: re-encoding through
										   /_next/image would only add CPU cost here. */
										unoptimized
									/>
								) : (
									<div className="grid h-full place-items-center">
										<Icon
											name={file.kind === "video" ? "Play" : "FileText"}
											className="h-8 w-8 text-ink-faint"
										/>
									</div>
								)}
							</div>
							<div className="space-y-2 p-3">
								<p className="truncate text-xs" title={file.name}>
									{file.name}
								</p>
								<p className="font-mono text-[10px] text-ink-faint">
									{formatBytes(file.size)}
								</p>
								<div className="flex gap-1.5">
									<button
										type="button"
										onClick={() => void copy(file.url)}
										className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-md border border-line text-[11px] transition hover:border-line-strong"
									>
										<Icon name="Copy" className="h-3 w-3" />
										Havola
									</button>
									<a
										href={file.url}
										target="_blank"
										rel="noreferrer"
										className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line transition hover:border-line-strong"
										aria-label="Ochish"
									>
										<Icon name="ExternalLink" className="h-3 w-3" />
									</a>
									<button
										type="button"
										onClick={() => void remove(file.name)}
										className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-faint transition hover:border-danger/40 hover:text-danger"
										aria-label="O'chirish"
									>
										<Icon name="X" className="h-3 w-3" />
									</button>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
