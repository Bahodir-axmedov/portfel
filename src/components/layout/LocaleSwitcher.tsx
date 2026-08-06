"use client"

import { useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Check, ChevronDown, Globe } from "lucide-react"
import { usePathname, useRouter } from "@/i18n/navigation"
import { locales, localeLabels, localeShortLabels, type Locale } from "@/i18n/routing"
import { useClickOutside } from "@/hooks"
import { cn } from "@/lib/utils"

/**
 * UZ / RU / EN switcher. Keeps the visitor on the same page and only swaps the
 * locale segment, so switching language never sends anyone back to the home page.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
	const t = useTranslations("common")
	const active = useLocale() as Locale
	const pathname = usePathname()
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [pending, startTransition] = useTransition()
	const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open)

	const select = (locale: Locale) => {
		setOpen(false)
		if (locale === active) return
		startTransition(() => {
			router.replace(pathname, { locale })
		})
	}

	return (
		<div ref={ref} className={cn("relative", className)}>
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				aria-label={t("language")}
				aria-haspopup="listbox"
				aria-expanded={open}
				disabled={pending}
				className={cn(
					"inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white/[0.04] px-3.5 text-[13px] font-medium text-ink-muted backdrop-blur-xl transition-colors duration-200",
					"hover:border-line-strong hover:text-ink disabled:opacity-60",
				)}
			>
				<Globe className="h-4 w-4" strokeWidth={1.6} />
				<span>{localeShortLabels[active]}</span>
				<ChevronDown
					className={cn(
						"h-3.5 w-3.5 transition-transform duration-200",
						open && "rotate-180",
					)}
					strokeWidth={1.8}
				/>
			</button>

			{open ? (
				<ul
					role="listbox"
					className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[160px] overflow-hidden rounded-md border border-line bg-base-soft/95 p-1 shadow-card backdrop-blur-2xl"
				>
					{locales.map((locale) => (
						<li key={locale}>
							<button
								type="button"
								role="option"
								aria-selected={locale === active}
								onClick={() => select(locale)}
								className={cn(
									"flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-left text-[13.5px] transition-colors duration-150",
									locale === active
										? "bg-white/[0.06] text-ink"
										: "text-ink-muted hover:bg-white/[0.04] hover:text-ink",
								)}
							>
								{localeLabels[locale]}
								{locale === active ? (
									<Check className="h-3.5 w-3.5 text-brand-400" strokeWidth={2} />
								) : (
									<span className="text-[11px] text-ink-faint">
										{localeShortLabels[locale]}
									</span>
								)}
							</button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	)
}
