import type { AdminResourceConfig } from "@/types"
import {
	iconField,
	options,
	orderField,
	publishedField,
	translated,
} from "./shared"

export const statsResource: AdminResourceConfig = {
	key: "stats",
	label: "Statistika",
	singular: "Ko'rsatkich",
	icon: "BarChart3",
	model: "stat",
	searchable: ["key", "label"],
	defaultSort: { field: "order", direction: "asc" },
	columns: [
		{ name: "label", label: "Nomi" },
		{ name: "value", label: "Qiymati", type: "number" },
		{ name: "suffix", label: "Qo'shimcha" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		{
			name: "key",
			label: "Kalit",
			type: "text",
			required: true,
			help: "Takrorlanmas kalit, masalan: projects",
		},
		...translated("label", "Nomi", "text", { required: true }),
		{ name: "value", label: "Qiymati", type: "number", min: 0, required: true },
		{
			name: "suffix",
			label: "Qo'shimcha belgi",
			type: "text",
			help: "+, k, %",
		},
		iconField,
		{
			name: "computed",
			label: "Avtomatik hisoblash",
			type: "text",
			help: "Masalan: yearsSince:2020 \u2014 tajriba yillarini o'zi hisoblaydi",
		},
		publishedField,
		orderField,
	],
}

export const galleryResource: AdminResourceConfig = {
	key: "gallery",
	label: "Galereya",
	singular: "Rasm",
	icon: "Image",
	model: "galleryItem",
	searchable: ["title"],
	defaultSort: { field: "order", direction: "asc" },
	columns: [
		{ name: "title", label: "Sarlavha" },
		{ name: "category", label: "Kategoriya" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		...translated("title", "Sarlavha"),
		{ name: "url", label: "Rasm", type: "image", required: true },
		{ name: "thumbUrl", label: "Kichik rasm", type: "image" },
		{
			name: "category",
			label: "Kategoriya",
			type: "select",
			options: options(["work", "event", "team", "personal", "setup"], {
				work: "Ish",
				event: "Tadbir",
				team: "Jamoa",
				personal: "Shaxsiy",
				setup: "Ish joyi",
			}),
		},
		publishedField,
		orderField,
	],
}

export const testimonialsResource: AdminResourceConfig = {
	key: "testimonials",
	label: "Fikrlar",
	singular: "Fikr",
	icon: "Quote",
	model: "testimonial",
	searchable: ["author", "company"],
	defaultSort: { field: "order", direction: "asc" },
	columns: [
		{ name: "author", label: "Muallif" },
		{ name: "company", label: "Kompaniya" },
		{ name: "isPlaceholder", label: "Namuna", type: "checkbox" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		{ name: "author", label: "Muallif ismi", type: "text", required: true },
		{ name: "role", label: "Lavozimi", type: "text" },
		{ name: "company", label: "Kompaniya", type: "text" },
		{ name: "avatarUrl", label: "Rasmi", type: "image" },
		...translated("quote", "Fikr matni", "textarea", {
			rows: 4,
			required: true,
		}),
		{ name: "rating", label: "Baho (1-5)", type: "number", min: 1, max: 5 },
		{
			name: "isPlaceholder",
			label: "Namuna fikr",
			type: "checkbox",
			help: "Haqiqiy fikrlar qo'shilganda o'chiring",
		},
		publishedField,
		orderField,
	],
}

export const socialsResource: AdminResourceConfig = {
	key: "socials",
	label: "Ijtimoiy tarmoqlar",
	singular: "Havola",
	icon: "Link2",
	model: "socialLink",
	searchable: ["platform", "label"],
	defaultSort: { field: "order", direction: "asc" },
	columns: [
		{ name: "label", label: "Nomi" },
		{ name: "handle", label: "Username" },
		{ name: "showInHero", label: "Hero'da", type: "checkbox" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		{
			name: "platform",
			label: "Platforma kaliti",
			type: "text",
			required: true,
			help: "github, telegram, linkedin \u2026",
		},
		{ name: "label", label: "Ko'rinadigan nomi", type: "text", required: true },
		{ name: "url", label: "To'liq havola", type: "text", required: true },
		{ name: "handle", label: "Username", type: "text" },
		iconField,
		{ name: "showInHero", label: "Hero bo'limida chiqsin", type: "checkbox" },
		publishedField,
		orderField,
	],
}

export const qrcodesResource: AdminResourceConfig = {
	key: "qrcodes",
	label: "QR kodlar",
	singular: "QR kod",
	icon: "QrCode",
	model: "qrCode",
	searchable: ["key", "label"],
	defaultSort: { field: "order", direction: "asc" },
	columns: [
		{ name: "label", label: "Nomi" },
		{ name: "value", label: "Qiymati" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		{
			name: "key",
			label: "Turi",
			type: "select",
			required: true,
			options: options(
				[
					"website",
					"telegram",
					"github",
					"linkedin",
					"instagram",
					"email",
					"phone",
					"whatsapp",
					"resume",
				],
				{
					website: "Website",
					telegram: "Telegram",
					github: "GitHub",
					linkedin: "LinkedIn",
					instagram: "Instagram",
					email: "Email",
					phone: "Telefon",
					whatsapp: "WhatsApp",
					resume: "Rezyume",
				},
			),
			help: "Qiymat shu turga qarab avtomatik formatlanadi",
		},
		...translated("label", "Nomi", "text", { required: true }),
		{ name: "value", label: "Qiymati", type: "text", required: true },
		iconField,
		publishedField,
		orderField,
	],
}

export const postsResource: AdminResourceConfig = {
	key: "posts",
	label: "Blog",
	singular: "Maqola",
	icon: "FileText",
	model: "post",
	searchable: ["title", "slug"],
	defaultSort: { field: "publishedAt", direction: "desc" },
	columns: [
		{ name: "title", label: "Sarlavha" },
		{ name: "publishedAt", label: "Sana", type: "date" },
		{ name: "views", label: "Ko'rishlar", type: "number" },
		{ name: "published", label: "Chop etilgan", type: "checkbox" },
	],
	fields: [
		...translated("title", "Sarlavha", "text", { required: true }),
		{ name: "slug", label: "Slug (URL)", type: "text", required: true },
		...translated("excerpt", "Qisqacha", "textarea", { rows: 3 }),
		...translated("content", "Matn", "richtext", { rows: 14, required: true }),
		{ name: "coverImage", label: "Muqova rasmi", type: "image" },
		{ name: "tags", label: "Teglar", type: "tags" },
		{
			name: "readMinutes",
			label: "O'qish vaqti (daq.)",
			type: "number",
			min: 1,
		},
		{ name: "publishedAt", label: "Chop etilgan sana", type: "date" },
		{ name: "published", label: "Chop etilsin", type: "checkbox" },
	],
}

export const seoResource: AdminResourceConfig = {
	key: "seo",
	label: "SEO",
	singular: "SEO yozuvi",
	icon: "Gauge",
	model: "seoSetting",
	searchable: ["route", "title"],
	defaultSort: { field: "route", direction: "asc" },
	columns: [
		{ name: "route", label: "Sahifa" },
		{ name: "title", label: "Title" },
		{ name: "noIndex", label: "Yashirin", type: "checkbox" },
	],
	fields: [
		{
			name: "route",
			label: "Sahifa yo'li",
			type: "text",
			required: true,
			help: "/ yoki /projects",
		},
		...translated("title", "Meta title"),
		...translated("description", "Meta description", "textarea", { rows: 3 }),
		{ name: "keywords", label: "Kalit so'zlar", type: "tags" },
		{ name: "ogImage", label: "OG rasm", type: "image" },
		{
			name: "noIndex",
			label: "Qidiruvdan yashirilsin",
			type: "checkbox",
		},
	],
}

export const settingsResource: AdminResourceConfig = {
	key: "settings",
	label: "Sozlamalar",
	singular: "Sozlama",
	icon: "Sparkles",
	model: "setting",
	searchable: ["key"],
	defaultSort: { field: "key", direction: "asc" },
	columns: [
		{ name: "key", label: "Kalit" },
		{ name: "value", label: "Qiymati" },
		{ name: "group", label: "Guruh" },
	],
	fields: [
		{ name: "key", label: "Kalit", type: "text", required: true },
		{ name: "value", label: "Qiymati", type: "text", required: true },
		{ name: "group", label: "Guruh", type: "text" },
		{
			name: "type",
			label: "Qiymat turi",
			type: "select",
			options: options(["text", "number", "boolean", "color", "url"]),
		},
	],
}
