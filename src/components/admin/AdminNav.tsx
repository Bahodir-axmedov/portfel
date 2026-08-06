"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { LogoMark } from "@/components/ui/LogoMark"
import { adminResources, profileResource } from "@/lib/resources"
import { cn } from "@/lib/utils"

const primary = [
	{ href: "/admin", label: "Boshqaruv paneli", icon: "Gauge" },
	{
		href: "/admin/profile",
		label: profileResource.label,
		icon: profileResource.icon,
	},
	{ href: "/admin/messages", label: "Xabarlar", icon: "Mail" },
]

function NavLink({
	href,
	label,
	icon,
	active,
	onNavigate,
}: {
	href: string
	label: string
	icon: string
	active: boolean
	onNavigate?: () => void
}) {
	return (
		<Link
			href={href}
			onClick={onNavigate}
			className={cn(
				"flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
				active
					? "bg-glass text-ink shadow-inset-hairline"
					: "text-ink-muted hover:bg-glass hover:text-ink",
			)}
		>
			<Icon name={icon} className="h-4 w-4 shrink-0" />
			<span className="truncate">{label}</span>
		</Link>
	)
}

export function AdminNav({ email }: { email: string }) {
	const pathname = usePathname()
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [loggingOut, setLoggingOut] = useState(false)

	const isActive = (href: string) =>
		href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

	const logout = async () => {
		setLoggingOut(true)
		await fetch("/api/auth/logout", { method: "POST" })
		router.replace("/admin/login")
		router.refresh()
	}

	const close = () => setOpen(false)

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className="fixed left-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-full border border-line bg-glass backdrop-blur-md lg:hidden"
				aria-label="Menyu"
			>
				<Icon name={open ? "X" : "Menu"} className="h-4 w-4" />
			</button>

			{open ? (
				<div
					className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
					onClick={close}
				/>
			) : null}

			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-line bg-base-soft transition-transform duration-300 lg:translate-x-0",
					open ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="flex items-center gap-2 px-5 py-5">
					<LogoMark size={32} />
					<div className="leading-tight">
						<p className="text-sm font-semibold">Bahodir.dev</p>
						<p className="font-mono text-[11px] text-ink-faint">admin</p>
					</div>
				</div>

				<nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
					{primary.map((item) => (
						<NavLink
							key={item.href}
							{...item}
							active={isActive(item.href)}
							onNavigate={close}
						/>
					))}

					<p className="px-3 pb-1 pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
						Kontent
					</p>

					{adminResources.map((resource) => (
						<NavLink
							key={resource.key}
							href={`/admin/${resource.key}`}
							label={resource.label}
							icon={resource.icon}
							active={isActive(`/admin/${resource.key}`)}
							onNavigate={close}
						/>
					))}
				</nav>

				<div className="border-t border-line px-3 py-4">
					<p className="truncate px-3 pb-2 text-xs text-ink-faint">{email}</p>
					<div className="flex flex-col gap-1">
						<Link
							href="/"
							target="_blank"
							className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-muted transition hover:bg-glass hover:text-ink"
						>
							<Icon name="ExternalLink" className="h-4 w-4" />
							Saytni ochish
						</Link>
						<button
							type="button"
							onClick={logout}
							disabled={loggingOut}
							className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-glass hover:text-danger disabled:opacity-60"
						>
							<Icon name="ArrowLeft" className="h-4 w-4" />
							{loggingOut ? "Chiqilmoqda…" : "Chiqish"}
						</button>
					</div>
				</div>
			</aside>
		</>
	)
}
