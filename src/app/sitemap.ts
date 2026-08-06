import type { MetadataRoute } from "next"
import { getProjectSlugs } from "@/lib/queries"
import { absolute, localePath } from "@/lib/seo"
import { locales } from "@/i18n/routing"

/* Project pages come from the database, so the sitemap is generated per
   request rather than frozen into the build output. */
export const dynamic = "force-dynamic"

const STATIC_ROUTES = [
	{ path: "/", priority: 1, changeFrequency: "weekly" as const },
	{ path: "/projects", priority: 0.9, changeFrequency: "weekly" as const },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const projects = await getProjectSlugs()
	const now = new Date()
	const entries: MetadataRoute.Sitemap = []

	for (const route of STATIC_ROUTES) {
		for (const locale of locales) {
			entries.push({
				url: absolute(localePath(locale, route.path)),
				lastModified: now,
				changeFrequency: route.changeFrequency,
				priority: locale === "uz" ? route.priority : route.priority - 0.1,
			})
		}
	}

	for (const project of projects) {
		for (const locale of locales) {
			entries.push({
				url: absolute(localePath(locale, `/projects/${project.slug}`)),
				lastModified: project.updatedAt ?? now,
				changeFrequency: "monthly",
				priority: locale === "uz" ? 0.8 : 0.7,
			})
		}
	}

	return entries
}
