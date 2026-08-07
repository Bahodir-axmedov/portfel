"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Download, Menu, X } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Logo } from "@/components/ui/LogoMark"
import { Magnetic } from "@/components/ui/interactive"
import { buttonClass } from "@/components/ui/primitives"
import { EASE } from "@/components/ui/motion"
import { LocaleSwitcher } from "./LocaleSwitcher"
import { NAV_ITEMS, SECTION_IDS } from "@/constants"
import { useActiveSection, useLockBodyScroll, useScrolled } from "@/hooks"
import { cn } from "@/lib/utils"

const panelVariants = {
	hidden: { opacity: 0, y: -12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
	exit: { opacity: 0, y: -12, transition: { duration: 0.22, ease: EASE } },
}

const listVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
}

const rowVariants = {
	hidden: { opacity: 0, x: -10 },
	visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
}

export function Navbar({ resumeUrl }: { resumeUrl?: string | null }) {
	const t = useTranslations("nav")
	const scrolled = useScrolled(24)
	const active = useActiveSection(SECTION_IDS)
	const [open, setOpen] = useState(false)
	useLockBodyScroll(open)

	return (
		<header
			className={cn(
				"fixed inset-x-0 top-0 z-[60] transition-all duration-500 ease-premium",
				scrolled
					? "border-b border-line bg-base/70 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
					: "border-b border-transparent bg-transparent",
			)}
		>
			<nav
				/* The bar compresses on scroll. Only `height` animates, and the
				   header is a fixed layer, so nothing below it reflows. */
				className={cn(
					"container flex items-center justify-between gap-4 transition-[height] duration-500 ease-premium",
					scrolled ? "h-[64px]" : "h-[76px]",
				)}
				aria-label={t("menu")}
			>
				<Link href="/" aria-label={t("home")} className="shrink-0">
					<Logo />
				</Link>

				{/* ---------- Desktop links ---------- */}
				<ul className="hidden items-center gap-1 lg:flex">
					{NAV_ITEMS.map((item) => (
						<li key={item.id}>
							<a
								href={`#${item.id}`}
								className={cn(
									"group/nav relative inline-flex h-9 items-center rounded-full px-3.5 text-[13.5px] font-medium tracking-tight transition-colors duration-300",
									active === item.id
										? "text-ink"
										: "text-ink-muted hover:text-ink",
								)}
							>
								{/* Liquid pill: a single shared element that morphs
								    between links via `layoutId`. The spring (rather
								    than a fixed duration) is what gives it the fluid,
								    slightly overshooting travel. */}
								{active === item.id ? (
									<motion.span
										layoutId="nav-pill"
										className="nav-pill absolute inset-0 -z-10 rounded-full"
										transition={{
											type: "spring",
											stiffness: 380,
											damping: 32,
											mass: 0.9,
										}}
									/>
								) : null}
								{/* Hover halo for inactive links. */}
								<span
									aria-hidden
									className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-white/[0.06] opacity-0 transition-opacity duration-300 group-hover/nav:opacity-100"
								/>
								{t(item.key)}
							</a>
						</li>
					))}
				</ul>

				{/* ---------- Actions ---------- */}
				<div className="flex items-center gap-2">
					<LocaleSwitcher className="hidden sm:block" />

					{resumeUrl ? (
						<Magnetic className="hidden lg:inline-flex">
							<a
								href={resumeUrl}
								download
								className={buttonClass("primary", "sm")}
							>
								<Download className="h-3.5 w-3.5" strokeWidth={1.9} />
								{t("resume")}
							</a>
						</Magnetic>
					) : null}

					<button
						type="button"
						onClick={() => setOpen((value) => !value)}
						aria-label={open ? t("close") : t("menu")}
						aria-expanded={open}
						className="btn-sweep inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/[0.04] text-ink-muted transition-[color,transform] duration-200 hover:text-ink active:scale-90 lg:hidden"
					>
						{open ? (
							<X className="h-[18px] w-[18px]" strokeWidth={1.7} />
						) : (
							<Menu className="h-[18px] w-[18px]" strokeWidth={1.7} />
						)}
					</button>
				</div>
			</nav>

			{/* ---------- Mobile panel ---------- */}
			<AnimatePresence>
				{open ? (
					<motion.div
						key="mobile-menu"
						variants={panelVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						className="border-t border-line bg-base/95 backdrop-blur-2xl lg:hidden"
					>
						<motion.ul
							variants={listVariants}
							initial="hidden"
							animate="visible"
							className="container flex flex-col py-4"
						>
							{NAV_ITEMS.map((item) => (
								<motion.li key={item.id} variants={rowVariants}>
									<a
										href={`#${item.id}`}
										onClick={() => setOpen(false)}
										className={cn(
											"flex items-center justify-between border-b border-white/[0.05] py-3.5 text-[15px] tracking-tight transition-[color,transform] duration-200 active:scale-[0.98]",
											active === item.id ? "text-ink" : "text-ink-muted",
										)}
									>
										{t(item.key)}
										{active === item.id ? (
											<span className="h-1.5 w-1.5 rounded-full bg-brand-gradient" />
										) : null}
									</a>
								</motion.li>
							))}

							<motion.li
								variants={rowVariants}
								className="mt-5 flex items-center justify-between gap-3"
							>
								<LocaleSwitcher />
								{resumeUrl ? (
									<a
										href={resumeUrl}
										download
										className={buttonClass("primary", "sm", "flex-1")}
									>
										<Download className="h-3.5 w-3.5" strokeWidth={1.9} />
										{t("resume")}
									</a>
								) : null}
							</motion.li>
						</motion.ul>
					</motion.div>
				) : null}
			</AnimatePresence>
		</header>
	)
}
