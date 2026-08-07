import type { AdminResourceConfig } from "@/types"
import { options, translated } from "./shared"

/**
 * The profile is a singleton (`id: "main"`), so the admin renders one long
 * form instead of a list view.
 */
export const profileResource: AdminResourceConfig = {
	key: "profile",
	label: "Profil",
	singular: "Profil",
	icon: "Users",
	model: "profile",
	singleton: true,
	columns: [{ name: "fullName", label: "Ism" }],
	fields: [
		{ name: "fullName", label: "To'liq ism", type: "text", required: true },
		{ name: "brandName", label: "Brend nomi", type: "text", required: true },
		...translated("jobTitle", "Kasbiy unvon", "text", { required: true }),
		{
			name: "typingRoles",
			label: "Hero'dagi yozilib chiquvchi unvonlar",
			type: "tags",
			help: "Hero bo'limida navbat bilan yoziladi",
		},

		...translated("shortBio", "Qisqa bio", "textarea", {
			rows: 3,
			required: true,
		}),
		...translated("midBio", "O'rta bio", "textarea", { rows: 5 }),
		...translated("fullBio", "To'liq bio", "textarea", {
			rows: 12,
			help: "Abzatslarni bo'sh qator bilan ajrating",
		}),
		...translated("philosophy", "Ish falsafasi", "textarea", { rows: 5 }),
		...translated("goals", "Maqsadlar", "textarea", { rows: 5 }),
		...translated("motto", "Shior"),

		{ name: "birthDate", label: "Tug'ilgan sana", type: "date" },
		...translated("birthPlace", "Tug'ilgan joy"),
		...translated("location", "Yashash joyi"),
		{ name: "timezone", label: "Vaqt mintaqasi", type: "text" },

		{ name: "email", label: "Email", type: "text", required: true },
		{ name: "phone", label: "Telefon", type: "text" },
		{ name: "telegram", label: "Telegram username", type: "text" },
		{ name: "mapUrl", label: "Google Maps havolasi", type: "text" },

		{
			name: "availability",
			label: "Ish holati",
			type: "select",
			options: options(["open_to_work", "open_to_offers", "unavailable"], {
				open_to_work: "Ish qidiryapman",
				open_to_offers: "Takliflarga ochiq",
				unavailable: "Hozircha band",
			}),
		},
		{ name: "remoteOk", label: "Masofadan ishlayman", type: "checkbox" },
		{
			name: "codingSince",
			label: "Dasturlashni boshlagan yil",
			type: "number",
			step: 1,
			help: "Tajriba yillari shundan avtomatik hisoblanadi",
		},

		{ name: "avatarUrl", label: "Profil rasmi", type: "image" },
		{ name: "heroImage", label: "Hero rasmi", type: "image" },
		{ name: "ogImage", label: "OG rasm (1200x630)", type: "image" },

		{ name: "resumeUz", label: "Rezyume (UZ)", type: "file" },
		{ name: "resumeRu", label: "Rezyume (RU)", type: "file" },
		{ name: "resumeEn", label: "Rezyume (EN)", type: "file" },

		{ name: "interests", label: "Qiziqishlar", type: "tags" },
	],
}
