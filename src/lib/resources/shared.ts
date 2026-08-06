import type { AdminField, AdminFieldType } from "@/types"

/**
 * Shared building blocks for the admin resource configuration.
 *
 * Every CRUD screen in `/admin` is generated from these declarations, so adding
 * a field to a section is a one-line change here rather than a new form.
 */

/** Turns a readonly tuple from `@/constants` into `<select>` options. */
export function options(
	values: readonly string[],
	labels: Record<string, string> = {},
): Array<{ value: string; label: string }> {
	return values.map((value) => ({
		value,
		label: labels[value] ?? value.replace(/_/g, " "),
	}))
}

/**
 * Expands one logical field into its Uzbek / Russian / English inputs.
 * `translationOf` lets the form group them into a single tabbed control.
 */
export function translated(
	name: string,
	label: string,
	type: AdminFieldType = "text",
	extra: Partial<AdminField> = {},
): AdminField[] {
	const { required, ...rest } = extra
	return [
		{ name, label: `${label} (UZ)`, type, group: label, required, ...rest },
		{
			name: `${name}Ru`,
			label: `${label} (RU)`,
			type,
			translationOf: name,
			group: label,
			...rest,
		},
		{
			name: `${name}En`,
			label: `${label} (EN)`,
			type,
			translationOf: name,
			group: label,
			...rest,
		},
	]
}

export const orderField: AdminField = {
	name: "order",
	label: "Tartib raqami",
	type: "number",
	min: 0,
	step: 1,
	help: "Kichik raqam yuqorida turadi",
}

export const publishedField: AdminField = {
	name: "published",
	label: "Saytda ko'rsatilsin",
	type: "checkbox",
}

export const featuredField: AdminField = {
	name: "featured",
	label: "Tanlangan",
	type: "checkbox",
}

export const iconField: AdminField = {
	name: "icon",
	label: "Ikonka",
	type: "icon",
	help: "Lucide ikonka nomi, masalan: Bot, Database, Rocket",
}
