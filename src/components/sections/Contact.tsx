import { getTranslations } from "next-intl/server"
import {
	Clock,
	Download,
	ExternalLink,
	Mail,
	MapPin,
	Phone,
	Send,
} from "lucide-react"
import { Icon } from "@/components/ui/Icon"
import { CopyButton } from "@/components/ui/CopyButton"
import { GlassCard } from "@/components/ui/interactive"
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/motion"
import {
	buttonClass,
	Container,
	Section,
	SectionHeading,
} from "@/components/ui/primitives"
import { pick } from "@/lib/i18n-content"
import { normalizeQrValue, qrSvg, telegramLink } from "@/lib/qr"
import { SITE_URL } from "@/lib/seo"
import type { Locale } from "@/i18n/routing"
import { ContactForm } from "./ContactForm"

type SocialRow = {
	id: string
	platform: string
	label: string
	url: string
	handle?: string | null
	icon: string
}

type QrRow = Record<string, unknown> & {
	id: string
	key: string
	value: string
	icon?: string | null
}

export async function Contact({
	profile,
	socialLinks,
	qrCodes,
	locale,
}: {
	profile: Record<string, unknown> | null
	socialLinks: SocialRow[]
	qrCodes: QrRow[]
	locale: Locale
}) {
	const t = await getTranslations("contact")

	const email = String(profile?.email ?? "")
	const phone = String(profile?.phone ?? "")
	const telegram = String(profile?.telegram ?? "")
	const timezone = String(profile?.timezone ?? "")
	const mapUrl = profile?.mapUrl ? String(profile.mapUrl) : ""
	const location = pick(profile, "location", locale)

	/* QR codes are rendered server-side as inline SVG: no client JS, no
	   external service, and they update the moment a value changes in admin. */
	const tiles = await Promise.all(
		qrCodes.map(async (item) => {
			const target = normalizeQrValue(
				String(item.key),
				String(item.value ?? ""),
				SITE_URL,
			)
			return {
				id: String(item.id),
				label: pick(item, "label", locale),
				icon: String(item.icon ?? "QrCode"),
				target,
				svg: await qrSvg(target, { size: 220, margin: 1 }),
			}
		}),
	)

	const details = [
		{
			id: "email",
			label: t("email"),
			value: email,
			href: email ? `mailto:${email}` : "",
			icon: <Mail className="h-4 w-4" strokeWidth={1.8} />,
		},
		{
			id: "phone",
			label: t("phone"),
			value: phone,
			href: phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "",
			icon: <Phone className="h-4 w-4" strokeWidth={1.8} />,
		},
		{
			id: "telegram",
			label: t("telegram"),
			value: telegram,
			href: telegram ? telegramLink(telegram) : "",
			icon: <Send className="h-4 w-4" strokeWidth={1.8} />,
		},
		{
			id: "location",
			label: t("location"),
			value: location,
			href: mapUrl,
			icon: <MapPin className="h-4 w-4" strokeWidth={1.8} />,
		},
		{
			id: "timezone",
			label: t("timezone"),
			value: timezone,
			href: "",
			icon: <Clock className="h-4 w-4" strokeWidth={1.8} />,
		},
	].filter((row) => row.value)

	return (
		<Section id="contact">
			<Container>
				<Reveal>
					<SectionHeading
						eyebrow={t("eyebrow")}
						title={t("title")}
						description={t("subtitle")}
					/>
				</Reveal>

				<div className="mt-11 grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
					<Reveal className="h-full">
						<GlassCard className="flex h-full flex-col p-5 md:p-6">
							<h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
								{t("directContact")}
							</h3>

							<ul className="mt-5 space-y-2.5">
								{details.map((row) => (
									<li
										key={row.id}
										className="flex items-center gap-3 rounded-md border border-line/70 bg-glass px-3.5 py-3 transition duration-200 hover:border-line-strong"
									>
										<span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-gradient-soft text-brand-400">
											{row.icon}
										</span>

										<div className="min-w-0 flex-1">
											<p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">
												{row.label}
											</p>
											{row.href ? (
												<a
													href={row.href}
													target={
														row.href.startsWith("http") ? "_blank" : undefined
													}
													rel={
														row.href.startsWith("http")
															? "noreferrer"
															: undefined
													}
													className="block truncate text-sm font-medium text-ink transition hover:text-brand-400"
												>
													{row.value}
												</a>
											) : (
												<p className="truncate text-sm font-medium text-ink">
													{row.value}
												</p>
											)}
										</div>

										<CopyButton
											value={row.value}
											labelCopy={t("copy")}
											labelCopied={t("copied")}
										/>
									</li>
								))}
							</ul>

							{socialLinks.length > 0 ? (
								<div className="mt-5 flex flex-wrap gap-2">
									{socialLinks.map((social) => (
										<a
											key={social.id}
											href={social.url}
											target="_blank"
											rel="noreferrer"
											aria-label={social.label}
											title={social.label}
											className="grid h-10 w-10 place-items-center rounded-md border border-line text-ink-muted transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:text-ink"
										>
											<Icon
												name={social.icon}
												className="h-4 w-4"
												strokeWidth={1.8}
											/>
										</a>
									))}
								</div>
							) : null}

							<div className="mt-auto flex flex-wrap gap-2.5 pt-6">
								<a
									href="/api/vcard"
									className={buttonClass("secondary", "sm")}
									download
								>
									<Download className="h-4 w-4" strokeWidth={1.8} />
									{t("saveContact")}
								</a>
								{mapUrl ? (
									<a
										href={mapUrl}
										target="_blank"
										rel="noreferrer"
										className={buttonClass("ghost", "sm")}
									>
										<MapPin className="h-4 w-4" strokeWidth={1.8} />
										Google Maps
										<ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
									</a>
								) : null}
							</div>
						</GlassCard>
					</Reveal>

					<Reveal delay={0.08} className="h-full">
						<ContactForm />
					</Reveal>
				</div>

				{tiles.length > 0 ? (
					<div className="mt-14">
						<Reveal>
							<div className="text-center">
								<h3 className="text-display-md font-semibold text-ink">
									{t("qrTitle")}
								</h3>
								<p className="mx-auto mt-2.5 max-w-[52ch] text-[15px] leading-relaxed text-ink-muted">
									{t("qrSubtitle")}
								</p>
							</div>
						</Reveal>

						<StaggerGroup
							step={0.05}
							className="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5"
						>
							{tiles.map((tile) => (
								<StaggerItem key={tile.id}>
									<a
										href={tile.target}
										target="_blank"
										rel="noreferrer"
										className="group flex h-full flex-col items-center gap-3 rounded-lg border border-line bg-glass p-3.5 transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-glow"
									>
										<span
											className="w-full overflow-hidden rounded-md bg-white p-2 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
											dangerouslySetInnerHTML={{ __html: tile.svg }}
										/>
										<span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted transition group-hover:text-ink">
											<Icon
												name={tile.icon}
												className="h-3.5 w-3.5"
												strokeWidth={1.8}
											/>
											{tile.label}
										</span>
									</a>
								</StaggerItem>
							))}
						</StaggerGroup>
					</div>
				) : null}
			</Container>
		</Section>
	)
}
