"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { ArrowDown, ArrowRight, Download, MapPin } from "lucide-react"
import { Icon } from "@/components/ui/Icon"
import { Magnetic, TypingText } from "@/components/ui/interactive"
import { buttonClass, StatusDot } from "@/components/ui/primitives"
import { EASE } from "@/components/ui/motion"
import { useHeavyAnimationEnabled, useMousePosition } from "@/hooks"

export type HeroSocial = {
	platform: string
	label: string
	url: string
	icon: string
}

export type HeroProps = {
	fullName: string
	headline: string
	subheadline: string
	roles: string[]
	photo: string
	location: string
	openToWork: boolean
	resumeUrl?: string | null
	socials: HeroSocial[]
	highlights: Array<{ label: string; value: string }>
}

const containerVariants = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.09, delayChildren: 0.12 },
	},
}

const itemVariants = {
	hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
	visible: {
		opacity: 1,
		y: 0,
		filter: "blur(0px)",
		transition: { duration: 0.75, ease: EASE },
	},
}

const photoVariants = {
	hidden: { opacity: 0, scale: 0.94, y: 24 },
	visible: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: { duration: 1, ease: EASE, delay: 0.25 },
	},
}

export function Hero({
	fullName,
	headline,
	subheadline,
	roles,
	photo,
	location,
	openToWork,
	resumeUrl,
	socials,
	highlights,
}: HeroProps) {
	const t = useTranslations("hero")
	const parallaxEnabled = useHeavyAnimationEnabled()
	const pointer = useMousePosition(parallaxEnabled)

	// Mouse parallax: the photo and its glow drift in opposite directions.
	const photoShift = {
		transform: `translate3d(${pointer.x * -18}px, ${pointer.y * -14}px, 0)`,
	}
	const glowShift = {
		transform: `translate3d(${pointer.x * 26}px, ${pointer.y * 20}px, 0)`,
	}

	return (
		<section
			id="top"
			className="relative isolate overflow-hidden pb-[76px] pt-[120px] md:pb-[104px] md:pt-[148px]"
		>
			<div className="container">
				<div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16">
					{/* ---------------- Left: copy ---------------- */}
					<motion.div
						variants={containerVariants}
						initial="hidden"
						animate="visible"
						className="flex flex-col items-start gap-7"
					>
						{openToWork ? (
							<motion.div variants={itemVariants}>
								<span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-white/[0.045] px-4 py-2 text-[12.5px] font-medium tracking-tight text-ink-muted backdrop-blur-xl">
									<StatusDot />
									{t("badge")}
								</span>
							</motion.div>
						) : null}

						<motion.h1
							variants={itemVariants}
							className="max-w-[21ch] text-display-xl font-semibold leading-[1.08] tracking-[-0.033em] text-ink"
						>
							{headline}
						</motion.h1>

						<motion.div
							variants={itemVariants}
							className="flex min-h-[34px] items-center text-[17px] font-medium tracking-tight text-ink-muted md:text-[19px]"
						>
							<TypingText words={roles} />
						</motion.div>

						<motion.p
							variants={itemVariants}
							className="max-w-[56ch] text-[15.5px] leading-relaxed text-ink-muted"
						>
							{subheadline}
						</motion.p>

						<motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
							<Magnetic>
								<a href="#projects" className={buttonClass("primary", "lg")}>
									{t("ctaPrimary")}
									<ArrowRight className="h-4 w-4" strokeWidth={1.9} />
								</a>
							</Magnetic>
							<Magnetic>
								<a href="#contact" className={buttonClass("secondary", "lg")}>
									{t("ctaSecondary")}
								</a>
							</Magnetic>
							{resumeUrl ? (
								<a
									href={resumeUrl}
									download
									className={buttonClass("ghost", "lg")}
								>
									<Download className="h-4 w-4" strokeWidth={1.8} />
									{t("resume")}
								</a>
							) : null}
						</motion.div>

						<motion.div
							variants={itemVariants}
							className="flex flex-wrap items-center gap-x-5 gap-y-3"
						>
							<span className="inline-flex items-center gap-1.5 text-[13px] text-ink-faint">
								<MapPin className="h-3.5 w-3.5" strokeWidth={1.7} />
								{location}
							</span>
							<span aria-hidden className="hidden h-4 w-px bg-white/10 sm:block" />
							<ul className="flex flex-wrap items-center gap-2">
								{socials.map((social) => (
									<li key={social.platform}>
										<a
											href={social.url}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={social.label}
											title={social.label}
											className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/[0.03] text-ink-muted transition-all duration-300 hover:border-brand-500/50 hover:bg-brand-500/10 hover:text-ink"
										>
											<Icon
												name={social.icon}
												className="h-[15px] w-[15px] transition-transform duration-300 group-hover:scale-110"
												strokeWidth={1.7}
											/>
										</a>
									</li>
								))}
							</ul>
						</motion.div>
					</motion.div>

					{/* ---------------- Right: portrait ---------------- */}
					<motion.div
						variants={photoVariants}
						initial="hidden"
						animate="visible"
						className="relative mx-auto w-full max-w-[420px] lg:mx-0"
					>
						<div
							aria-hidden
							className="pointer-events-none absolute inset-6 rounded-[36px] bg-brand-gradient opacity-[0.18] blur-[70px]"
							style={glowShift}
						/>

						<div
							className="relative overflow-hidden rounded-xl border border-line bg-white/[0.035] p-2.5 backdrop-blur-xl transition-transform duration-300 ease-premium"
							style={photoShift}
						>
							<span
								aria-hidden
								className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
							/>
							<div className="relative aspect-[4/5] w-full overflow-hidden rounded-[22px]">
								<Image
									src={photo}
									alt={fullName}
									fill
									priority
									sizes="(max-width: 1024px) 84vw, 420px"
									className="object-cover object-top"
								/>
								<div
									aria-hidden
									className="absolute inset-0 bg-gradient-to-t from-base via-base/10 to-transparent"
								/>
							</div>

							{highlights.length > 0 ? (
								<div className="grid grid-cols-3 gap-2 px-1 pb-1 pt-3">
									{highlights.map((item) => (
										<div key={item.label} className="text-center">
											<p className="gradient-text text-[19px] font-semibold tracking-tight">
												{item.value}
											</p>
											<p className="mt-0.5 text-[11px] leading-tight text-ink-faint">
												{item.label}
											</p>
										</div>
									))}
								</div>
							) : null}
						</div>
					</motion.div>
				</div>

				{/* ---------------- Scroll indicator ---------------- */}
				<motion.a
					href="#about"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1.1, duration: 0.6, ease: EASE }}
					className="mt-16 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em] text-ink-faint transition-colors duration-300 hover:text-ink-muted md:mt-20"
				>
					<span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line">
						<ArrowDown className="h-3.5 w-3.5 animate-float" strokeWidth={1.7} />
					</span>
					{t("scroll")}
				</motion.a>
			</div>
		</section>
	)
}
