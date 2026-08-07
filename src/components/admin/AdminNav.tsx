"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Icon } from "@/components/ui/Icon"
import { LogoMark } from "@/components/ui/LogoMark"
import { useAnimationEnabled } from "@/hooks"
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

/**
 * A single sidebar row.
 *
 * The active state is drawn by a shared `layoutId` element rather than by a
 * per-row background class. Framer Motion then animates that one element
 * between rows, so the highlight *slides* from the old row to the new one --
 * the Linear behaviour -- instead of one background switching off while another
 * switches on. Because the id is shared across both groups (primary and
 * content), the highlight also travels across the group divider.
 *
 * The pill is rendered *behind* the label via a negative-z sibling instead of
 * wrapping the content, so the sliding box never affects text layout.
 */
function NavLink({
	href,
	label,
	icon,
	active,
	animate,
	onNavigate,
}: {
	href: string
	label: string
	icon: string
	active: boolean
	animate: boolean
	onNavigate?: () => void
}) {
	return (
		<Link
			href={href}
			onClick={onNavigate}
			aria-current={active ? "page" : undefined}
			className={cn(
				"group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-200",
				active ? "text-ink" : "text-ink-muted hover:text-ink",
			)}
		>
			{active ? (
				animate ? (
					<motion.span
						layoutId="admin-nav-pill"
						className="absolute inset-0 -z-10 rounded-md border border-line-strong bg-glass"
						transition={{ type: "spring", stiffness: 380, damping: 32 }}
					/>
				) : (
					<span className="absolute inset-0 -z-10 rounded-md border border-line-strong bg-glass" />
				)
			) : (
				<span
					aria-hidden
					className="absolute inset-0 -z-10 rounded-md bg-white/[0.035] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
				/>
			)}

			{/* Gradient rail on the active row. */}
			<span
				aria-hidden
				className={cn(
					"absolute left-0 top-1/2 w-[2px] -translate-y-1/2 rounded-full bg-brand-gradient transition-all duration-300",
					active ? "h-5 opacity-100" : "h-0 opacity-0",
				)}
			/>

			<Icon
				name={icon}
				className={cn(
					"h-4 w-4 shrink-0 transition-colors duration-200",
					active
						? "text-brand-300"
						: "text-ink-faint group-hover:text-ink-muted",
				)}
			/>
			<span className="truncate">{label}</span>
		</Link>
	)
}

function GroupLabel({ children }: { children: string }) {
	return (
		<p className="px-3 pb-1 pt-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">
			{children}
		</p>
	)
}

export function AdminNav({ email }: { email: string }) {
	const pathname = usePathname()
	const router = useRouter()
	const animate = useAnimationEnabled()
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
				className="fixed left-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-full border border-line bg-base/80 backdrop-blur-xl transition-colors hover:border-line-strong lg:hidden"
				aria-label="Menyu"
				aria-expanded={open}
			>
				<Icon name={open ? "X" : "Menu"} className="h-4 w-4" />
			</button>

			<AnimatePresence>
				{open ? (
					<motion.div
						key="admin-nav-scrim"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
						onClick={close}
					/>
				) : null}
			</AnimatePresence>

			{/* The drawer stays mounted and slides with a transform.
			    Unmounting it on mobile would tear down the `layoutId` pill and make
			    the highlight jump on the next open, and it would also drop the
			    sidebar from the accessibility tree on desktop during hydration. */}
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-line bg-base-soft/95 backdrop-blur-xl transition-transform duration-300 ease-premium lg:translate-x-0",
					open ? "translate-x-0" : "-translate-x-full",
				)}
			>
				{/* Ambient tint so the sidebar reads as a distinct surface from the
				    content area without needing a heavier border. */}
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-500/[0.05] via-transparent to-accent-500/[0.04]"
				/>

				<div className="relative flex items-center gap-2.5 px-5 py-5">
					<LogoMark size={32} />
					<div className="leading-tight">
						<p className="text-sm font-semibold tracking-tight">Bahodir.dev</p>
						<p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
							admin
						</p>
					</div>
				</div>

				<nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
					{primary.map((item) => (
						<NavLink
							key={item.href}
							{...item}
							active={isActive(item.href)}
							animate={animate}
							onNavigate={close}
						/>
					))}

					<GroupLabel>Kontent</GroupLabel>

					{adminResources.map((resource) => (
						<NavLink
							key={resource.key}
							href={`/admin/${resource.key}`}
							label={resource.label}
							icon={resource.icon}
							active={isActive(`/admin/${resource.key}`)}
							animate={animate}
							onNavigate={close}
						/>
					))}
				</nav>

				<div className="relative border-t border-line px-3 py-4">
					<div className="flex items-center gap-2.5 px-3 pb-3">
						<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-gradient text-[11px] font-semibold uppercase text-white">
							{email.slice(0, 1)}
						</span>
						<p className="truncate text-xs text-ink-faint">{email}</p>
					</div>

					<div className="flex flex-col gap-0.5">
						<Link
							href="/"
							target="_blank"
							className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-white/[0.035] hover:text-ink"
						>
							<Icon name="ExternalLink" className="h-4 w-4" />
							Saytni ochish
						</Link>
						<button
							type="button"
							onClick={logout}
							disabled={loggingOut}
							className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-60"
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
