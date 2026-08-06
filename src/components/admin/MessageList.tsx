"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState, useTransition } from "react"
import { Icon } from "@/components/ui/Icon"
import { MessageActions } from "@/components/admin/MessageActions"
import { useToast } from "@/components/admin/Toast"
import { cn } from "@/lib/utils"

export type MessageItem = {
	id: string
	name: string
	email: string
	subject: string | null
	message: string
	locale: string | null
	ip: string | null
	read: boolean
	archived: boolean
	createdAt: string
}

type Props = {
	messages: MessageItem[]
	filter: "all" | "unread" | "archived"
	page: number
	pageCount: number
	total: number
	unread: number
}

const FILTERS = [
	{ value: "all", label: "Hammasi" },
	{ value: "unread", label: "O'qilmagan" },
	{ value: "archived", label: "Arxiv" },
] as const

const formatter = new Intl.DateTimeFormat("uz-UZ", {
	dateStyle: "medium",
	timeStyle: "short",
})

/**
 * Inbox list with filters, selection and bulk actions.
 *
 * `createdAt` arrives as an ISO string rather than a `Date`: passing a Date
 * across the server/client boundary works, but formatting it on the client
 * with a locale the server did not use is the classic source of a hydration
 * mismatch. Formatting from a stable string keeps both renders identical.
 */
export function MessageList({
	messages,
	filter,
	page,
	pageCount,
	total,
	unread,
}: Props) {
	const router = useRouter()
	const { success, error: notifyError } = useToast()
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [busy, setBusy] = useState(false)
	const [isPending, startTransition] = useTransition()

	const ids = useMemo(() => messages.map((item) => item.id), [messages])
	const allSelected = ids.length > 0 && ids.every((id) => selected.has(id))

	const toggleSelect = useCallback((id: string) => {
		setSelected((current) => {
			const next = new Set(current)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}, [])

	const runBulk = useCallback(
		async (
			action: "read" | "unread" | "archive" | "unarchive" | "delete",
			all = false,
		) => {
			const list = Array.from(selected)
			if (!all && list.length === 0) return

			if (action === "delete") {
				if (!window.confirm(`${list.length} ta xabar o'chirilsinmi?`)) return
			}

			setBusy(true)
			try {
				const response = await fetch("/api/admin/messages/bulk", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(
						all ? { action, all: true } : { action, ids: list },
					),
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
				success(`${payload.count ?? 0} ta xabar yangilandi`)
				setSelected(new Set())
				startTransition(() => router.refresh())
			} catch {
				notifyError("Tarmoq xatosi")
			} finally {
				setBusy(false)
			}
		},
		[notifyError, router, selected, success],
	)

	const disabled = busy || isPending

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex h-10 items-center overflow-hidden rounded-md border border-line">
					{FILTERS.map((item) => (
						<Link
							key={item.value}
							href={
								item.value === "all"
									? "/admin/messages"
									: `/admin/messages?filter=${item.value}`
							}
							className={cn(
								"flex h-full items-center px-3 text-xs transition",
								filter === item.value
									? "bg-brand-500/15 text-brand-200"
									: "text-ink-muted hover:text-ink",
							)}
						>
							{item.label}
							{item.value === "unread" && unread > 0 ? (
								<span className="ml-1.5 rounded-full bg-brand-500/20 px-1.5 text-[10px]">
									{unread}
								</span>
							) : null}
						</Link>
					))}
				</div>

				{messages.length > 0 ? (
					<label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-line px-3 text-xs text-ink-muted">
						<input
							type="checkbox"
							checked={allSelected}
							onChange={() =>
								setSelected(allSelected ? new Set() : new Set(ids))
							}
							className="size-4 accent-brand-500"
						/>
						Barchasini tanlash
					</label>
				) : null}

				{unread > 0 ? (
					<button
						type="button"
						disabled={disabled}
						onClick={() => runBulk("read", true)}
						className="ml-auto inline-flex h-10 items-center gap-2 rounded-md border border-line px-3 text-xs transition hover:border-line-strong disabled:opacity-50"
					>
						<Icon name="Check" className="h-3.5 w-3.5" />
						Hammasini o&apos;qildi deb belgilash
					</button>
				) : null}
			</div>

			{selected.size > 0 ? (
				<div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-2.5 text-sm">
					<span className="font-medium text-brand-100">
						{selected.size} ta tanlandi
					</span>
					<div className="ml-auto flex flex-wrap gap-2">
						<button
							type="button"
							disabled={disabled}
							onClick={() => runBulk("read")}
							className="h-8 rounded-md border border-line px-3 text-xs transition hover:border-line-strong disabled:opacity-50"
						>
							O&apos;qildi
						</button>
						<button
							type="button"
							disabled={disabled}
							onClick={() => runBulk("archive")}
							className="h-8 rounded-md border border-line px-3 text-xs transition hover:border-line-strong disabled:opacity-50"
						>
							Arxivlash
						</button>
						<button
							type="button"
							disabled={disabled}
							onClick={() => runBulk("delete")}
							className="h-8 rounded-md border border-danger/40 bg-danger/10 px-3 text-xs text-danger transition hover:bg-danger/20 disabled:opacity-50"
						>
							O&apos;chirish
						</button>
					</div>
				</div>
			) : null}

			{messages.length === 0 ? (
				<div className="card-surface rounded-lg px-6 py-14 text-center">
					<p className="text-sm text-ink-muted">
						{filter === "all"
							? "Hozircha xabar yo'q. Contact formasi orqali kelgan xabarlar shu yerda ko'rinadi."
							: "Bu filtr bo'yicha xabar yo'q."}
					</p>
				</div>
			) : (
				<div
					className={cn(
						"flex max-w-[860px] flex-col gap-3",
						disabled && "pointer-events-none opacity-60",
					)}
				>
					{messages.map((message) => (
						<article
							key={message.id}
							className={cn(
								"card-surface rounded-lg p-5 transition",
								message.read && "opacity-70",
								selected.has(message.id) && "ring-1 ring-brand-500/40",
							)}
						>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="flex items-center gap-2 text-sm font-medium">
										{!message.read ? (
											<span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
										) : null}
										{message.name}
										{message.archived ? (
											<span className="rounded border border-line px-1.5 text-[10px] text-ink-faint">
												arxiv
											</span>
										) : null}
									</p>
									<a
										href={`mailto:${message.email}`}
										className="font-mono text-xs text-ink-faint transition hover:text-accent-400"
									>
										{message.email}
									</a>
								</div>

								<div className="flex flex-col items-end gap-2">
									<time
										dateTime={message.createdAt}
										className="font-mono text-[11px] text-ink-faint"
									>
										{formatter.format(new Date(message.createdAt))}
									</time>
									<MessageActions
										id={message.id}
										read={message.read}
										archived={message.archived}
										selected={selected.has(message.id)}
										onToggleSelect={toggleSelect}
									/>
								</div>
							</div>

							{message.subject ? (
								<p className="mt-3 flex items-center gap-2 text-sm text-ink">
									<Icon name="MessagesSquare" className="h-4 w-4 text-accent-400" />
									{message.subject}
								</p>
							) : null}

							<p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
								{message.message}
							</p>

							<p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
								{message.locale ?? "—"} · {message.ip ?? "ip yo'q"}
							</p>
						</article>
					))}
				</div>
			)}

			{pageCount > 1 ? (
				<nav
					className="flex items-center justify-between gap-3 text-xs text-ink-faint"
					aria-label="Sahifalar"
				>
					<span>{total} ta xabar</span>
					<div className="flex items-center gap-1">
						{page > 1 ? (
							<Link
								href={`/admin/messages?filter=${filter}&page=${page - 1}`}
								className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2.5 transition hover:border-line-strong"
							>
								<Icon name="ChevronLeft" className="h-3.5 w-3.5" />
								Oldingi
							</Link>
						) : null}
						<span className="px-3 tabular-nums">
							{page} / {pageCount}
						</span>
						{page < pageCount ? (
							<Link
								href={`/admin/messages?filter=${filter}&page=${page + 1}`}
								className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2.5 transition hover:border-line-strong"
							>
								Keyingi
								<Icon name="ChevronRight" className="h-3.5 w-3.5" />
							</Link>
						) : null}
					</div>
				</nav>
			) : null}
		</div>
	)
}
