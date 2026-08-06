import { getTranslations } from "next-intl/server"
import { Reveal } from "@/components/ui/motion"
import { Container, Section, SectionHeading } from "@/components/ui/primitives"
import { pick } from "@/lib/i18n-content"
import type { Locale } from "@/i18n/routing"
import {
	SkillsBoard,
	type CategoryOption,
	type LanguageItem,
	type SkillItem,
} from "./SkillsBoard"

/**
 * Category labels are technical terms and stay identical in UZ / RU / EN,
 * so they live here instead of the message catalogues.
 */
const CATEGORY_LABELS: Record<string, string> = {
	frontend: "Frontend",
	backend: "Backend",
	fullstack: "Full Stack",
	database: "Database",
	devops: "DevOps",
	data: "Data & BI",
	network: "Network",
	fundamentals: "Fundamentals",
	other: "Other",
}

type SkillRow = Record<string, unknown> & {
	id: string
	name: string
	category: string
	level: number
	years?: number | null
	icon?: string | null
}

type LanguageRow = Record<string, unknown> & {
	id: string
	flag?: string | null
	level: string
	speaking: number
	writing: number
	reading: number
	listening: number
}

export async function Skills({
	skills,
	languages,
	locale,
}: {
	skills: SkillRow[]
	languages: LanguageRow[]
	locale: Locale
}) {
	const t = await getTranslations("skills")
	if (skills.length === 0 && languages.length === 0) return null

	const items: SkillItem[] = skills.map((skill) => ({
		id: skill.id,
		name: skill.name,
		category: skill.category,
		level: skill.level,
		years: skill.years ?? null,
		icon: skill.icon ?? null,
		description: pick(skill, "description", locale),
	}))

	const languageItems: LanguageItem[] = languages.map((language) => ({
		id: language.id,
		name: pick(language, "name", locale),
		flag: language.flag ?? null,
		level: language.level,
		speaking: language.speaking,
		writing: language.writing,
		reading: language.reading,
		listening: language.listening,
	}))

	// Only offer filters for categories that actually have skills.
	const used = Array.from(new Set(items.map((item) => item.category)))
	const categories: CategoryOption[] = used.map((id) => ({
		id,
		label: CATEGORY_LABELS[id] ?? id,
	}))

	return (
		<Section id="skills">
			<Container>
				<Reveal>
					<SectionHeading
						eyebrow={t("eyebrow")}
						title={t("title")}
						description={t("subtitle")}
					/>
				</Reveal>

				<div className="mt-12">
					<SkillsBoard
						skills={items}
						languages={languageItems}
						categories={categories}
					/>
				</div>
			</Container>
		</Section>
	)
}
