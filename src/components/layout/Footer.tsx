import { getTranslations } from "next-intl/server"
import { ArrowUp, Mail, MapPin, Phone } from "lucide-react"
import { Logo } from "@/components/ui/LogoMark"
import { Icon } from "@/components/ui/Icon"
import { Container, Divider } from "@/components/ui/primitives"
import { NAV_ITEMS } from "@/constants"
import { pick } from "@/lib/i18n-content"
import { telegramLink } from "@/lib/qr"
import type { Locale } from "@/i18n/routing"

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
							<span className="inline-flex items-center gap-1.5 text-[13px] text-ink-faint">
								<MapPin className="h-3.5 w-3.5" strokeWidth={1.6} />
								{location}
							</span>
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
						<ul className="flex flex-col gap-2.5">
							{socialLinks.map((social) => (
								<li key={social.id}>
									<a
										href={social.url}
										target="_blank"
										rel="noopener noreferrer"
										className="group inline-flex items-center gap-2 text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink"
									>
										<Icon
											name={social.icon}
											className="h-3.5 w-3.5 text-ink-faint transition-colors duration-200 group-hover:text-brand-400"
											strokeWidth={1.7}
										/>
										{social.label}
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
