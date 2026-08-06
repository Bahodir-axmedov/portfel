import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Projects } from "@/components/sections/Projects"
import { pick } from "@/lib/i18n-content"
import { getProjects, getSeoForRoute } from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"
import { parseArray } from "@/lib/utils"
import { isLocale, type Locale } from "@/i18n/routing"

export const dynamic = "force-dynamic"

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale: raw } = await params
	const locale: Locale = isLocale(raw) ? raw : "uz"

	const [seo, t] = await Promise.all([
		getSeoForRoute("/projects"),
		getTranslations({ locale, namespace: "projects" }),
	])

	return buildMetadata({
		locale,
		path: "/projects",
		title: pick(seo, "title", locale) || t("title"),
		description: pick(seo, "description", locale) || t("subtitle"),
		keywords: parseArray(seo?.keywords),
		image: seo?.ogImage ?? null,
		noIndex: seo?.noIndex ?? false,
	})
}

export default async function ProjectsPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale: raw } = await params
	const locale: Locale = isLocale(raw) ? raw : "uz"

	const projects = await getProjects()

	return (
		<div className="pt-[var(--nav-height)]">
			<Projects projects={projects} locale={locale} />
		</div>
	)
}
