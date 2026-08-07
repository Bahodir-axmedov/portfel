"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo, useState, useTransition } from "react"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/components/admin/Toast"
import { ADMIN_PAGE_SIZES } from "@/constants"
import { cn } from "@/lib/utils"
import type { AdminFieldType, BulkAction } from "@/types"

/**
 * Admin list table.
 *
 * Server-paginated, sortable, filterable, with row selection and bulk
 * operations. Only the data it needs is passed across the server/client
 * boundary — shipping the whole resource config (every field, option list and
 * help string) would add kilobytes to the payload of every list page.
 */

export type TableColumn = {
	name: string
	label: string
	type?: AdminFieldType
	sortable: boolean
}

type Row = Record<string, unknown>

type Props = {
	resourceKey: string
	singular: string
	columns: TableColumn[]
	rows: Row[]
	idKey: "id" | "key"
	hasPublished: boolean
	hasOrder: boolean
	searchable: boolean
	page: number
	pageSize: number
	pageCount: number
	total: number
	sort: string | null
	direction: "asc" | "desc"
	term: string
	publishedFilter: "all" | "true" | "false"
}

function Cell({ value, type }: { value: unknown; type?: AdminFieldType }) {
	if (type === "checkbox") {
		return value ? (
			<Icon name="Check" className="h-4 w-4 text-success" />
		) : (
			<span className="text-ink-faint">—</span>
		)
	}

	if (value === null || value === undefined || value === "") {
		return <span className="text-ink-faint">—</span>
	}

	if (type === "color" && typeof value === "string") {
		return (
			<span className="inline-flex items-center gap-2">
				<span
					className="size-3.5 rounded-full border border-line"
					style={{ backgroundColor: value }}
				/>
				<span className="font-mono text-xs">{value}</span>
			</span>
		)
	}

	if (Array.isArray(value)) {
		const shown = value.slice(0, 3).map(String)
		return (
			<span className="flex flex-wrap gap-1">
				{shown.map((item) => (
					<span
						key={item}
						className="rounded border border-line px-1.5 py-0.5 text-[11px] text-ink-muted"
					>
						{item}
					</span>
				))}
				{value.length > 3 ? (
					<span className="text-[11px] text-ink-faint">
						+{value.length - 3}
					</span>
				) : null}
			</span>
		)
	}

	return <span className="line-clamp-1">{String(value)}</span>
}

export function DataTable(props: Props) {
	const {
		resourceKey,
		singular,
		columns,
		rows,
		idKey,
		hasPublished,
		hasOrder,
		searchable,
		page,
		pageSize,
		pageCount,
		total,
		sort,
		direction,
		term,
		publishedFilter,
	} = props

	const router = useRouter()
	const searchParams = useSearchParams()
	const { success, error: notifyError } = useToast()

	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [search, setSearch] = useState(term)
	const [busy, setBusy] = useState(false)
	const [isPending, startTransition] = useTransition()

	/*
	 * Drag ordering keeps its own copy of the rows so a dropped row moves
	 * immediately; waiting for the server round trip makes the table feel
	 * broken. The copy is rebuilt whenever the server sends a different row
	 * set, which is React's documented way to reset state from props without
	 * an effect.
	 */
	const signature = useMemo(
		() => rows.map((row) => String(row[idKey] ?? "")).join("|"),
		[rows, idKey],
	)
	const [localRows, setLocalRows] = useState(rows)
	const [localSignature, setLocalSignature] = useState(signature)
	if (localSignature !== signature) {
		setLocalSignature(signature)
		setLocalRows(rows)
	}

	const [dragId, setDragId] = useState<string | null>(null)
	const [overId, setOverId] = useState<string | null>(null)

	const ids = useMemo(
		() => rows.map((row) => String(row[idKey] ?? "")).filter(Boolean),
		[rows, idKey],
	)

	const allSelected = ids.length > 0 && ids.every((id) => selected.has(id))
	const someSelected = selected.size > 0

	/** Rewrites the query string, always resetting to page 1 on a filter change. */
	const navigate = useCallback(
		(changes: Record<string, string | null>, resetPage = true) => {
			const next = new URLSearchParams(searchParams.toString())
			for (const [key, value] of Object.entries(changes)) {
				if (value === null || value === "") next.delete(key)
				else next.set(key, value)
			}
			if (resetPage && !("page" in changes)) next.delete("page")

			const qs = next.toString()
			startTransition(() => {
				router.push(
					qs ? `/admin/${resourceKey}?${qs}` : `/admin/${resourceKey}`,
				)
			})
		},
		[resourceKey, router, searchParams],
	)

	const toggleSort = useCallback(
		(column: string) => {
			const nextDirection =
				sort === column && direction === "asc" ? "desc" : "asc"
			navigate({ sort: column, dir: nextDirection })
		},
		[direction, navigate, sort],
	)

	const toggleRow = useCallback((id: string) => {
		setSelected((current) => {
			const next = new Set(current)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}, [])

	const toggleAll = useCallback(() => {
		setSelected((current) =>
			ids.every((id) => current.has(id)) ? new Set() : new Set(ids),
		)
	}, [ids])

	const runBulk = useCallback(
		async (action: BulkAction, targetIds?: string[]) => {
			const list = targetIds ?? Array.from(selected)
			if (list.length === 0) return

			if (action === "delete") {
				const confirmed = window.confirm(
					`${list.length} ta yozuv o'chiriladi. Davom etamizmi?`,
				)
				if (!confirmed) return
			}

			setBusy(true)
			try {
				const response = await fetch(`/api/admin/${resourceKey}/bulk`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action, ids: list }),
				})
				const payload = (await response.json()) as {
					ok?: boolean
					count?: number
					error?: string
				}

				if (!response.ok || !payload.ok) {
					notifyError(payload.error ?? "Amalni bajarib bo'lmadi")
					return
				}

				const labels: Record<BulkAction, string> = {
					delete: "o'chirildi",
					publish: "chop etildi",
					unpublish: "yashirildi",
					duplicate: "nusxalandi",
				}
				success(`${payload.count ?? list.length} ta yozuv ${labels[action]}`)
				setSelected(new Set())
				startTransition(() => router.refresh())
			} catch {
				notifyError("Tarmoq xatosi. Qaytadan urinib ko'ring.")
			} finally {
				setBusy(false)
			}
		},
		[notifyError, resourceKey, router, selected, success],
	)

	const persistOrder = useCallback(
		async (next: Row[]) => {
			const items = next
				.map((row, index) => ({
					id: String(row[idKey] ?? ""),
					// Offset by the current page so ordering stays global instead of
					// restarting at zero on every page.
					order: (page - 1) * pageSize + index,
				}))
				.filter((item) => item.id)

			if (items.length === 0) return

			setBusy(true)
			try {
				const response = await fetch(`/api/admin/${resourceKey}/reorder`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ items }),
				})
				const payload = (await response.json()) as {
					ok?: boolean
					error?: string
				}

				if (!response.ok || !payload.ok) {
					notifyError(payload.error ?? "Tartibni saqlab bo'lmadi")
					// Roll the view back to what the database actually holds, so the
					// screen never shows an order that was rejected.
					setLocalRows(rows)
					return
				}

				success("Tartib saqlandi")
				startTransition(() => router.refresh())
			} catch {
				notifyError("Tarmoq xatosi. Qaytadan urinib ko'ring.")
				setLocalRows(rows)
			} finally {
				setBusy(false)
			}
		},
		[idKey, notifyError, page, pageSize, resourceKey, rows, router, success],
	)

	const handleDrop = useCallback(
		(targetId: string) => {
			const sourceId = dragId
			setOverId(null)
			setDragId(null)
			if (!sourceId || sourceId === targetId) return

			const current = [...localRows]
			const from = current.findIndex(
				(row) => String(row[idKey] ?? "") === sourceId,
			)
			const to = current.findIndex(
				(row) => String(row[idKey] ?? "") === targetId,
			)
			if (from < 0 || to < 0) return

			const [moved] = current.splice(from, 1)
			current.splice(to, 0, moved)
			setLocalRows(current)
			void persistOrder(current)
		},
		[dragId, idKey, localRows, persistOrder],
	)

	const disabled = busy || isPending
	const from = total === 0 ? 0 : (page - 1) * pageSize + 1
	const to = Math.min(total, page * pageSize)

	return (
		<div className="space-y-4">
			{/* ---------- filters ---------- */}
			<div className="flex flex-wrap items-center gap-2">
				{searchable ? (
					<form
						className="flex items-center gap-2"
						onSubmit={(event) => {
							event.preventDefault()
							navigate({ q: search.trim() || null })
						}}
					>
						<div className="relative">
							<Icon
								name="Globe"
								className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
							/>
							<input
								type="search"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Qidirish…"
								aria-label="Qidirish"
								className="h-10 w-[220px] rounded-md border border-line bg-base-raised pl-9 pr-3 text-sm outline-none transition focus:border-brand-500/60"
							/>
						</div>
						{term ? (
							<button
								type="button"
								onClick={() => {
									setSearch("")
									navigate({ q: null })
								}}
								className="h-10 rounded-md border border-line px-3 text-sm text-ink-muted transition hover:text-ink"
							>
								Tozalash
							</button>
						) : null}
					</form>
				) : null}

				{hasPublished ? (
					<div className="flex h-10 items-center overflow-hidden rounded-md border border-line">
						{(
							[
								["all", "Hammasi"],
								["true", "Chop etilgan"],
								["false", "Qoralama"],
							] as const
						).map(([value, label]) => (
							<button
								key={value}
								type="button"
								aria-pressed={publishedFilter === value}
								onClick={() =>
									navigate({ published: value === "all" ? null : value })
								}
								className={cn(
									"h-full px-3 text-xs transition",
									publishedFilter === value
										? "bg-brand-500/15 text-brand-200"
										: "text-ink-muted hover:text-ink",
								)}
							>
								{label}
							</button>
						))}
					</div>
				) : null}

				<div className="ml-auto flex items-center gap-2 text-xs text-ink-faint">
					<label htmlFor="page-size">Sahifada</label>
					<select
						id="page-size"
						value={pageSize}
						onChange={(event) => navigate({ pageSize: event.target.value })}
						className="h-9 rounded-md border border-line bg-base-raised px-2 text-xs outline-none"
					>
						{ADMIN_PAGE_SIZES.map((size) => (
							<option key={size} value={size}>
								{size}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* ---------- bulk toolbar ---------- */}
			{someSelected ? (
				<div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-2.5 text-sm">
					<span className="font-medium text-brand-100">
						{selected.size} ta tanlandi
					</span>
					<div className="ml-auto flex flex-wrap gap-2">
						{hasPublished ? (
							<>
								<button
									type="button"
									disabled={disabled}
									onClick={() => runBulk("publish")}
									className="h-8 rounded-md border border-line px-3 text-xs transition hover:border-line-strong disabled:opacity-50"
								>
									Chop etish
								</button>
								<button
									type="button"
									disabled={disabled}
									onClick={() => runBulk("unpublish")}
									className="h-8 rounded-md border border-line px-3 text-xs transition hover:border-line-strong disabled:opacity-50"
								>
									Yashirish
								</button>
							</>
						) : null}
						<button
							type="button"
							disabled={disabled}
							onClick={() => runBulk("duplicate")}
							className="h-8 rounded-md border border-line px-3 text-xs transition hover:border-line-strong disabled:opacity-50"
						>
							Nusxalash
						</button>
						<button
							type="button"
							disabled={disabled}
							onClick={() => runBulk("delete")}
							className="h-8 rounded-md border border-danger/40 bg-danger/10 px-3 text-xs text-danger transition hover:bg-danger/20 disabled:opacity-50"
						>
							O&apos;chirish
						</button>
						<button
							type="button"
							onClick={() => setSelected(new Set())}
							className="h-8 rounded-md px-2 text-xs text-ink-muted transition hover:text-ink"
						>
							Bekor qilish
						</button>
					</div>
				</div>
			) : null}

			{/* ---------- table ---------- */}
			{rows.length === 0 ? (
				<div className="card-surface rounded-lg px-6 py-14 text-center">
					<p className="text-sm text-ink-muted">
						{term || publishedFilter !== "all"
							? "Filtr bo'yicha hech narsa topilmadi."
							: "Hozircha yozuv yo'q. Birinchisini qo'shing."}
					</p>
				</div>
			) : (
				<div
					className={cn(
						"card-surface overflow-hidden rounded-lg transition",
						disabled && "pointer-events-none opacity-60",
					)}
				>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] text-sm">
							<thead>
								<tr className="border-b border-line text-left">
									<th scope="col" className="w-10 px-4 py-3">
										<input
											type="checkbox"
											checked={allSelected}
											onChange={toggleAll}
											aria-label="Barchasini tanlash"
											className="size-4 accent-brand-500"
										/>
									</th>
									{columns.map((column) => {
										const active = sort === column.name
										return (
											<th
												key={column.name}
												scope="col"
												aria-sort={
													active
														? direction === "asc"
															? "ascending"
															: "descending"
														: "none"
												}
												className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint"
											>
												{column.sortable ? (
													<button
														type="button"
														onClick={() => toggleSort(column.name)}
														className={cn(
															"inline-flex items-center gap-1 transition hover:text-ink",
															active && "text-brand-200",
														)}
													>
														{column.label}
														<Icon
															name={
																active && direction === "desc"
																	? "ChevronDown"
																	: "ChevronUp"
															}
															className={cn(
																"h-3 w-3 transition",
																!active && "opacity-0 group-hover:opacity-60",
															)}
														/>
													</button>
												) : (
													column.label
												)}
											</th>
										)
									})}
									<th scope="col" className="w-28 px-4 py-3">
										<span className="sr-only">Amallar</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{localRows.map((row, index) => {
									const id = String(row[idKey] ?? index)
									const isSelected = selected.has(id)
									return (
										<tr
											key={id}
											draggable={hasOrder && !disabled}
											onDragStart={() => setDragId(id)}
											onDragOver={(event) => {
												if (!hasOrder || !dragId) return
												// Without preventDefault the browser refuses the drop.
												event.preventDefault()
												if (overId !== id) setOverId(id)
											}}
											onDrop={() => handleDrop(id)}
											onDragEnd={() => {
												setDragId(null)
												setOverId(null)
											}}
											className={cn(
												"border-b border-line/60 transition last:border-0 hover:bg-glass",
												isSelected && "bg-brand-500/5",
												dragId === id && "opacity-40",
												overId === id &&
													dragId !== id &&
													"border-t-2 border-t-brand-500",
											)}
										>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													{hasOrder ? (
														<span
															aria-hidden
															title="Tartibni o'zgartirish uchun torting"
															className="cursor-grab text-ink-faint transition hover:text-ink active:cursor-grabbing"
														>
															<Icon name="Menu" className="h-3.5 w-3.5" />
														</span>
													) : null}
													<input
														type="checkbox"
														checked={isSelected}
														onChange={() => toggleRow(id)}
														aria-label={`${singular} tanlash`}
														className="size-4 accent-brand-500"
													/>
												</div>
											</td>
											{columns.map((column) => (
												<td
													key={column.name}
													className="max-w-[280px] px-4 py-3 text-ink-muted"
												>
													{column.name === "published" && hasPublished ? (
														<button
															type="button"
															disabled={disabled}
															onClick={() =>
																runBulk(
																	row.published ? "unpublish" : "publish",
																	[id],
																)
															}
															aria-label={
																row.published ? "Yashirish" : "Chop etish"
															}
															className={cn(
																"inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11px] transition",
																row.published
																	? "border-success/40 bg-success/10 text-success"
																	: "border-line text-ink-faint hover:text-ink",
															)}
														>
															<span className="size-1.5 rounded-full bg-current" />
															{row.published ? "Live" : "Qoralama"}
														</button>
													) : (
														<Cell value={row[column.name]} type={column.type} />
													)}
												</td>
											))}
											<td className="px-4 py-3">
												<div className="flex items-center justify-end gap-1.5">
													<button
														type="button"
														disabled={disabled}
														onClick={() => runBulk("duplicate", [id])}
														title="Nusxalash"
														aria-label="Nusxalash"
														className="inline-flex size-8 items-center justify-center rounded-md border border-line text-ink-faint transition hover:border-line-strong hover:text-ink disabled:opacity-50"
													>
														<Icon name="Copy" className="h-3.5 w-3.5" />
													</button>
													<Link
														href={`/admin/${resourceKey}/${encodeURIComponent(id)}`}
														className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs text-ink-muted transition hover:border-line-strong hover:text-ink"
													>
														<Icon name="FileCode" className="h-3.5 w-3.5" />
														Tahrir
													</Link>
												</div>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* ---------- pagination ---------- */}
			<div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-faint">
				<p>
					{total > 0 ? `${from}–${to} / ${total} ta yozuv` : "0 ta yozuv"}
					{hasOrder ? " · tartib bo'yicha saralangan" : ""}
				</p>

				{pageCount > 1 ? (
					<nav className="flex items-center gap-1" aria-label="Sahifalar">
						<button
							type="button"
							disabled={page <= 1 || disabled}
							onClick={() => navigate({ page: String(page - 1) }, false)}
							className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2.5 transition hover:border-line-strong disabled:opacity-40"
						>
							<Icon name="ChevronLeft" className="h-3.5 w-3.5" />
							Oldingi
						</button>
						<span className="px-3 tabular-nums">
							{page} / {pageCount}
						</span>
						<button
							type="button"
							disabled={page >= pageCount || disabled}
							onClick={() => navigate({ page: String(page + 1) }, false)}
							className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2.5 transition hover:border-line-strong disabled:opacity-40"
						>
							Keyingi
							<Icon name="ChevronRight" className="h-3.5 w-3.5" />
						</button>
					</nav>
				) : null}
			</div>
		</div>
	)
}
