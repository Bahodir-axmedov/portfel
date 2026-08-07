import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
	arrayFields,
	booleanFields,
	dateFields,
	numberFields,
} from "@/lib/resources"
import type { AdminListQuery, AdminResourceConfig } from "@/types"

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Bridges the config-driven admin forms and Prisma.
 *
 * Resources are described declaratively in `src/lib/resources`, so the CRUD
 * routes never hard-code a model name or a column list.
 */

/**
 * Prisma delegate methods return `Prisma.PrismaPromise`, not a plain
 * `Promise`. The distinction matters: `prisma.$transaction([...])` only
 * accepts the branded type, so declaring these as `Promise` forces call sites
 * into casts that silently strip the brand and break the production build.
 * `PrismaPromise<T>` extends `Promise<T>`, so every `await` keeps working.
 */
type Delegate = {
	findMany: (args?: any) => Prisma.PrismaPromise<any[]>
	findUnique: (args: any) => Prisma.PrismaPromise<any>
	findFirst: (args: any) => Prisma.PrismaPromise<any>
	create: (args: any) => Prisma.PrismaPromise<any>
	update: (args: any) => Prisma.PrismaPromise<any>
	updateMany: (args: any) => Prisma.PrismaPromise<{ count: number }>
	delete: (args: any) => Prisma.PrismaPromise<any>
	deleteMany: (args: any) => Prisma.PrismaPromise<{ count: number }>
	count: (args?: any) => Prisma.PrismaPromise<number>
}

/** Resolves the Prisma delegate declared by a resource config. */
export function delegateFor(config: AdminResourceConfig): Delegate {
	const client = prisma as unknown as Record<string, Delegate | undefined>
	const delegate = client[config.model]
	if (!delegate) {
		throw new Error(`Prisma model "${config.model}" topilmadi`)
	}
	return delegate
}

/** Primary-key column for a resource. */
export function idField(config: AdminResourceConfig): "id" | "key" {
	return config.model === "setting" ? "key" : "id"
}

/**
 * `Setting` is keyed by its `key` column and `Profile` is a singleton row;
 * every other model uses a cuid string `id`.
 */
export function idWhere(config: AdminResourceConfig, id: string) {
	if (config.model === "setting") return { key: id }
	if (config.model === "profile") return { id: "main" }
	return { id }
}

/** Relations that must be eager-loaded for a resource. */
export function includeFor(config: AdminResourceConfig) {
	if (config.model === "project") {
		return { include: { technologies: true, images: true } }
	}
	return {}
}

/** True when the model exposes a `published` boolean the UI can toggle. */
export function hasPublishedField(config: AdminResourceConfig): boolean {
	return config.fields.some((field) => field.name === "published")
}

function asArray(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map((item) => String(item).trim()).filter(Boolean)
	}
	if (typeof value === "string" && value.trim()) {
		return value
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean)
	}
	return []
}

/**
 * Turns a validated form payload into Prisma column values.
 * Arrays become JSON strings, empty strings become `null`, dates become `Date`.
 */
export function toPrismaData(
	config: AdminResourceConfig,
	input: Record<string, unknown>,
): Record<string, unknown> {
	const arrays = new Set(arrayFields(config))
	const dates = new Set(dateFields(config))
	const numbers = new Set(numberFields(config))
	const booleans = new Set(booleanFields(config))
	const data: Record<string, unknown> = {}

	for (const [key, value] of Object.entries(input)) {
		if (value === undefined) continue
		// Relations are connected separately.
		if (key === "technologies") continue

		if (arrays.has(key)) {
			const list = asArray(value)
			data[key] = list.length ? JSON.stringify(list) : null
			continue
		}
		if (dates.has(key)) {
			if (!value) {
				data[key] = null
				continue
			}
			// An invalid date string produced `Invalid Date`, which Prisma then
			// rejected with an opaque driver error. Treat it as "not set".
			const parsed = new Date(String(value))
			data[key] = Number.isNaN(parsed.getTime()) ? null : parsed
			continue
		}
		if (numbers.has(key)) {
			if (value === "" || value === null) {
				data[key] = null
				continue
			}
			const parsed = Number(value)
			data[key] = Number.isFinite(parsed) ? parsed : null
			continue
		}
		if (booleans.has(key)) {
			data[key] = value === "on" ? true : Boolean(value)
			continue
		}
		data[key] = value === "" ? null : value
	}

	return data
}

/** Builds the nested write that links a project to its technologies. */
export function technologyConnect(value: unknown) {
	const names = asArray(value)
	return {
		set: [],
		connectOrCreate: names.map((name) => ({
			where: { name },
			create: { name },
		})),
	}
}

/** Converts a database row back into values the admin form can render. */
export function toFormValues(
	config: AdminResourceConfig,
	row: Record<string, unknown> | null,
): Record<string, unknown> {
	if (!row) return {}
	const arrays = new Set(arrayFields(config))
	const dates = new Set(dateFields(config))
	const values: Record<string, unknown> = {}

	for (const [key, value] of Object.entries(row)) {
		if (arrays.has(key)) {
			if (typeof value === "string" && value.startsWith("[")) {
				try {
					values[key] = JSON.parse(value)
					continue
				} catch {
					values[key] = []
					continue
				}
			}
			values[key] = value ? asArray(value) : []
			continue
		}
		if (dates.has(key) && value instanceof Date) {
			values[key] = value.toISOString().slice(0, 10)
			continue
		}
		if (key === "technologies" && Array.isArray(value)) {
			values[key] = value.map((item: { name?: string }) => item?.name ?? "")
			continue
		}
		values[key] = value
	}

	return values
}

/**
 * Case variants of a search term.
 *
 * Prisma's `mode: "insensitive"` is not supported by the SQLite connector, and
 * SQLite's built-in `LIKE` only folds case for ASCII — so searching "Сайт"
 * never matched a row stored as "сайт". ORing a few explicit variants covers
 * Cyrillic and Latin input without dropping to raw SQL.
 */
function caseVariants(term: string): string[] {
	const lower = term.toLocaleLowerCase()
	const upper = term.toLocaleUpperCase()
	const title = lower.charAt(0).toLocaleUpperCase() + lower.slice(1)
	return Array.from(new Set([term, lower, upper, title]))
}

/** `where` clause for the list view search box. */
export function searchWhere(config: AdminResourceConfig, term: string) {
	const trimmed = term.trim()
	if (!trimmed || !config.searchable?.length) return undefined

	const variants = caseVariants(trimmed)
	const clauses: Array<Record<string, unknown>> = []

	for (const field of config.searchable) {
		for (const variant of variants) {
			clauses.push({ [field]: { contains: variant } })
		}
	}

	return { OR: clauses }
}

/** Full `where` for a list request: search box + published filter. */
export function listWhere(
	config: AdminResourceConfig,
	query: AdminListQuery,
): Record<string, unknown> | undefined {
	const clauses: Array<Record<string, unknown>> = []

	const search = searchWhere(config, query.term)
	if (search) clauses.push(search)

	if (query.published !== undefined && hasPublishedField(config)) {
		clauses.push({ published: query.published })
	}

	if (clauses.length === 0) return undefined
	if (clauses.length === 1) return clauses[0]
	return { AND: clauses }
}

/**
 * `orderBy` for a list request.
 *
 * A secondary key is always appended so pagination is deterministic: with a
 * single non-unique sort column (`order`, `category`, …) SQLite may return
 * rows in a different sequence per query, which makes rows appear twice on one
 * page and vanish from another.
 */
export function listOrderBy(
	config: AdminResourceConfig,
	query: AdminListQuery,
): Array<Record<string, "asc" | "desc">> {
	const key = idField(config)
	const primary = query.sort ?? config.defaultSort?.field

	if (!primary || primary === key) return [{ [key]: query.direction }]
	return [{ [primary]: query.direction }, { [key]: "asc" }]
}

/** Columns that must never be copied when cloning a row. */
const NON_COPYABLE = new Set(["id", "key", "createdAt", "updatedAt"])

/**
 * Prepares a row for duplication.
 *
 * Unique text columns get a " (nusxa)" suffix so the clone does not collide
 * with the original, and the copy is always created unpublished so a
 * half-finished duplicate can never appear on the public site.
 */
export function duplicateData(
	config: AdminResourceConfig,
	row: Record<string, unknown>,
): Record<string, unknown> {
	const data: Record<string, unknown> = {}
	const suffix = `-copy-${Date.now().toString(36).slice(-4)}`

	for (const [column, value] of Object.entries(row)) {
		if (NON_COPYABLE.has(column)) continue
		if (value === null || typeof value === "object") {
			// Skip eager-loaded relations (arrays / nested objects); Date values
			// are re-added below.
			if (value instanceof Date) data[column] = value
			else if (value === null) data[column] = null
			continue
		}
		data[column] = value
	}

	if (typeof data.slug === "string") data.slug = `${data.slug}${suffix}`
	if (typeof data.title === "string") data.title = `${data.title} (nusxa)`
	if (typeof data.name === "string") data.name = `${data.name} (nusxa)`
	if (typeof data.label === "string") data.label = `${data.label} (nusxa)`
	if (hasPublishedField(config)) data.published = false

	return data
}
