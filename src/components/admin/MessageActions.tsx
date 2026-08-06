"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/components/admin/Toast"

type Props = {
	id: string
	read: boolean
	archived: boolean
	selected: boolean
	onToggleSelect: (id: string) => void
}

/**
 * Row actions for a single message.
 *
 * The previous version ignored the HTTP status entirely: a 401 after the
 * session expired, or a 500, looked identical to success — the row simply did
 * not change and the admin had no idea why. Every call is now checked and
 * reported through a toast.
 */
export function MessageActions({
	id,
	read,
	archived,
	selected,
	onToggleSelect,
}: Props) {
	const router = useRouter()
	const { success, error: notifyError } = useToast()
	const [pending, setPending] = useState(false)
	const [isRefreshing, startTransition] = useTransition()

	const busy = pending || isRefreshing

	const send = async (
		init: RequestInit,
		successMessage: string,
	) => {
		setPending(true)
		try {
			const response = await fetch(`/api/admin/messages/${id}`, init)
			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as
					| { error?: string }
					| null
				notifyError(payload?.error ?? "Amalni bajarib bo'lmadi")
				return
			}
			success(successMessage)
			startTransition(() => router.refresh())
		} catch {
			notifyError("Tarmoq xatosi")
		} finally {
			setPending(false)
		}
	}

	const patch = (body: Record<string, boolean>, message: string) =>
		send(
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			},
			message,
		)

	const remove = () => {
		if (!window.confirm("Bu xabar o'chirilsinmi?")) return
		return send({ method: "DELETE" }, "Xabar o'chirildi")
	}

	return (
		<div className="flex items-center gap-1.5">
			<input
				type="checkbox"
				checked={selected}
				onChange={() => onToggleSelect(id)}
				aria-label="Xabarni tanlash"
				className="mr-1 size-4 accent-brand-500"
			/>

			<button
				type="button"
				onClick={() =>
					patch({ read: !read }, read ? "O'qilmagan deb belgilandi" : "O'qildi")
				}
				disabled={busy}
				className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs text-ink-muted transition hover:border-line-strong hover:text-ink disabled:opacity-60"
			>
				<Icon name="Check" className="h-3.5 w-3.5" />
				{read ? "O'qilmagan" : "O'qildi"}
			</button>

			<button
				type="button"
				onClick={() =>
					patch(
						{ archived: !archived },
						archived ? "Arxivdan chiqarildi" : "Arxivlandi",
					)
				}
				disabled={busy}
				className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs text-ink-muted transition hover:border-line-strong hover:text-ink disabled:opacity-60"
			>
				<Icon name="Layers" className="h-3.5 w-3.5" />
				{archived ? "Tiklash" : "Arxiv"}
			</button>

			<button
				type="button"
				onClick={remove}
				disabled={busy}
				className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs text-ink-faint transition hover:text-danger disabled:opacity-60"
			>
				<Icon name="X" className="h-3.5 w-3.5" />
				O&apos;chirish
			</button>
		</div>
	)
}
