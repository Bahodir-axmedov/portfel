import { cache } from "react"
import { prisma } from "./prisma"
import { yearsSince } from "./utils"

/**
 * Server-side data access layer.
 *
 * Every read used by the public site lives here so pages stay declarative and
 * the database is queried at most once per request (React `cache`).
 */

export const getProfile = cache(async () => {
	return prisma.profile.findUnique({ where: { id: "main" } })
})

export const getSkills = cache(async () => {
	return prisma.skill.findMany({
		where: { published: true },
		orderBy: [{ order: "asc" }, { level: "desc" }],
	})
})

export const getLanguages = cache(async () => {
	return prisma.language.findMany({
		where: { published: true },
		orderBy: { order: "asc" },
	})
})

export const getServices = cache(async () => {
	return prisma.service.findMany({
		where: { published: true },
		orderBy: { order: "asc" },
	})
})

export const getExperiences = cache(async () => {
	return prisma.experience.findMany({
		where: { published: true },
		orderBy: [{ current: "desc" }, { startDate: "desc" }],
	})
})

export const getEducation = cache(async () => {
	return prisma.education.findMany({
		where: { published: true },
		orderBy: { startYear: "desc" },
	})
})

export const getCertificates = cache(async () => {
	return prisma.certificate.findMany({
		where: { published: true },
		orderBy: [{ order: "asc" }, { issueDate: "desc" }],
	})
})

export const getAchievements = cache(async () => {
	return prisma.achievement.findMany({
		where: { published: true },
		orderBy: [{ order: "asc" }, { date: "desc" }],
	})
})

export const getTimeline = cache(async () => {
	return prisma.timelineEvent.findMany({
		where: { published: true },
		orderBy: [{ year: "asc" }, { order: "asc" }],
	})
})

export const getProjects = cache(async () => {
	return prisma.project.findMany({
		where: { published: true },
		include: {
			technologies: { orderBy: { order: "asc" } },
			images: { orderBy: { order: "asc" } },
		},
		orderBy: [{ pinned: "desc" }, { order: "asc" }, { yearStart: "desc" }],
	})
})

export const getFeaturedProjects = cache(async (limit = 3) => {
	return prisma.project.findMany({
		where: { published: true, featured: true },
		include: {
			technologies: { orderBy: { order: "asc" } },
			images: { orderBy: { order: "asc" } },
		},
		orderBy: [{ pinned: "desc" }, { order: "asc" }],
		take: limit,
	})
})

export const getProjectBySlug = cache(async (slug: string) => {
	return prisma.project.findFirst({
		where: { slug, published: true },
		include: {
			technologies: { orderBy: { order: "asc" } },
			images: { orderBy: { order: "asc" } },
		},
	})
})

export const getProjectSlugs = cache(async () => {
	const rows = await prisma.project.findMany({
		where: { published: true },
		select: { slug: true, updatedAt: true },
	})
	return rows
})

export const getGallery = cache(async () => {
	return prisma.galleryItem.findMany({
		where: { published: true },
		orderBy: { order: "asc" },
	})
})

export const getTestimonials = cache(async () => {
	return prisma.testimonial.findMany({
		where: { published: true },
		orderBy: { order: "asc" },
	})
})

export const getSocialLinks = cache(async () => {
	return prisma.socialLink.findMany({
		where: { published: true },
		orderBy: { order: "asc" },
	})
})

export const getQrCodes = cache(async () => {
	return prisma.qrCode.findMany({
		where: { published: true },
		orderBy: { order: "asc" },
	})
})

export const getTechnologies = cache(async () => {
	return prisma.technology.findMany({ orderBy: { order: "asc" } })
})

/** Stats with `computed` expressions resolved (e.g. "yearsSince:2020"). */
export const getStats = cache(async () => {
	const stats = await prisma.stat.findMany({
		where: { published: true },
		orderBy: { order: "asc" },
	})

	return stats.map((stat) => {
		if (stat.computed?.startsWith("yearsSince:")) {
			const year = Number(stat.computed.split(":")[1])
			if (!Number.isNaN(year)) return { ...stat, value: yearsSince(year) }
		}
		return stat
	})
})

export const getSettings = cache(async () => {
	const rows = await prisma.setting.findMany()
	const map: Record<string, string> = {}
	for (const row of rows) map[row.key] = row.value

	return {
		map,
		get: (key: string, fallback = "") => map[key] ?? fallback,
		bool: (key: string, fallback = false) =>
			map[key] === undefined ? fallback : map[key] === "true",
		number: (key: string, fallback = 0) => {
			const value = Number(map[key])
			return Number.isNaN(value) ? fallback : value
		},
	}
})

export const getSeoForRoute = cache(async (route: string) => {
	return prisma.seoSetting.findUnique({ where: { route } })
})

export const getPosts = cache(async () => {
	return prisma.post.findMany({
		where: { published: true },
		// `publishedAt` is nullable, and SQLite sorts NULL first on DESC. A post
		// the author published without setting a date would therefore jump above
		// everything, so `createdAt` is the tie-breaker that keeps ordering sane.
		orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
	})
})

export const getPostBySlug = cache(async (slug: string) => {
	return prisma.post.findFirst({ where: { slug, published: true } })
})

export const getPostSlugs = cache(async () => {
	return prisma.post.findMany({
		where: { published: true },
		select: { slug: true, updatedAt: true },
	})
})

/**
 * Increments the view counter for a post.
 *
 * Deliberately not wrapped in React `cache`: caching a write would swallow
 * every call after the first within a request. Failures are swallowed on
 * purpose -- a locked SQLite file must never turn a readable article into an
 * error page, and the counter is soft data.
 */
export async function incrementPostViews(id: string): Promise<void> {
	try {
		await prisma.post.update({
			where: { id },
			data: { views: { increment: 1 } },
		})
	} catch {
		// ignored on purpose
	}
}

/** Everything the landing page needs, fetched in parallel. */
export const getHomeData = cache(async () => {
	const [
		profile,
		skills,
		languages,
		services,
		experiences,
		education,
		certificates,
		achievements,
		timeline,
		projects,
		stats,
		gallery,
		testimonials,
		socialLinks,
		qrCodes,
		settings,
	] = await Promise.all([
		getProfile(),
		getSkills(),
		getLanguages(),
		getServices(),
		getExperiences(),
		getEducation(),
		getCertificates(),
		getAchievements(),
		getTimeline(),
		getProjects(),
		getStats(),
		getGallery(),
		getTestimonials(),
		getSocialLinks(),
		getQrCodes(),
		getSettings(),
	])

	return {
		profile,
		skills,
		languages,
		services,
		experiences,
		education,
		certificates,
		achievements,
		timeline,
		projects,
		stats,
		gallery,
		testimonials,
		socialLinks,
		qrCodes,
		settings,
	}
})

export type HomeData = Awaited<ReturnType<typeof getHomeData>>
export type ProjectWithRelations = Awaited<
	ReturnType<typeof getProjects>
>[number]
