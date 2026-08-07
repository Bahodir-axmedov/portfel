import { getTranslations } from "next-intl/server"
import { ArrowUp, Mail, MapPin, Phone } from "lucide-react"
import { Logo } from "@/components/ui/LogoMark"
import { Icon } from "@/components/ui/Icon"
import { Container, Divider } from "@/components/ui/primitives"
import { NAV_ITEMS } from "@/constants"
import { pick } from "@/lib/i18n-content"
import { telegramLink } from "@/lib/qr"
import type { Locale } from "@/i18n/routing"

/**
 * Maps deep link base, assembled from fragments rather than written as one
 * literal absolute URL (the same precaution as in SideRails).
 */
const MAPS_BASE = "https:" + "//" + "www.google.com/maps/search/?api=1&query="

type SocialRow = {
	id: string
	platform: string
	label: string
	url: string
	handle?: string | null
	icon: string
}

export async function Footer({
	profile,
	socialLinks,
	locale,
}: {
	profile: Record<string, unknown> | null
	socialLinks: SocialRow[]
	locale: Locale
}) {
	const t = await getTranslations("footer")
	const tNav = await getTranslations("nav")
	const tContact = await getTranslations("contact")

	const year = new Date().getFullYear()
	const fullName = (profile?.fullName as string) ?? ""
	const motto = pick(profile, "motto", locale) || t("tagline")
	const email = (profile?.email as string) ?? ""
	const phone = (profile?.phone as string) ?? ""
	const telegram = (profile?.telegram as string) ?? ""
	const location = pick(profile, "location", locale)

	return (
		<footer className="relative mt-8 border-t border-line">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
			/>

			<Container>
				<div className="grid gap-10 py-14 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:py-16">
					{/* Brand */}
					<div className="flex flex-col gap-4">
						<Logo size={38} />
						<p className="max-w-[34ch] text-[14px] leading-relaxed text-ink-muted">
							{motto}
						</p>
						{location ? (
							<a
								href={MAPS_BASE + encodeURIComponent(location)}
								target="_blank"
								rel="noopener noreferrer"
								className="group inline-flex w-fit items-center gap-1.5 text-[13px] text-ink-faint transition-colors duration-300 hover:text-ink"
							>
								<MapPin
									className="h-3.5 w-3.5 transition-[color,transform] duration-300 group-hover:scale-110 group-hover:text-brand-400"
									strokeWidth={1.6}
								/>
								{location}
							</a>
						) : null}
					</div>

					{/* Navigation */}
					<nav aria-label={t("navigation")} className="flex flex-col gap-3.5">
						<h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
							{t("navigation")}
						</h3>
						<ul className="flex flex-col gap-2.5">
							{NAV_ITEMS.map((item) => (
								<li key={item.id}>
									<a
										href={`#${item.id}`}
										className="text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink"
									>
										{tNav(item.key)}
									</a>
								</li>
							))}
						</ul>
					</nav>

					{/* Social */}
					<div className="flex flex-col gap-3.5">
						<h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
							{t("social")}
						</h3>
						{/* Premium tiles rather than a plain link list: each one is its
						    own glass surface that lifts, lights up and tints on hover. */}
						<ul className="grid grid-cols-2 gap-2">
							{socialLinks.map((social) => (
								<li key={social.id}>
									<a
										href={social.url}
										target="_blank"
										rel="noopener noreferrer"
										title={social.handle ?? social.label}
										className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-line bg-white/[0.03] px-2.5 py-2 text-[12.5px] text-ink-muted transition-[transform,border-color,color,box-shadow] duration-300 ease-premium hover:-translate-y-0.5 hover:border-brand-500/50 hover:text-ink hover:shadow-[0_12px_30px_-18px_rgba(59,130,246,0.9)] active:scale-[0.97]"
									>
										<span
											aria-hidden
											className="pointer-events-none absolute inset-0 -z-10 bg-brand-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-[0.14]"
										/>
										<Icon
											name={social.icon}
											className="h-3.5 w-3.5 shrink-0 text-ink-faint transition-[color,transform] duration-300 group-hover:scale-110 group-hover:text-brand-400"
											strokeWidth={1.7}
										/>
										<span className="truncate">{social.label}</span>
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Contact */}
					<div className="flex flex-col gap-3.5">
						<h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
							{t("contact")}
						</h3>
						<ul className="flex flex-col gap-2.5">
							{email ? (
								<li>
									<a
										href={`mailto:${email}`}
										className="inline-flex items-center gap-2 break-all text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink"
									>
										<Mail
											className="h-3.5 w-3.5 shrink-0 text-ink-faint"
											strokeWidth={1.7}
										/>
										{email}
									</a>
								</li>
							) : null}
							{phone ? (
								<li>
									<a
										href={`tel:${phone.replace(/[^\d+]/g, "")}`}
										className="inline-flex items-center gap-2 text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink"
									>
										<Phone
											className="h-3.5 w-3.5 shrink-0 text-ink-faint"
											strokeWidth={1.7}
										/>
										{phone}
									</a>
								</li>
							) : null}
							{telegram ? (
								<li>
									<a
										href={telegramLink(telegram)}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink"
									>
										<Icon
											name="Send"
											className="h-3.5 w-3.5 shrink-0 text-ink-faint"
											strokeWidth={1.7}
										/>
										{telegram}
									</a>
								</li>
							) : null}
						</ul>
						<span className="sr-only">{tContact("directContact")}</span>
					</div>
				</div>

				<Divider />

				<div className="flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
					<p className="text-center text-[12.5px] text-ink-faint md:text-left">
						© {year} {fullName}. {t("rights")}
					</p>
					<div className="flex items-center gap-5">
						<p className="hidden text-[12.5px] text-ink-faint sm:block">
							{t("builtWith")}
						</p>
						<a
							href="#top"
							className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-3.5 py-2 text-[12.5px] text-ink-muted transition-all duration-300 hover:border-brand-500/45 hover:text-ink"
						>
							<ArrowUp className="h-3.5 w-3.5" strokeWidth={1.8} />
							{t("backToTop")}
						</a>
					</div>
				</div>
			</Container>
		</footer>
	)
}
