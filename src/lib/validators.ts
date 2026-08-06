import { z } from "zod"

/**
 * Every request body that reaches the server is parsed through one of these
 * schemas — nothing untrusted is written to the database directly.
 */

export const loginSchema = z.object({
	email: z.string().email("Email noto'g'ri formatda"),
	password: z.string().min(6, "Parol juda qisqa"),
})

export const contactSchema = z.object({
	name: z.string().trim().min(2, "Ism juda qisqa").max(80),
	email: z.string().trim().email("Email noto'g'ri formatda").max(120),
	subject: z.string().trim().max(140).optional().or(z.literal("")),
	message: z.string().trim().min(10, "Xabar juda qisqa").max(4000),
	locale: z.string().max(5).optional(),
	/** Honeypot — must stay empty; bots usually fill it in. */
	website: z.string().max(0).optional().or(z.literal("")),
})

export type ContactInput = z.infer<typeof contactSchema>

const optionalString = z.string().trim().optional().nullable()
const stringList = z.array(z.string()).optional().nullable()

export const projectSchema = z.object({
	slug: z
		.string()
		.trim()
		.min(2)
		.regex(/^[a-z0-9-]+$/, "Faqat kichik harflar, raqamlar va '-'"),
	title: z.string().trim().min(2).max(120),
	tagline: optionalString,
	taglineRu: optionalString,
	taglineEn: optionalString,
	summary: z.string().trim().min(10).max(600),
	summaryRu: optionalString,
	summaryEn: optionalString,
	description: optionalString,
	descriptionRu: optionalString,
	descriptionEn: optionalString,
	features: stringList,
	featuresRu: stringList,
	featuresEn: stringList,
	roadmap: stringList,
	roadmapRu: stringList,
	roadmapEn: stringList,
	architecture: optionalString,
	architectureRu: optionalString,
	architectureEn: optionalString,
	category: z.string().default("other"),
	status: z.string().default("active"),
	role: optionalString,
	client: optionalString,
	version: optionalString,
	yearStart: z.coerce.number().int().min(2000).max(2100).optional().nullable(),
	yearEnd: z.coerce.number().int().min(2000).max(2100).optional().nullable(),
	coverImage: optionalString,
	videoUrl: optionalString,
	demoUrl: optionalString,
	githubUrl: optionalString,
	botUsername: optionalString,
	users: z.coerce.number().int().min(0).optional().nullable(),
	featured: z.coerce.boolean().optional(),
	pinned: z.coerce.boolean().optional(),
	published: z.coerce.boolean().optional(),
	isDraftInfo: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
	technologies: stringList,
})

export const skillSchema = z.object({
	name: z.string().trim().min(1).max(60),
	category: z.string().min(1),
	level: z.coerce.number().int().min(0).max(100),
	years: z.coerce.number().min(0).max(50).optional().nullable(),
	icon: optionalString,
	color: optionalString,
	description: optionalString,
	descriptionRu: optionalString,
	descriptionEn: optionalString,
	featured: z.coerce.boolean().optional(),
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const languageSchema = z.object({
	name: z.string().trim().min(1).max(60),
	nameRu: optionalString,
	nameEn: optionalString,
	code: z.string().trim().min(2).max(5),
	flag: optionalString,
	level: z.string().default("intermediate"),
	speaking: z.coerce.number().int().min(0).max(100),
	writing: z.coerce.number().int().min(0).max(100),
	reading: z.coerce.number().int().min(0).max(100),
	listening: z.coerce.number().int().min(0).max(100),
	note: optionalString,
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const serviceSchema = z.object({
	title: z.string().trim().min(2).max(120),
	titleRu: optionalString,
	titleEn: optionalString,
	description: z.string().trim().min(5).max(600),
	descriptionRu: optionalString,
	descriptionEn: optionalString,
	icon: z.string().default("Sparkles"),
	bullets: stringList,
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const experienceSchema = z.object({
	company: z.string().trim().min(1).max(120),
	role: z.string().trim().min(1).max(120),
	roleRu: optionalString,
	roleEn: optionalString,
	employment: z.string().default("full_time"),
	location: optionalString,
	locationType: optionalString,
	startDate: z.string().min(4),
	endDate: optionalString,
	current: z.coerce.boolean().optional(),
	description: optionalString,
	descriptionRu: optionalString,
	descriptionEn: optionalString,
	highlights: stringList,
	highlightsRu: stringList,
	highlightsEn: stringList,
	stack: stringList,
	companyUrl: optionalString,
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const educationSchema = z.object({
	school: z.string().trim().min(2).max(160),
	schoolRu: optionalString,
	schoolEn: optionalString,
	degree: optionalString,
	degreeRu: optionalString,
	degreeEn: optionalString,
	field: optionalString,
	fieldRu: optionalString,
	fieldEn: optionalString,
	startYear: z.coerce.number().int().min(1950).max(2100),
	endYear: z.coerce.number().int().min(1950).max(2100).optional().nullable(),
	current: z.coerce.boolean().optional(),
	description: optionalString,
	descriptionRu: optionalString,
	descriptionEn: optionalString,
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const certificateSchema = z.object({
	title: z.string().trim().min(2).max(160),
	titleRu: optionalString,
	titleEn: optionalString,
	issuer: z.string().trim().min(2).max(120),
	issueDate: optionalString,
	expiryDate: optionalString,
	credentialId: optionalString,
	credentialUrl: optionalString,
	imageUrl: optionalString,
	description: optionalString,
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const achievementSchema = z.object({
	title: z.string().trim().min(2).max(160),
	titleRu: optionalString,
	titleEn: optionalString,
	description: optionalString,
	descriptionRu: optionalString,
	descriptionEn: optionalString,
	date: optionalString,
	icon: optionalString,
	url: optionalString,
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const timelineSchema = z.object({
	year: z.coerce.number().int().min(1990).max(2100),
	title: z.string().trim().min(2).max(160),
	titleRu: optionalString,
	titleEn: optionalString,
	description: optionalString,
	descriptionRu: optionalString,
	descriptionEn: optionalString,
	bullets: stringList,
	bulletsRu: stringList,
	bulletsEn: stringList,
	icon: optionalString,
	type: z.string().default("milestone"),
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const statSchema = z.object({
	key: z.string().trim().min(1).max(40),
	label: z.string().trim().min(1).max(80),
	labelRu: optionalString,
	labelEn: optionalString,
	value: z.coerce.number().int().min(0),
	suffix: optionalString,
	icon: optionalString,
	computed: optionalString,
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const gallerySchema = z.object({
	title: optionalString,
	titleRu: optionalString,
	titleEn: optionalString,
	url: z.string().trim().min(1),
	thumbUrl: optionalString,
	category: z.string().default("work"),
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const testimonialSchema = z.object({
	author: z.string().trim().min(2).max(120),
	role: optionalString,
	company: optionalString,
	avatarUrl: optionalString,
	quote: z.string().trim().min(10).max(1200),
	quoteRu: optionalString,
	quoteEn: optionalString,
	rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
	isPlaceholder: z.coerce.boolean().optional(),
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const socialLinkSchema = z.object({
	platform: z.string().trim().min(2).max(40),
	label: z.string().trim().min(1).max(60),
	url: z.string().trim().url("URL noto'g'ri"),
	handle: optionalString,
	icon: z.string().min(1),
	showInHero: z.coerce.boolean().optional(),
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const qrCodeSchema = z.object({
	key: z.string().trim().min(1).max(40),
	label: z.string().trim().min(1).max(80),
	labelRu: optionalString,
	labelEn: optionalString,
	value: z.string().trim().min(1).max(500),
	icon: optionalString,
	published: z.coerce.boolean().optional(),
	order: z.coerce.number().int().optional(),
})

export const postSchema = z.object({
	slug: z
		.string()
		.trim()
		.min(2)
		.regex(/^[a-z0-9-]+$/, "Faqat kichik harflar, raqamlar va '-'"),
	title: z.string().trim().min(2).max(160),
	titleRu: optionalString,
	titleEn: optionalString,
	excerpt: optionalString,
	excerptRu: optionalString,
	excerptEn: optionalString,
	content: z.string().min(10),
	contentRu: optionalString,
	contentEn: optionalString,
	coverImage: optionalString,
	tags: stringList,
	published: z.coerce.boolean().optional(),
	publishedAt: optionalString,
})

export const seoSchema = z.object({
	route: z.string().trim().min(1).max(120),
	title: z.string().trim().min(2).max(160),
	titleRu: optionalString,
	titleEn: optionalString,
	description: z.string().trim().min(10).max(320),
	descriptionRu: optionalString,
	descriptionEn: optionalString,
	keywords: stringList,
	ogImage: optionalString,
	noIndex: z.coerce.boolean().optional(),
})

export const profileSchema = z.object({
	fullName: z.string().trim().min(2).max(120),
	brandName: z.string().trim().min(1).max(60),
	jobTitle: z.string().trim().min(2).max(120),
	jobTitleRu: optionalString,
	jobTitleEn: optionalString,
	typingRoles: stringList,
	shortBio: z.string().trim().min(10),
	shortBioRu: optionalString,
	shortBioEn: optionalString,
	midBio: z.string().trim().min(10),
	midBioRu: optionalString,
	midBioEn: optionalString,
	fullBio: z.string().trim().min(10),
	fullBioRu: optionalString,
	fullBioEn: optionalString,
	philosophy: optionalString,
	philosophyRu: optionalString,
	philosophyEn: optionalString,
	goals: optionalString,
	goalsRu: optionalString,
	goalsEn: optionalString,
	motto: optionalString,
	mottoRu: optionalString,
	mottoEn: optionalString,
	birthDate: optionalString,
	birthPlace: optionalString,
	location: optionalString,
	timezone: optionalString,
	email: z.string().email().optional().nullable().or(z.literal("")),
	phone: optionalString,
	telegram: optionalString,
	mapUrl: optionalString,
	availability: z.string().default("open_to_work"),
	remoteOk: z.coerce.boolean().optional(),
	codingSince: z.coerce.number().int().min(1990).max(2100).optional(),
	avatarUrl: optionalString,
	heroImage: optionalString,
	ogImage: optionalString,
	resumeUz: optionalString,
	resumeRu: optionalString,
	resumeEn: optionalString,
	interests: stringList,
})

export const settingSchema = z.object({
	key: z.string().trim().min(1).max(80),
	value: z.string().max(2000),
	group: z.string().default("general"),
	type: z.string().default("text"),
})

/** Maps an admin resource name to its schema. Used by the generic API route. */
export const resourceSchemas = {
	projects: projectSchema,
	skills: skillSchema,
	languages: languageSchema,
	services: serviceSchema,
	experiences: experienceSchema,
	education: educationSchema,
	certificates: certificateSchema,
	achievements: achievementSchema,
	timeline: timelineSchema,
	stats: statSchema,
	gallery: gallerySchema,
	testimonials: testimonialSchema,
	socials: socialLinkSchema,
	qrcodes: qrCodeSchema,
	posts: postSchema,
	seo: seoSchema,
	settings: settingSchema,
} as const

export type ResourceName = keyof typeof resourceSchemas

export function formatZodError(error: z.ZodError) {
	return error.issues.map((issue) => ({
		field: issue.path.join("."),
		message: issue.message,
	}))
}
