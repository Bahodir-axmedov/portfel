import { EMPLOYMENT_TYPES, LOCATION_TYPES } from "@/constants"
import type { AdminResourceConfig } from "@/types"
import {
	iconField,
	options,
	orderField,
	publishedField,
	translated,
} from "./shared"

const employmentLabels: Record<string, string> = {
	full_time: "To'liq stavka",
	part_time: "Yarim stavka",
	freelance: "Frilans",
	contract: "Shartnoma",
	internship: "Amaliyot",
}

const locationTypeLabels: Record<string, string> = {
	onsite: "Ofisda",
	hybrid: "Gibrid",
	remote: "Masofadan",
}

export const experiencesResource: AdminResourceConfig = {
	key: "experiences",
	label: "Ish tajribasi",
	singular: "Ish joyi",
	icon: "Briefcase",
	model: "experience",
	searchable: ["company", "role"],
	defaultSort: { field: "startDate", direction: "desc" },
	columns: [
		{ name: "company", label: "Kompaniya" },
		{ name: "role", label: "Lavozim" },
		{ name: "startDate", label: "Boshlangan", type: "date" },
		{ name: "current", label: "Hozir", type: "checkbox" },
	],
	fields: [
		{ name: "company", label: "Kompaniya nomi", type: "text", required: true },
		{ name: "companyUrl", label: "Kompaniya sayti", type: "text" },
		...translated("role", "Lavozim", "text", { required: true }),
		{
			name: "employment",
			label: "Bandlik turi",
			type: "select",
			options: options(EMPLOYMENT_TYPES, employmentLabels),
		},
		{ name: "location", label: "Joylashuv", type: "text" },
		{
			name: "locationType",
			label: "Ish formati",
			type: "select",
			options: options(LOCATION_TYPES, locationTypeLabels),
		},
		{
			name: "startDate",
			label: "Boshlangan sana",
			type: "date",
			required: true,
		},
		{ name: "endDate", label: "Tugagan sana", type: "date" },
		{
			name: "current",
			label: "Hozir ham ishlayapman",
			type: "checkbox",
			help: "Yoqilsa, tugash sanasi o'rniga \u201cHozir\u201d chiqadi",
		},
		...translated("description", "Tavsif", "textarea", { rows: 4 }),
		...translated("highlights", "Asosiy natijalar", "tags"),
		{ name: "stack", label: "Texnologiyalar", type: "tags" },
		publishedField,
		orderField,
	],
}

export const educationResource: AdminResourceConfig = {
	key: "education",
	label: "Ta'lim",
	singular: "Ta'lim muassasasi",
	icon: "GraduationCap",
	model: "education",
	searchable: ["school", "field"],
	defaultSort: { field: "startYear", direction: "desc" },
	columns: [
		{ name: "school", label: "Muassasa" },
		{ name: "field", label: "Yo'nalish" },
		{ name: "startYear", label: "Boshlangan", type: "number" },
		{ name: "current", label: "O'qiyapman", type: "checkbox" },
	],
	fields: [
		...translated("school", "Muassasa nomi", "text", { required: true }),
		...translated("degree", "Daraja"),
		...translated("field", "Yo'nalish"),
		{
			name: "startYear",
			label: "Boshlangan yil",
			type: "number",
			step: 1,
			required: true,
		},
		{ name: "endYear", label: "Tugash yili", type: "number", step: 1 },
		{ name: "current", label: "Hozir o'qiyapman", type: "checkbox" },
		...translated("description", "Izoh", "textarea", { rows: 3 }),
		publishedField,
		orderField,
	],
}

export const certificatesResource: AdminResourceConfig = {
	key: "certificates",
	label: "Sertifikatlar",
	singular: "Sertifikat",
	icon: "Award",
	model: "certificate",
	searchable: ["title", "issuer"],
	defaultSort: { field: "issueDate", direction: "desc" },
	columns: [
		{ name: "title", label: "Nomi" },
		{ name: "issuer", label: "Bergan tashkilot" },
		{ name: "issueDate", label: "Sana", type: "date" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		...translated("title", "Sertifikat nomi", "text", { required: true }),
		{
			name: "issuer",
			label: "Bergan tashkilot",
			type: "text",
			required: true,
		},
		{ name: "issueDate", label: "Berilgan sana", type: "date" },
		{ name: "expiryDate", label: "Amal qilish muddati", type: "date" },
		{ name: "credentialId", label: "Sertifikat ID", type: "text" },
		{ name: "credentialUrl", label: "Tekshirish havolasi", type: "text" },
		{ name: "imageUrl", label: "Sertifikat rasmi", type: "image" },
		{ name: "description", label: "Izoh", type: "textarea", rows: 3 },
		publishedField,
		orderField,
	],
}

export const achievementsResource: AdminResourceConfig = {
	key: "achievements",
	label: "Yutuqlar",
	singular: "Yutuq",
	icon: "Trophy",
	model: "achievement",
	searchable: ["title"],
	defaultSort: { field: "date", direction: "desc" },
	columns: [
		{ name: "title", label: "Nomi" },
		{ name: "date", label: "Sana", type: "date" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		...translated("title", "Yutuq nomi", "text", { required: true }),
		...translated("description", "Tavsif", "textarea", { rows: 3 }),
		{ name: "date", label: "Sana", type: "date" },
		iconField,
		{ name: "url", label: "Havola", type: "text" },
		publishedField,
		orderField,
	],
}

export const timelineResource: AdminResourceConfig = {
	key: "timeline",
	label: "Timeline",
	singular: "Timeline voqeasi",
	icon: "Milestone",
	model: "timelineEvent",
	searchable: ["title"],
	defaultSort: { field: "year", direction: "asc" },
	columns: [
		{ name: "year", label: "Yil", type: "number" },
		{ name: "title", label: "Sarlavha" },
		{ name: "published", label: "Ochiq", type: "checkbox" },
	],
	fields: [
		{ name: "year", label: "Yil", type: "number", step: 1, required: true },
		...translated("title", "Sarlavha", "text", { required: true }),
		...translated("description", "Tavsif", "textarea", { rows: 3 }),
		...translated("bullets", "Nuqtalar", "tags"),
		iconField,
		{
			name: "type",
			label: "Turi",
			type: "select",
			options: options(
				["milestone", "education", "work", "project", "launch"],
				{
					milestone: "Bosqich",
					education: "Ta'lim",
					work: "Ish",
					project: "Loyiha",
					launch: "Ishga tushirish",
				},
			),
		},
		publishedField,
		orderField,
	],
}
