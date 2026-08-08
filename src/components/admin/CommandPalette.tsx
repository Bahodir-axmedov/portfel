"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "@/components/ui/Icon"
import { adminResources, profileResource } from "@/lib/resources"
import { cn } from "@/lib/utils"

type Command = {
	id: string
	label: string
	hint: string
	icon: string
	href: string
}

/**
 * ⌘K navigator.
 *
 * With twenty sections in the sidebar, scrolling to a resource costs more
 * than typing three letters. Everything here is a plain route push, so the
 * palette adds no state that could drift from the rest of the panel.
 */
export function CommandPalette() {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [term, setTerm] = useState("")
	const [cursor, setCursor] = useState(0)
	const inputRef = useRef<HTMLInputElement>(null)

	const commands = useMemo<Command[]>(() => {
		const base: Command[] = [
			{
				id: "dashboard",
				label: "Boshqaruv paneli",
				hint: "Sahifa",
				icon: "Gauge",
				href: "/admin",
			},
			{
				id: "profile",
				label: profileResource.label,
				hint: "Sahifa",
				icon: profileResource.icon,
				href: "/admin/profile",
			},
			{
				id: "messages",
				label: "Xabarlar",
				hint: "Sahifa",
				icon: "Mail",
				href: "/admin/messages",
			},
			{
				id: "media",
				label: "Media kutubxona",
				hint: "Sahifa",
				icon: "Image",
				href: "/admin/media",
			},
			{
				id: "backup",
				label: "Zaxira va tiklash",
				hint: "Sahifa",
				icon: "Database",
				href: "/admin/backup",
			},
			{
				id: "preferences",
				label: "Interfeys sozlamalari",
				hint: "Sahifa",
				icon: "Sparkles",
				href: "/admin/preferences",
			},
			{
				id: "site",
				label: "Saytni ochish",
				hint: "Tashqi",
				icon: "ExternalLink",
				href: "/",
			},
		]

		for (const resource of adminResources) {
			base.push({
				id: `list-${resource.key}`,
				label: resource.label,
				hint: "Ro'yxat",
				icon: resource.icon,
				href: `/admin/${resource.key}`,
			})
			base.push({
				id: `new-${resource.key}`,
				label: `Yangi: ${resource.singular}`,
				hint: "Yaratish",
				icon: "Sparkles",
				href: `/admin/${resource.key}/new`,
			})
		}

		return base
	}, [])

	const results = useMemo(() => {
		const needle = term.trim().toLocaleLowerCase("en")
		if (!needle) return commands.slice(0, 8)
		return commands
			.filter((command) =>
				`${command.label} ${command.hint}`
					.toLocaleLowerCase("en")
					.includes(needle),
			)
			.slice(0, 10)
	}, [commands, term])

	const close = useCallback(() => {
		setOpen(false)
		setTerm("")
		setCursor(0)
	}, [])

	const run = useCallback(
		(command: Command | undefined) => {
			if (!command) return
			close()
			router.push(command.href)
		},
		[close, router],
	)

	// Global shortcut. The listener is registered once and removed on unmount,
	// so remounting the admin shell cannot stack duplicate handlers.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault()
				setOpen((value) => !value)
			}
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [])

	useEffect(() => {
		if (open) inputRef.current?.focus()
	}, [open])

	useEffect(() => {
		setCursor(0)
	}, [term])

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="hidden h-9 items-center gap-2 rounded-md border border-line px-3 text-xs text-ink-faint transition hover:border-line-strong hover:text-ink-muted lg:inline-flex"
			>
				<Icon name="Terminal" className="h-3.5 w-3.5" />
				Qidirish
				<kbd className="rounded border border-line px-1 font-mono text-[10px]">
					⌘K
				</kbd>
			</button>
		)
	}

	return (
		<div
			className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
			onClick={close}
			role="presentation"
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Buyruqlar paneli"
				className="glass-strong w-full max-w-[520px] overflow-hidden rounded-lg border border-line-strong"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-center gap-2 border-b border-line px-4">
					<Icon name="Terminal" className="h-4 w-4 shrink-0 text-ink-faint" />
					<input
						ref={inputRef}
						value={term}
						onChange={(event) => setTerm(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Escape") close()
							if (event.key === "ArrowDown") {
								event.preventDefault()
								setCursor((value) => Math.min(value + 1, results.length - 1))
							}
							if (event.key === "ArrowUp") {
								event.preventDefault()
								setCursor((value) => Math.max(value - 1, 0))
							}
							if (event.key === "Enter") {
								event.preventDefault()
								run(results[cursor])
							}
						}}
						placeholder="Bo'lim yoki amal nomini yozing…"
						aria-label="Buyruq qidirish"
						className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
					/>
					<kbd className="shrink-0 rounded border border-line px-1 font-mono text-[10px] text-ink-faint">
						esc
					</kbd>
				</div>

				{results.length === 0 ? (
					<p className="px-4 py-6 text-center text-xs text-ink-faint">
						Hech narsa topilmadi.
					</p>
				) : (
					<ul className="max-h-[320px] overflow-y-auto p-2">
						{results.map((command, index) => (
							<li key={command.id}>
								<button
									type="button"
									onMouseEnter={() => setCursor(index)}
									onClick={() => run(command)}
									className={cn(
										"flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition",
										index === cursor ? "bg-glass text-ink" : "text-ink-muted",
									)}
								>
									<Icon name={command.icon} className="h-4 w-4 shrink-0" />
									<span className="min-w-0 flex-1 truncate">
										{command.label}
									</span>
									<span className="shrink-0 font-mono text-[10px] text-ink-faint">
										{command.hint}
									</span>
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}
