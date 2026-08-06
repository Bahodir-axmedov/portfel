/**
 * Seeds the database from the JSON files in `/content`.
 *
 * Safe to re-run: every record is upserted by a stable key, so `npm run db:seed`
 * refreshes content without deleting anything you added from the admin panel
 * (except records with the same key, which are updated).
 *
 *   npm run setup   # prisma generate + db push + seed
 *   npm run db:seed # seed only
 */

import { PrismaClient } from "@prisma/client"
import profileData from "../content/profile.json"
import expertiseData from "../content/expertise.json"
import careerData from "../content/career.json"
import projectsData from "../content/projects.json"
import siteData from "../content/site.json"

const prisma = new PrismaClient()

/** SQLite has no arrays — lists are stored as JSON strings. */
const json = (value: unknown): string | null =>
	Array.isArray(value) && value.length ? JSON.stringify(value) : null

const date = (value?: string | null): Date | null =>
	value ? new Date(value) : null

async function seedProfile() {
	const p = profileData as Record<string, any>
	const data = {
		fullName: p.fullName,
		brandName: p.brandName,
		jobTitle: p.jobTitle,
		jobTitleRu: p.jobTitleRu,
		jobTitleEn: p.jobTitleEn,
		typingRoles: JSON.stringify(p.typingRoles ?? []),
		shortBio: p.shortBio,
		shortBioRu: p.shortBioRu,
		shortBioEn: p.shortBioEn,
		midBio: p.midBio,
		midBioRu: p.midBioRu,
		midBioEn: p.midBioEn,
		fullBio: p.fullBio,
		fullBioRu: p.fullBioRu,
		fullBioEn: p.fullBioEn,
		philosophy: p.philosophy,
		philosophyRu: p.philosophyRu,
		philosophyEn: p.philosophyEn,
		goals: p.goals,
		goalsRu: p.goalsRu,
		goalsEn: p.goalsEn,
		motto: p.motto,
		mottoRu: p.mottoRu,
		mottoEn: p.mottoEn,
		birthDate: date(p.birthDate),
		birthPlace: p.birthPlace,
		birthPlaceRu: p.birthPlaceRu,
		birthPlaceEn: p.birthPlaceEn,
		location: p.location,
		locationRu: p.locationRu,
		locationEn: p.locationEn,
		timezone: p.timezone,
		email: p.email,
		phone: p.phone,
		telegram: p.telegram,
		mapUrl: p.mapUrl,
		availability: p.availability,
		remoteOk: p.remoteOk,
		codingSince: p.codingSince,
		avatarUrl: p.avatarUrl,
		heroImage: p.heroImage,
		ogImage: p.ogImage,
		resumeUz: p.resumeUz,
		resumeRu: p.resumeRu,
		resumeEn: p.resumeEn,
		interests: json(p.interests),
	}

	await prisma.profile.upsert({
		where: { id: "main" },
		create: { id: "main", ...data },
		update: data,
	})
	console.log("  ✓ profile")
}

async function seedExpertise() {
	const { skills, languages, services } = expertiseData as Record<string, any[]>

	for (const skill of skills) {
		const existing = await prisma.skill.findFirst({
			where: { name: skill.name },
		})
		const data = {
			name: skill.name,
			category: skill.category,
			level: skill.level,
			years: skill.years ?? null,
			icon: skill.icon ?? null,
			color: skill.color ?? null,
			description: skill.description ?? null,
			descriptionRu: skill.descriptionRu ?? null,
			descriptionEn: skill.descriptionEn ?? null,
			featured: Boolean(skill.featured),
			order: skill.order ?? 0,
		}
		if (existing) {
			await prisma.skill.update({ where: { id: existing.id }, data })
		} else {
			await prisma.skill.create({ data })
		}
	}
	console.log(`  ✓ ${skills.length} skills`)

	for (const language of languages) {
		const existing = await prisma.language.findFirst({
			where: { code: language.code },
		})
		const data = {
			name: language.name,
			nameRu: language.nameRu ?? null,
			nameEn: language.nameEn ?? null,
			code: language.code,
			flag: language.flag ?? null,
			level: language.level,
			speaking: language.speaking,
			writing: language.writing,
			reading: language.reading,
			listening: language.listening,
			order: language.order ?? 0,
		}
		if (existing) {
			await prisma.language.update({ where: { id: existing.id }, data })
		} else {
			await prisma.language.create({ data })
		}
	}
	console.log(`  ✓ ${languages.length} languages`)

	for (const service of services) {
		const existing = await prisma.service.findFirst({
			where: { title: service.title },
		})
		const data = {
			title: service.title,
			titleRu: service.titleRu ?? null,
			titleEn: service.titleEn ?? null,
			description: service.description,
			descriptionRu: service.descriptionRu ?? null,
			descriptionEn: service.descriptionEn ?? null,
			icon: service.icon ?? "Sparkles",
			bullets: json(service.bullets),
			order: service.order ?? 0,
		}
		if (existing) {
			await prisma.service.update({ where: { id: existing.id }, data })
		} else {
			await prisma.service.create({ data })
		}
	}
	console.log(`  ✓ ${services.length} services`)
}

async function seedCareer() {
	const { experiences, education, certificates, achievements, timeline } =
		careerData as Record<string, any[]>

	for (const item of experiences) {
		const existing = await prisma.experience.findFirst({
			where: { company: item.company, role: item.role },
		})
		const data = {
			company: item.company,
			role: item.role,
			roleRu: item.roleRu ?? null,
			roleEn: item.roleEn ?? null,
			employment: item.employment ?? "full_time",
			location: item.location ?? null,
			locationType: item.locationType ?? "onsite",
			startDate: new Date(item.startDate),
			endDate: date(item.endDate),
			current: Boolean(item.current),
			description: item.description ?? null,
			descriptionRu: item.descriptionRu ?? null,
			descriptionEn: item.descriptionEn ?? null,
			highlights: json(item.highlights),
			highlightsRu: json(item.highlightsRu),
			highlightsEn: json(item.highlightsEn),
			stack: json(item.stack),
			companyUrl: item.companyUrl ?? null,
			order: item.order ?? 0,
		}
		if (existing) {
			await prisma.experience.update({ where: { id: existing.id }, data })
		} else {
			await prisma.experience.create({ data })
		}
	}
	console.log(`  ✓ ${experiences.length} experiences`)

	for (const item of education) {
		const existing = await prisma.education.findFirst({
			where: { school: item.school, startYear: item.startYear },
		})
		const data = {
			school: item.school,
			schoolRu: item.schoolRu ?? null,
			schoolEn: item.schoolEn ?? null,
			degree: item.degree ?? null,
			degreeRu: item.degreeRu ?? null,
			degreeEn: item.degreeEn ?? null,
			field: item.field ?? null,
			fieldRu: item.fieldRu ?? null,
			fieldEn: item.fieldEn ?? null,
			startYear: item.startYear,
			endYear: item.endYear ?? null,
			current: Boolean(item.current),
			description: item.description ?? null,
			descriptionRu: item.descriptionRu ?? null,
			descriptionEn: item.descriptionEn ?? null,
			order: item.order ?? 0,
		}
		if (existing) {
			await prisma.education.update({ where: { id: existing.id }, data })
		} else {
			await prisma.education.create({ data })
		}
	}
	console.log(`  ✓ ${education.length} education entries`)

	for (const item of certificates ?? []) {
		const existing = await prisma.certificate.findFirst({
			where: { title: item.title, issuer: item.issuer },
		})
		const data = {
			title: item.title,
			titleRu: item.titleRu ?? null,
			titleEn: item.titleEn ?? null,
			issuer: item.issuer,
			issueDate: date(item.issueDate),
			expiryDate: date(item.expiryDate),
			credentialId: item.credentialId ?? null,
			credentialUrl: item.credentialUrl ?? null,
			imageUrl: item.imageUrl ?? null,
			description: item.description ?? null,
			order: item.order ?? 0,
		}
		if (existing) {
			await prisma.certificate.update({ where: { id: existing.id }, data })
		} else {
			await prisma.certificate.create({ data })
		}
	}

	for (const item of achievements ?? []) {
		const existing = await prisma.achievement.findFirst({
			where: { title: item.title },
		})
		const data = {
			title: item.title,
			titleRu: item.titleRu ?? null,
			titleEn: item.titleEn ?? null,
			description: item.description ?? null,
			descriptionRu: item.descriptionRu ?? null,
			descriptionEn: item.descriptionEn ?? null,
			date: date(item.date),
			icon: item.icon ?? "Trophy",
			url: item.url ?? null,
			order: item.order ?? 0,
		}
		if (existing) {
			await prisma.achievement.update({ where: { id: existing.id }, data })
		} else {
			await prisma.achievement.create({ data })
		}
	}

	for (const item of timeline) {
		const existing = await prisma.timelineEvent.findFirst({
			where: { year: item.year, title: item.title },
		})
		const data = {
			year: item.year,
			title: item.title,
			titleRu: item.titleRu ?? null,
			titleEn: item.titleEn ?? null,
			description: item.description ?? null,
			descriptionRu: item.descriptionRu ?? null,
			descriptionEn: item.descriptionEn ?? null,
			bullets: json(item.bullets),
			bulletsRu: json(item.bulletsRu),
			bulletsEn: json(item.bulletsEn),
			icon: item.icon ?? "Milestone",
			type: item.type ?? "milestone",
			order: item.order ?? 0,
		}
		if (existing) {
			await prisma.timelineEvent.update({ where: { id: existing.id }, data })
		} else {
			await prisma.timelineEvent.create({ data })
		}
	}
	console.log(`  ✓ ${timeline.length} timeline events`)
}

async function seedProjects() {
	const { technologies, projects } = projectsData as Record<string, any[]>

	for (const tech of technologies) {
		await prisma.technology.upsert({
			where: { name: tech.name },
			create: {
				name: tech.name,
				icon: tech.icon ?? null,
				color: tech.color ?? null,
				category: tech.category ?? "other",
				order: tech.order ?? 0,
			},
			update: {
				icon: tech.icon ?? null,
				color: tech.color ?? null,
				category: tech.category ?? "other",
				order: tech.order ?? 0,
			},
		})
	}
	console.log(`  ✓ ${technologies.length} technologies`)

	for (const project of projects) {
		const data = {
			title: project.title,
			tagline: project.tagline ?? null,
			taglineRu: project.taglineRu ?? null,
			taglineEn: project.taglineEn ?? null,
			summary: project.summary,
			summaryRu: project.summaryRu ?? null,
			summaryEn: project.summaryEn ?? null,
			description: project.description ?? null,
			descriptionRu: project.descriptionRu ?? null,
			descriptionEn: project.descriptionEn ?? null,
			features: json(project.features),
			featuresRu: json(project.featuresRu),
			featuresEn: json(project.featuresEn),
			roadmap: json(project.roadmap),
			roadmapRu: json(project.roadmapRu),
			roadmapEn: json(project.roadmapEn),
			architecture: project.architecture ?? null,
			architectureRu: project.architectureRu ?? null,
			architectureEn: project.architectureEn ?? null,
			category: project.category ?? "other",
			status: project.status ?? "active",
			role: project.role ?? null,
			client: project.client ?? null,
			version: project.version ?? null,
			yearStart: project.yearStart ?? null,
			yearEnd: project.yearEnd ?? null,
			coverImage: project.coverImage ?? null,
			videoUrl: project.videoUrl ?? null,
			demoUrl: project.demoUrl ?? null,
			githubUrl: project.githubUrl ?? null,
			botUsername: project.botUsername ?? null,
			users: project.users ?? null,
			featured: Boolean(project.featured),
			pinned: Boolean(project.pinned),
			published: project.published !== false,
			isDraftInfo: Boolean(project.isDraftInfo),
			order: project.order ?? 0,
			technologies: {
				set: [],
				connect: (project.technologies ?? []).map((name: string) => ({ name })),
			},
		}

		const saved = await prisma.project.upsert({
			where: { slug: project.slug },
			create: { slug: project.slug, ...data },
			update: data,
		})

		for (const image of project.images ?? []) {
			const existing = await prisma.projectImage.findFirst({
				where: { projectId: saved.id, url: image.url },
			})
			if (!existing) {
				await prisma.projectImage.create({
					data: {
						projectId: saved.id,
						url: image.url,
						alt: image.alt ?? null,
						caption: image.caption ?? null,
						type: image.type ?? "screenshot",
						order: image.order ?? 0,
					},
				})
			}
		}
	}
	console.log(`  ✓ ${projects.length} projects`)
}

async function seedSite() {
	const site = siteData as Record<string, any[]>

	for (const stat of site.stats) {
		const data = {
			label: stat.label,
			labelRu: stat.labelRu ?? null,
			labelEn: stat.labelEn ?? null,
			value: stat.value,
			suffix: stat.suffix ?? "+",
			icon: stat.icon ?? "Activity",
			computed: stat.computed ?? null,
			order: stat.order ?? 0,
		}
		await prisma.stat.upsert({
			where: { key: stat.key },
			create: { key: stat.key, ...data },
			update: data,
		})
	}
	console.log(`  ✓ ${site.stats.length} stats`)

	for (const link of site.socialLinks) {
		const data = {
			label: link.label,
			url: link.url,
			handle: link.handle ?? null,
			icon: link.icon,
			showInHero: link.showInHero !== false,
			order: link.order ?? 0,
		}
		await prisma.socialLink.upsert({
			where: { platform: link.platform },
			create: { platform: link.platform, ...data },
			update: data,
		})
	}
	console.log(`  ✓ ${site.socialLinks.length} social links`)

	for (const qr of site.qrCodes) {
		const data = {
			label: qr.label,
			labelRu: qr.labelRu ?? null,
			labelEn: qr.labelEn ?? null,
			value: qr.value,
			icon: qr.icon ?? "QrCode",
			order: qr.order ?? 0,
		}
		await prisma.qrCode.upsert({
			where: { key: qr.key },
			create: { key: qr.key, ...data },
			update: data,
		})
	}
	console.log(`  ✓ ${site.qrCodes.length} QR codes`)

	// Placeholder testimonials are only inserted while none exist yet.
	const testimonialCount = await prisma.testimonial.count()
	if (testimonialCount === 0) {
		for (const item of site.testimonials) {
			await prisma.testimonial.create({
				data: {
					author: item.author,
					role: item.role ?? null,
					company: item.company ?? null,
					quote: item.quote,
					quoteRu: item.quoteRu ?? null,
					quoteEn: item.quoteEn ?? null,
					rating: item.rating ?? 5,
					isPlaceholder: Boolean(item.isPlaceholder),
					published: item.published !== false,
					order: item.order ?? 0,
				},
			})
		}
		console.log(`  ✓ ${site.testimonials.length} placeholder testimonials`)
	}

	for (const item of site.gallery ?? []) {
		const existing = await prisma.galleryItem.findFirst({
			where: { url: item.url },
		})
		if (!existing) {
			await prisma.galleryItem.create({
				data: {
					title: item.title ?? null,
					titleRu: item.titleRu ?? null,
					titleEn: item.titleEn ?? null,
					url: item.url,
					thumbUrl: item.thumbUrl ?? null,
					category: item.category ?? "work",
					order: item.order ?? 0,
				},
			})
		}
	}

	for (const seo of site.seo) {
		const data = {
			title: seo.title,
			titleRu: seo.titleRu ?? null,
			titleEn: seo.titleEn ?? null,
			description: seo.description,
			descriptionRu: seo.descriptionRu ?? null,
			descriptionEn: seo.descriptionEn ?? null,
			keywords: json(seo.keywords),
			ogImage: seo.ogImage ?? null,
			noIndex: Boolean(seo.noIndex),
		}
		await prisma.seoSetting.upsert({
			where: { route: seo.route },
			create: { route: seo.route, ...data },
			update: data,
		})
	}
	console.log(`  ✓ ${site.seo.length} SEO entries`)

	for (const setting of site.settings) {
		await prisma.setting.upsert({
			where: { key: setting.key },
			create: setting,
			update: { value: setting.value, group: setting.group, type: setting.type },
		})
	}
	console.log(`  ✓ ${site.settings.length} settings`)
}

async function main() {
	// `--if-empty` is what the Docker entrypoint passes on Railway.
	//
	// Every write below is an upsert keyed by a stable identifier, so running the
	// seed against a live database would silently overwrite anything edited from
	// the admin panel. The container must therefore only seed a genuinely empty
	// volume; on every later boot this exits before touching a single row.
	if (process.argv.includes("--if-empty")) {
		const existing = await prisma.profile.count()
		if (existing > 0) {
			console.log("↷ Database already has content — skipping seed.")
			return
		}
		console.log("Empty database detected — seeding initial content.")
	}

	console.log("\n⚡ Seeding Bahodir.dev portfolio database\n")
	await seedProfile()
	await seedExpertise()
	await seedCareer()
	await seedProjects()
	await seedSite()
	console.log("\n✅ Seed complete.\n")
}

main()
	.catch((error) => {
		console.error("\n❌ Seed failed:", error)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
