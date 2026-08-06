"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Icon } from "@/components/ui/Icon"
import { GlassCard, ProgressBar } from "@/components/ui/interactive"
import { EASE } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

export type SkillItem = {
	id: string
	name: string
	category: string
	level: number
	years?: number | null
	icon?: string | null
	description?: string
}

export type LanguageItem = {
	id: string
	name: string
	flag?: string | null
	level: string
	speaking: number
	writing: number
	reading: number
	listening: number
}

export type CategoryOption = { id: string; label: string }

const cardVariants = {
	hidden: { opacity: 0, y: 14 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
}

export function SkillsBoard({
	skills,
	languages,
	categories,
}: {
	skills: SkillItem[]
	languages: LanguageItem[]
	categories: CategoryOption[]
}) {
	const t = useTranslations("skills")
	const [filter, setFilter] = useState("all")

	const visible = useMemo(
		() =>
			filter === "all" ? skills : skills.filter((s) => s.category === filter),
		[filter, skills],
	)

	const languageMetrics: Array<{ key: string; label: string }> = [
		{ key: "speaking", label: t("speaking") },
		{ key: "writing", label: t("writing") },
		{ key: "reading", label: t("reading") },
		{ key: "listening", label: t("listening") },
	]

	return (
		<div className="flex flex-col gap-10">
			{/* ---------------- Filters ---------------- */}
			{categories.length > 1 ? (
				<div className="flex flex-wrap gap-2">
					<FilterChip
						active={filter === "all"}
						onClick={() => setFilter("all")}
						label={t("all")}
					/>
					{categories.map((category) => (
						<FilterChip
							key={category.id}
							active={filter === category.id}
							onClick={() => setFilter(category.id)}
							label={category.label}
						/>
					))}
				</div>
			) : null}

			{/* ---------------- Skill cards ---------------- */}
			<div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
				{visible.map((skill, index) => (
					<motion.div
						key={skill.id}
						layout
						variants={cardVariants}
						initial="hidden"
						animate="visible"
						transition={{ delay: Math.min(index * 0.035, 0.3) }}
					>
						<GlassCard className="group h-full p-5">
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-3">
									<span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-white/[0.03] text-brand-400 transition-colors duration-300 group-hover:border-brand-500/45">
										<Icon
											name={skill.icon}
											className="h-4 w-4"
											strokeWidth={1.7}
										/>
									</span>
									<div className="flex flex-col">
										<span className="text-[14px] font-medium tracking-tight text-ink">
											{skill.name}
										</span>
										{skill.years ? (
											<span className="text-[11.5px] text-ink-faint">
												{t("years", { years: skill.years })}
											</span>
										) : null}
									</div>
								</div>
								<span className="gradient-text text-[15px] font-semibold tabular-nums">
									{skill.level}%
								</span>
							</div>

							<ProgressBar
								value={skill.level}
								className="mt-4"
								delay={Math.min(index * 0.04, 0.35)}
							/>

							{skill.description ? (
								<p className="mt-3 text-[12.5px] leading-relaxed text-ink-faint">
									{skill.description}
								</p>
							) : null}
						</GlassCard>
					</motion.div>
				))}
			</div>

			{/* ---------------- Spoken languages ---------------- */}
			{languages.length > 0 ? (
				<div className="flex flex-col gap-5">
					<h3 className="text-[15px] font-semibold tracking-tight text-ink">
						{t("languagesTitle")}
					</h3>
					<div className="grid gap-3.5 md:grid-cols-3">
						{languages.map((language) => (
							<GlassCard key={language.id} className="p-5">
								<div className="flex items-center justify-between gap-3">
									<span className="inline-flex items-center gap-2 text-[14px] font-medium tracking-tight text-ink">
										{language.flag ? (
											<span aria-hidden className="text-[17px] leading-none">
												{language.flag}
											</span>
										) : null}
										{language.name}
									</span>
									<span className="rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] text-ink-faint">
										{t(`levels.${language.level}` as "levels.native")}
									</span>
								</div>

								<dl className="mt-4 flex flex-col gap-3">
									{languageMetrics.map((metric) => {
										const value = language[
											metric.key as keyof LanguageItem
										] as number
										return (
											<div key={metric.key} className="flex flex-col gap-1.5">
												<div className="flex items-center justify-between text-[11.5px] text-ink-faint">
													<dt>{metric.label}</dt>
													<dd className="tabular-nums">{value}%</dd>
												</div>
												<ProgressBar value={value} className="h-1" />
											</div>
										)
									})}
								</dl>
							</GlassCard>
						))}
					</div>
				</div>
			) : null}
		</div>
	)
}

function FilterChip({
	active,
	label,
	onClick,
}: {
	active: boolean
	label: string
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium tracking-tight transition-all duration-300",
				active
					? "border-brand-500/50 bg-brand-500/12 text-ink"
					: "border-line bg-white/[0.03] text-ink-muted hover:border-line-strong hover:text-ink",
			)}
		>
			{label}
		</button>
	)
}
