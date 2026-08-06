import type { AdminField, AdminResourceConfig } from "@/types"
import { ADMIN_RESOURCES, type AdminResource } from "@/constants"
import {
	languagesResource,
	projectsResource,
	servicesResource,
	skillsResource,
} from "./content"
import {
	achievementsResource,
	certificatesResource,
	educationResource,
	experiencesResource,
	timelineResource,
} from "./career"
import {
	galleryResource,
	postsResource,
	qrcodesResource,
	seoResource,
	settingsResource,
	socialsResource,
	statsResource,
	testimonialsResource,
} from "./site"
import { profileResource } from "./profile"

export { profileResource }
export * from "./shared"

/**
 * Every admin CRUD screen is generated from this list. The order matches
 * `ADMIN_RESOURCES` so the sidebar and the routes stay in sync.
 */
export const adminResources: AdminResourceConfig[] = [
	projectsResource,
	skillsResource,
	languagesResource,
	servicesResource,
	experiencesResource,
	educationResource,
	certificatesResource,
	achievementsResource,
	timelineResource,
	statsResource,
	galleryResource,
	testimonialsResource,
	socialsResource,
	qrcodesResource,
	postsResource,
	seoResource,
	settingsResource,
]

const byKey = new Map(
	adminResources.map((resource) => [resource.key, resource] as const),
)

export function isAdminResource(key: string): key is AdminResource {
	return (ADMIN_RESOURCES as readonly string[]).includes(key)
}

/** Returns the config for a resource key, or `undefined` when unknown. */
export function getResource(key: string): AdminResourceConfig | undefined {
	if (key === profileResource.key) return profileResource
	return byKey.get(key)
}

/** Base fields only — translations are attached to their parent field. */
export function baseFields(resource: AdminResourceConfig): AdminField[] {
	return resource.fields.filter((field) => !field.translationOf)
}

/** The RU / EN inputs that belong to a given base field. */
export function translationsFor(
	resource: AdminResourceConfig,
	fieldName: string,
): AdminField[] {
	return resource.fields.filter((field) => field.translationOf === fieldName)
}

/** Field names that hold JSON-encoded arrays and need parse/stringify. */
export function arrayFields(resource: AdminResourceConfig): string[] {
	return resource.fields
		.filter((field) => field.type === "tags")
		.map((field) => field.name)
}

/** Field names stored as dates, so the API can coerce them before writing. */
export function dateFields(resource: AdminResourceConfig): string[] {
	return resource.fields
		.filter((field) => field.type === "date")
		.map((field) => field.name)
}

/** Numeric field names, used to coerce empty form values to `null`. */
export function numberFields(resource: AdminResourceConfig): string[] {
	return resource.fields
		.filter((field) => field.type === "number")
		.map((field) => field.name)
}

/** Boolean field names. */
export function booleanFields(resource: AdminResourceConfig): string[] {
	return resource.fields
		.filter((field) => field.type === "checkbox")
		.map((field) => field.name)
}
