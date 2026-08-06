import type { Locale } from "@/i18n/routing"

/**
 * Shared application types.
 *
 * These deliberately avoid importing generated Prisma types so the file stays
 * valid before `prisma generate` has run.
 */

/** Any database row loaded by the query layer. */
export type Row = Record<string, unknown> & { id: string }

/** One Zod issue, flattened for the admin forms. */
export type FieldError = { field: string; message: string }

/**
 * Uniform JSON shape returned by every API route.
 *
 * `fieldErrors` used to be typed as `Record<string, string>` while
 * `formatZodError` actually returns `Array<{ field, message }>`, and
 * `ResourceForm` iterates it as an array. The type now matches the runtime
 * contract, so a consumer that trusts it cannot be silently wrong.
 */
export type ApiSuccess<T> = { ok: true } & T
export type ApiFailure = {
	ok: false
	error?: string
	fieldErrors?: FieldError[]
}
export type ApiResult<T> = ApiSuccess<T> | ApiFailure

/** Envelope returned by every paginated admin list endpoint. */
export type Paginated<T> = {
	rows: T[]
	total: number
	page: number
	pageSize: number
	pageCount: number
}

/** Props shared by every localised route segment. */
export type LocaleParams = { params: Promise<{ locale: Locale }> }
export type LocaleSlugParams = {
	params: Promise<{ locale: Locale; slug: string }>
}

/**
 * Session payload stored in the signed admin cookie.
 *
 * Re-exported from `auth-edge` rather than redeclared: the two copies had
 * drifted apart (this one required a `sub` claim that is never issued), so
 * anything importing the wrong one got a type that does not match reality.
 */
export type { SessionPayload } from "@/lib/auth-edge"

/** Field kinds understood by the config-driven admin forms. */
export type AdminFieldType =
	| "text"
	| "textarea"
	| "richtext"
	| "number"
	| "checkbox"
	| "select"
	| "date"
	| "image"
	| "file"
	| "tags"
	| "icon"
	| "color"
	| "relation"

export type AdminField = {
	name: string
	label: string
	type: AdminFieldType
	/** Marks the Russian / English translation of a base field. */
	translationOf?: string
	options?: Array<{ value: string; label: string }>
	placeholder?: string
	help?: string
	required?: boolean
	min?: number
	max?: number
	step?: number
	rows?: number
	group?: string
	/** Relation targets, e.g. "technologies". */
	relation?: string
}

export type SortDirection = "asc" | "desc"

export type AdminResourceConfig = {
	key: string
	label: string
	singular: string
	icon: string
	/** Prisma delegate name, e.g. "project". */
	model: string
	/** Columns shown in the list view. */
	columns: Array<{ name: string; label: string; type?: AdminFieldType }>
	fields: AdminField[]
	defaultSort?: { field: string; direction: SortDirection }
	/** Singleton resources (profile, settings) hide the list view. */
	singleton?: boolean
	searchable?: string[]
}

/** Parsed `?page=&pageSize=&sort=&dir=&q=&filter=` for an admin list view. */
export type AdminListQuery = {
	page: number
	pageSize: number
	sort?: string
	direction: SortDirection
	term: string
	published?: boolean
}

/** Bulk operations exposed by the admin list toolbar. */
export type BulkAction = "delete" | "publish" | "unpublish" | "duplicate"

/** Upload response shared by the media picker and the API route. */
export type UploadResult = {
	url: string
	name: string
	size: number
	type: string
	width?: number
	height?: number
}

/** Public contact form payload. */
export type ContactPayload = {
	name: string
	email: string
	subject?: string
	message: string
}
