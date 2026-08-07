"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import { cn } from "@/lib/utils"

/**
 * Notification menu in the admin header.
 *
 * The data is fetched on the server by `AdminShell` and passed down already
 * formatted. Nothing is polled: an admin panel with a single operator does not
 * need a timer waking the browser every few seconds, and a page navigation
 * refreshes the list anyway.
 */

export type NotificationItem = {
	id: string
	title: string
	meta: string
	href: string
}

type Props = {
	unread: number
	items: NotificationItem[]
}

export function NotificationBell({ unread, items }: Props) {
	const [open, setOpen] = useState(false)
	const wrapRef = useRef<HTMLDivElement>(null)

	// Closes on Escape and on a click outside. Both listeners are removed on
	// cleanup, otherwise every navigation would leave another one behind.
	useEffect(() => {
		if (!open) return

		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false)
		}
		const onClick = (event: MouseEvent) => {
			const node = wrapRef.current
			if (node && !node.contains(event.target as Node)) setOpen(false)
		}

		window.addEventListener("keydown", onKey)
		document.addEventListener("mousedown", onClick)
		return () => {
			window.removeEventListener("keydown", onKey)
			document.removeEventListener("mousedown", onClick)
		}
	}, [open])

	return (
		<div ref={wrapRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((current) => !current)}
				aria-expanded={open}
				aria-haspopup="menu"
				aria-label={
					unread > 0
						? `Bildirishnomalar, ${unread} ta o'qilmagan xabar`
						: "Bildirishnomalar"
				}
				className={cn(
					"relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-muted transition hover:border-line-strong hover:text-ink",
					open && "border-line-strong text-ink",
				)}
			>
				<Icon name="MessagesSquare" className="h-4 w-4" />
				{unread > 0 ? (
					<span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
						{unread > 9 ? "9+" : unread}
					</span>
				) : null}
			</button>

			{open ? (
				<div
					role="menu"
					className="absolute right-0 top-11 z-40 w-[320px] overflow-hidden rounded-lg border border-line bg-base-soft shadow-glow-lg"
				>
					<div className="border-b border-line px-3 py-2 text-xs text-ink-faint">
						{unread > 0
							? `${unread} ta o'qilmagan xabar`
							: "O'qilmagan xabar yo'q"}
					</div>

					{items.length === 0 ? (
						<p className="px-3 py-6 text-center text-sm text-ink-faint">
							Hozircha hech narsa yo&apos;q.
						</p>
					) : (
						<ul className="max-h-[320px] overflow-y-auto">
							{items.map((item) => (
								<li key={item.id}>
									<Link
										href={item.href}
										onClick={() => setOpen(false)}
										className="flex flex-col gap-0.5 border-b border-line/60 px-3 py-2.5 transition hover:bg-glass"
									>
										<span className="truncate text-sm text-ink">
											{item.title}
										</span>
										<span className="text-xs text-ink-faint">{item.meta}</span>
									</Link>
								</li>
							))}
						</ul>
					)}

					<div className="flex items-center justify-between px-3 py-2 text-xs">
						<Link
							href="/admin/messages"
							onClick={() => setOpen(false)}
							className="text-ink-muted transition hover:text-ink"
						>
							Xabarlar
						</Link>
						<Link
							href="/admin/activity"
							onClick={() => setOpen(false)}
							className="text-ink-muted transition hover:text-ink"
						>
							Faoliyat jurnali
						</Link>
					</div>
				</div>
			) : null}
		</div>
	)
}
