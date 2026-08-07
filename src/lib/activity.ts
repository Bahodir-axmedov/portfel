import "server-only"
import { prisma } from "./prisma"
import { clientIp } from "./rate-limit"

/**
 * Admin audit trail.
 *
 * Every write goes through `logActivity`, which is deliberately impossible to
 * fail: an audit log that can break a save is worse than no audit log at all.
 * Errors are swallowed and the caller never awaits a rejection.
 */

export type ActivityAction =
	"create" | "update" | "delete" | "login" | "logout" | "upload" | "restore"

export type ActivityInput = {
	action: ActivityAction
	resource: string
	entityId?: string | null
	label?: string | null
	actor: string
	/** Request headers, so the helper can derive the IP itself. */
	headers?: Headers
}

/** Longest label kept, so a pasted article body cannot bloat the log table. */
const LABEL_LIMIT = 120

function trim(value: string | null | undefined): string | null {
	if (!value) return null
	const clean = value.replace(/\s+/g, " ").trim()
	if (!clean) return null
	return clean.length > LABEL_LIMIT
		? `${clean.slice(0, LABEL_LIMIT - 1)}…`
		: clean
}

/**
 * Records one admin action.
 *
 * Returns `void` and never rejects. Call sites may `void` it to avoid adding
 * a database round trip to the response path.
 */
export async function logActivity(input: ActivityInput): Promise<void> {
	try {
		await prisma.activityLog.create({
			data: {
				action: input.action,
				resource: input.resource,
				entityId: input.entityId ?? null,
				label: trim(input.label),
				actor: input.actor,
				ip: input.headers ? clientIp(input.headers) : null,
			},
		})
	} catch {
		// Auditing must never break the operation it is auditing.
	}
}

/**
 * Best-effort human label for an arbitrary admin row.
 *
 * The log is written from the generic `[resource]` routes, which have no idea
 * whether a row calls its display field `title`, `name` or `key`. Falling back
 * through the known candidates keeps the log readable without teaching this
 * module about all seventeen resources.
 */
export function rowLabel(row: unknown): string | null {
	if (!row || typeof row !== "object") return null
	const record = row as Record<string, unknown>
	for (const field of ["title", "name", "label", "question", "key", "slug"]) {
		const value = record[field]
		if (typeof value === "string" && value.trim()) return value
	}
	return null
}

/** Primary key of an admin row, which is `key` for settings and `id` elsewhere. */
export function rowId(row: unknown): string | null {
	if (!row || typeof row !== "object") return null
	const record = row as Record<string, unknown>
	if (typeof record.id === "string") return record.id
	if (typeof record.key === "string") return record.key
	return null
}

export type ActivityFilter = {
	resource?: string
	action?: string
	limit?: number
	skip?: number
}

/** Hard ceiling so a crafted query string cannot ask for the whole table. */
const MAX_LIMIT = 100

export async function getActivityLogs(filter: ActivityFilter = {}) {
	const take = Math.min(Math.max(filter.limit ?? 50, 1), MAX_LIMIT)
	const skip = Math.max(filter.skip ?? 0, 0)

	const where = {
		...(filter.resource ? { resource: filter.resource } : {}),
		...(filter.action ? { action: filter.action } : {}),
	}

	// One round trip for both the page and the count; the admin list needs the
	// total to render pagination and a second sequential query would double the
	// latency of every page change.
	const [rows, total] = await Promise.all([
		prisma.activityLog.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take,
			skip,
		}),
		prisma.activityLog.count({ where }),
	])

	return { rows, total, take, skip }
}

/** Distinct resource keys present in the log, for the filter dropdown. */
export async function getActivityResources(): Promise<string[]> {
	try {
		const rows = await prisma.activityLog.findMany({
			distinct: ["resource"],
			select: { resource: true },
			orderBy: { resource: "asc" },
		})
		return rows.map((row) => row.resource)
	} catch {
		return []
	}
}

/**
 * Drops entries older than `days`.
 *
 * The database lives on a small Railway volume, so an unbounded audit table
 * would eventually be the largest thing on disk. Called opportunistically from
 * the activity page rather than on a schedule, since this deployment has no
 * cron.
 */
export async function pruneOldActivity(days = 120): Promise<void> {
	try {
		const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
		await prisma.activityLog.deleteMany({
			where: { createdAt: { lt: cutoff } },
		})
	} catch {
		// Housekeeping only.
	}
}
