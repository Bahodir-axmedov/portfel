"use client"

import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Mail, MapPin, Phone, Send } from "lucide-react"
import { Icon } from "@/components/ui/Icon"
import { EASE } from "@/components/ui/motion"
import { NAV_ITEMS, SECTION_IDS } from "@/constants"
import { useActiveSection } from "@/hooks"
import { cn } from "@/lib/utils"

/**
 * Fixed navigation furniture that lives outside the document flow:
 *
 *  - `SocialRail`   desktop-only vertical dock on the left edge
 *  - `ScrollHint`   desktop-only "scroll" cue on the right edge
 *  - `MobileDock`   phone-only bottom navigation bar
 *
 * Why one file rather than three: all three are fixed-position chrome that
 * share the same z-index budget and the same rule about never being rendered
 * on the admin routes. Keeping them together makes that contract auditable in
 * one place instead of three.
 *
 * Interaction notes
 * -----------------
 * Every tappable element carries `btn-sweep`, which is the hook the delegated
 * ripple listener in SiteChrome looks for via `closest(".btn-sweep")`. That is
 * why there is no per-button ripple state here: one document listener serves
 * the whole page.
 *
 * The hover glow is `.rail-item::after` — a pseudo-element scaled with
 * `transform`. It is deliberately not a `width`/`height` or `box-shadow`
 * transition, because those repaint on a fixed layer every frame.
 */

/** Shape shared with the Footer and Contact section. */
export type RailSocial = {
	id: string
	platform: string
	label: string
	url: string
	icon: string
}

/**
 * A direct-contact entry rendered below the socials. Email and phone are not
 * social links in the database, so they are passed separately rather than
 * being faked into the SocialLink table.
 */
type DirectContact = {
	kind: "email" | "phone" | "location"
	href: string
	label: string
	/** Location points at Google Maps, so it has to leave the tab. */
	external?: boolean
}

/**
 * Maps deep link base. Built from fragments on purpose: a literal absolute URL
 * inside source has been rewritten by tooling before, and a broken href here
 * would ship silently because nothing type-checks a string.
 */
const MAPS_BASE = "https:" + "//" + "www.google.com/maps/search/?api=1&query="

function buildDirectContacts(
	email: string,
	phone: string,
	location: string,
	emailLabel: string,
	phoneLabel: string,
): DirectContact[] {
	const entries: DirectContact[] = []
	if (email) {
		entries.push({ kind: "email", href: `mailto:${email}`, label: emailLabel })
	}
	if (phone) {
		// tel: URIs must not contain spaces or punctuation beyond a leading +.
		entries.push({
			kind: "phone",
			href: `tel:${phone.replace(/[^\d+]/g, "")}`,
			label: phoneLabel,
		})
	}
	if (location) {
		entries.push({
			kind: "location",
			href: MAPS_BASE + encodeURIComponent(location),
			label: location,
			external: true,
		})
	}
	return entries
}

const RAIL_ITEM_CLASS =
	"rail-item btn-sweep group relative grid h-10 w-10 place-items-center rounded-full border border-line text-ink-faint transition-[color,border-color,transform] duration-300 ease-premium hover:-translate-y-0.5 hover:border-brand-500/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"

/** Tooltip that slides out of the rail on hover. Pure CSS, no JS. */
function RailTooltip({ children }: { children: string }) {
	return (
		<span className="pointer-events-none absolute left-[calc(100%+12px)] whitespace-nowrap rounded-md border border-line bg-base-raised/95 px-2.5 py-1 text-[11.5px] font-medium text-ink opacity-0 shadow-card backdrop-blur-md transition-all duration-300 ease-premium group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1">
			{children}
		</span>
	)
}

/**
 * Left-edge floating social panel. Hidden below `xl` because between `lg` and
 * `xl` the rail would overlap the container gutter and sit on top of body
 * copy — a rail that covers content is worse than no rail.
 */
export function SocialRail({
	socials,
	email,
	phone,
	location,
}: {
	socials: RailSocial[]
	email: string
	phone: string
	location: string
}) {
	const t = useTranslations("contact")
	const direct = buildDirectContacts(
		email,
		phone,
		location,
		t("email"),
		t("phone"),
	)

	if (socials.length === 0 && direct.length === 0) return null

	return (
		<motion.aside
			initial={{ opacity: 0, x: -24 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.7, delay: 0.9, ease: EASE }}
			className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
			aria-label={t("directContact")}
		>
			<div className="neo-surface flex flex-col items-center gap-2 rounded-full border border-line px-2 py-3 backdrop-blur-xl">
				{socials.map((social) => (
					<a
						key={social.id}
						href={social.url}
						target="_blank"
						rel="noopener noreferrer"
						className={RAIL_ITEM_CLASS}
					>
						<Icon name={social.icon} className="h-4 w-4" strokeWidth={1.7} />
						<RailTooltip>{social.label}</RailTooltip>
						<span className="sr-only">{social.label}</span>
					</a>
				))}

				{direct.length > 0 && socials.length > 0 ? (
					<span
						aria-hidden
						className="my-1 h-px w-5 bg-gradient-to-r from-transparent via-line-strong to-transparent"
					/>
				) : null}

				{direct.map((entry) => (
					<a
						key={entry.kind}
						href={entry.href}
						className={RAIL_ITEM_CLASS}
						{...(entry.external
							? { target: "_blank", rel: "noopener noreferrer" }
							: {})}
					>
						{entry.kind === "email" ? (
							<Mail className="h-4 w-4" strokeWidth={1.7} />
						) : entry.kind === "phone" ? (
							<Phone className="h-4 w-4" strokeWidth={1.7} />
						) : (
							<MapPin className="h-4 w-4" strokeWidth={1.7} />
						)}
						<RailTooltip>{entry.label}</RailTooltip>
						<span className="sr-only">{entry.label}</span>
					</a>
				))}
			</div>

			{/* Tail line anchoring the dock to the viewport edge. */}
			<span
				aria-hidden
				className="mx-auto mt-3 block h-16 w-px bg-gradient-to-b from-line-strong to-transparent"
			/>
		</motion.aside>
	)
}

/**
 * Right-edge scroll cue. Rotated 90deg so the word runs vertically, with a
 * travelling highlight underneath. Disappears once the visitor has left the
 * hero, because a "scroll" prompt shown mid-page is noise.
 */
export function ScrollHint() {
	const t = useTranslations("common")
	const active = useActiveSection(SECTION_IDS)
	const atTop = active === SECTION_IDS[0] || active === ""

	return (
		<motion.div
			aria-hidden
			initial={{ opacity: 0 }}
			animate={{ opacity: atTop ? 1 : 0 }}
			transition={{ duration: 0.5, ease: EASE }}
			className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
		>
			<div className="flex flex-col items-center gap-4">
				<span className="rotate-90 text-[11px] font-medium uppercase tracking-[0.32em] text-ink-faint">
					{t("scroll")}
				</span>
				<span className="relative mt-6 block h-20 w-px overflow-hidden bg-line-strong">
					<motion.span
						className="absolute inset-x-0 top-0 block h-8 bg-gradient-to-b from-transparent via-brand-400 to-transparent"
						animate={{ y: [-32, 80] }}
						transition={{
							duration: 2.1,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					/>
				</span>
			</div>
		</motion.div>
	)
}

/**
 * Phone-only bottom navigation.
 *
 * `pb-[env(safe-area-inset-bottom)]` is not optional: without it the dock is
 * partially hidden behind the iOS home indicator, which is exactly the detail
 * that makes a mobile build feel unfinished.
 *
 * The active indicator uses a shared `layoutId`, so Framer Motion animates the
 * pill between tabs instead of cross-fading two separate elements.
 */
export function MobileDock() {
	const tNav = useTranslations("nav")
	const active = useActiveSection(SECTION_IDS)
	// The floating CTA is noise while the visitor is still inside the hero,
	// which already carries two large buttons. It appears after they scroll.
	const atTop = active === SECTION_IDS[0] || active === ""

	return (
		<>
			{/* Phone-only floating call-to-action, parked above the dock. */}
			<motion.a
				href="#contact"
				aria-label={tNav("contact")}
				initial={false}
				animate={{
					opacity: atTop ? 0 : 1,
					scale: atTop ? 0.7 : 1,
					pointerEvents: atTop ? "none" : "auto",
				}}
				transition={{ duration: 0.35, ease: EASE }}
				className="btn-sweep fixed bottom-[92px] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-white shadow-[0_14px_40px_-10px_rgba(59,130,246,0.75)] transition-transform duration-200 active:scale-95 lg:hidden"
			>
				<span
					aria-hidden
					className="absolute inset-0 animate-ping rounded-full bg-brand-500/35"
				/>
				<Send className="relative h-5 w-5" strokeWidth={1.8} />
			</motion.a>

			<nav
				aria-label={tNav("about")}
				className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
			>
				<div className="neo-surface mx-3 mb-3 flex items-center justify-between gap-0.5 rounded-2xl border border-line px-1.5 py-1.5 backdrop-blur-xl">
					{NAV_ITEMS.map((item) => {
						const isActive = active === item.id
						return (
							<a
								key={item.id}
								href={`#${item.id}`}
								aria-current={isActive ? "true" : undefined}
								className={cn(
									// min-h-11 keeps every target at the 44px touch minimum.
									"btn-sweep relative flex min-h-11 flex-1 items-center justify-center rounded-xl px-1 py-2 text-[10.5px] font-medium capitalize transition-colors duration-300",
									isActive ? "text-ink" : "text-ink-faint",
								)}
							>
								{isActive ? (
									<motion.span
										layoutId="mobile-dock-pill"
										className="nav-pill absolute inset-0 -z-10 rounded-xl"
										transition={{
											type: "spring",
											stiffness: 380,
											damping: 32,
											mass: 0.9,
										}}
									/>
								) : null}
								<span className="truncate">{tNav(item.key)}</span>
							</a>
						)
					})}
				</div>
			</nav>
		</>
	)
}
