import {
	LANGUAGE_LEVELS,
	PROJECT_CATEGORIES,
	PROJECT_STATUSES,
	SKILL_CATEGORIES,
} from "@/constants"
import type { AdminResourceConfig } from "@/types"
import {
	featuredField,
	iconField,
	options,
	orderField,
	publishedField,
	translated,
} from "./shared"

const categoryLabels: Record<string, string> = {
	telegram_bot: "Telegram bot",
	fintech: "Fintech",
	web: "Web",
	automation: "Avtomatlashtirish",
	ai: "Sun'iy intellekt",
	data: "Data & BI",
	other: "Boshqa",
}

const statusLabels: Record<string, string> = {
	active: "Ishlab chiqilmoqda",
	completed: "Yakunlangan",
	demo: "Demo",
	paused: "To'xtatilgan",
	planned: "Rejalashtirilgan",
}

const skillCategoryLabels: Record<string, string> = {
	frontend: "Frontend",
	backend: "Backend",
	fullstack: "Full Stack",
	database: "Database",
	devops: "DevOps",
	data: "Data & BI",
	network: "Tarmoq",
	fundamentals: "Asoslar",
}

const levelLabels: Record<string, string> = {
	native: "Ona tili",
	advanced: "Yuqori",
	intermediate: "O'rta",
	basic: "Boshlang'ich",
}

export const projectsResource: AdminResourceConfig = {
	key: "projects",
	label: "Loyihalar",
	singular: "Loyiha",
	icon: "Rocket",
	model: "project",
	searchable: ["title", "slug", "summary"],
	defaultSort: { field: "order", direction: "asc" },
	columns: [
		{ name: "title", label: "Nomi" },
		{ name: "category", label: "Kategoriya" },
		{ name: "status", label: "Holati" },
		{ name: "pinned", label: "Pin", type: "checkbox" },
		{ name: "featured", label: "Tanlangan", type: "checkbox" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		{ name: "title", label: "Loyiha nomi", type: "text", required: true },
		{
			name: "slug",
			label: "Slug (URL)",
			type: "text",
			required: true,
			help: "Masalan: energy-invest",
		},
		...translated("tagline", "Qisqa shior"),
		...translated("summary", "Kartochka matni", "textarea", {
			rows: 3,
			required: true,
		}),
		...translated("description", "To'liq tavsif", "textarea", { rows: 8 }),
		...translated("features", "Imkoniyatlar", "tags"),
		...translated("roadmap", "Kelajak rejalari", "tags"),
		...translated("architecture", "Arxitektura", "textarea", { rows: 6 }),
		{
			name: "category",
			label: "Kategoriya",
			type: "select",
			options: options(PROJECT_CATEGORIES, categoryLabels),
			required: true,
		},
		{
			name: "status",
			label: "Holati",
			type: "select",
			options: options(PROJECT_STATUSES, statusLabels),
			required: true,
		},
		{ name: "role", label: "Mening rolim", type: "text" },
		{ name: "client", label: "Mijoz", type: "text" },
		{ name: "version", label: "Versiya", type: "text" },
		{ name: "yearStart", label: "Boshlangan yil", type: "number", step: 1 },
		{ name: "yearEnd", label: "Tugagan yil", type: "number", step: 1 },
		{ name: "coverImage", label: "Muqova rasmi", type: "image" },
		{ name: "demoUrl", label: "Demo havolasi", type: "text" },
		{ name: "githubUrl", label: "GitHub havolasi", type: "text" },
		{ name: "videoUrl", label: "Video havolasi", type: "text" },
		{ name: "botUsername", label: "Bot username", type: "text" },
		{ name: "users", label: "Foydalanuvchilar soni", type: "number", min: 0 },
		{ name: "pinned", label: "Yuqoriga qadalsin", type: "checkbox" },
		featuredField,
		{
			name: "isDraftInfo",
			label: "Ma'lumot tasdiqlanmagan",
			type: "checkbox",
			help: "Yoqilsa, sahifada ogohlantirish chiqadi",
		},
		{
			name: "technologies",
			label: "Texnologiyalar",
			type: "relation",
			relation: "technology",
		},
		publishedField,
		orderField,
	],
}

export const skillsResource: AdminResourceConfig = {
	key: "skills",
	label: "Ko'nikmalar",
	singular: "Ko'nikma",
	icon: "Zap",
	model: "skill",
	searchable: ["name"],
	defaultSort: { field: "order", direction: "asc" },
	columns: [
		{ name: "name", label: "Nomi" },
		{ name: "category", label: "Kategoriya" },
		{ name: "level", label: "Daraja %", type: "number" },
		{ name: "years", label: "Yil", type: "number" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		{ name: "name", label: "Texnologiya nomi", type: "text", required: true },
		{
			name: "category",
			label: "Kategoriya",
			type: "select",
			options: options(SKILL_CATEGORIES, skillCategoryLabels),
			required: true,
		},
		{
			name: "level",
			label: "Daraja (%)",
			type: "number",
			min: 0,
			max: 100,
			step: 1,
			required: true,
		},
		{ name: "years", label: "Necha yillik tajriba", type: "number", min: 0 },
		iconField,
		{ name: "color", label: "Rang", type: "color" },
		...translated("description", "Izoh", "textarea", { rows: 3 }),
		featuredField,
		publishedField,
		orderField,
	],
}

export const languagesResource: AdminResourceConfig = {
	key: "languages",
	label: "Tillar",
	singular: "Til",
	icon: "Globe",
	model: "language",
	searchable: ["name", "code"],
	defaultSort: { field: "order", direction: "asc" },
	columns: [
		{ name: "name", label: "Til" },
		{ name: "level", label: "Daraja" },
		{ name: "speaking", label: "Gapirish", type: "number" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		...translated("name", "Til nomi", "text", { required: true }),
		{
			name: "code",
			label: "Kodi",
			type: "text",
			required: true,
			help: "uz, ru, en",
		},
		{ name: "flag", label: "Bayroq emoji", type: "text" },
		{
			name: "level",
			label: "Umumiy daraja",
			type: "select",
			options: options(LANGUAGE_LEVELS, levelLabels),
			required: true,
		},
		{ name: "speaking", label: "Gapirish (%)", type: "number", min: 0, max: 100 },
		{ name: "writing", label: "Yozish (%)", type: "number", min: 0, max: 100 },
		{ name: "reading", label: "O'qish (%)", type: "number", min: 0, max: 100 },
		{
			name: "listening",
			label: "Tinglash (%)",
			type: "number",
			min: 0,
			max: 100,
		},
		publishedField,
		orderField,
	],
}

export const servicesResource: AdminResourceConfig = {
	key: "services",
	label: "Xizmatlar",
	singular: "Xizmat",
	icon: "Sparkles",
	model: "service",
	searchable: ["title"],
	defaultSort: { field: "order", direction: "asc" },
	columns: [
		{ name: "title", label: "Nomi" },
		{ name: "icon", label: "Ikonka" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		...translated("title", "Xizmat nomi", "text", { required: true }),
		...translated("description", "Tavsif", "textarea", {
			rows: 4,
			required: true,
		}),
		iconField,
		{ name: "bullets", label: "Nimalar kiradi", type: "tags" },
		featuredField,
		publishedField,
		orderField,
	],
}
