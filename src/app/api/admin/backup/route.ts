import { z } from "zod"
import { requireSession } from "@/lib/auth"
import {
	handleApiError,
	ok,
	readJson,
	requireSameOrigin,
	unprocessable,
} from "@/lib/api"
import { delegateFor, includeFor } from "@/lib/admin-data"
import { prisma } from "@/lib/prisma"
import { adminResources, getResource } from "@/lib/resources"
import { formatZodError } from "@/lib/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKUP_VERSION = 1

/**
 * Full content export / import.
 *
 * The whole site lives in one SQLite file on a Railway volume. Without an
 * export there is no way to take a copy off the platform, and no way to move
 * content between a local machine and production. This produces a single
 * self-describing JSON document containing every editable row.
 */
export async function GET() {
	try {
		await requireSession()

		const data: Record<string, unknown> = {}

		for (const config of adminResources) {
			const rows = await delegateFor(config).findMany({
				...includeFor(config),
			})
			data[config.key] = rows
		}

		data.profile = await prisma.profile.findUnique({ where: { id: "main" } })
		data.messages = await prisma.contactMessage.findMany({
			orderBy: { createdAt: "desc" },
			take: 2000,
		})

		const payload = {
			version: BACKUP_VERSION,
			exportedAt: new Date().toISOString(),
			data,
		}

		const filename = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`

		return new Response(JSON.stringify(payload, null, 2), {
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Content-Disposition": `attachment; filename="${filename}"`,
				"Cache-Control": "no-store",
			},
		})
	} catch (error) {
		return handleApiError(error, "api/admin/backup")
	}
}

const importSchema = z.object({
	version: z.number().int().min(1).max(BACKUP_VERSION),
	data: z.record(z.string(), z.unknown()),
	/** Explicit opt-in — an import replaces existing rows. */
	confirm: z.literal(true),
	/** Only these sections are restored. Empty means "everything". */
	sections: z.array(z.string()).optional(),
})

/** Restores rows from a previously exported backup. */
export async function POST(request: Request) {
	try {
		await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const parsedBody = await readJson(request)
		if (!parsedBody.ok) return parsedBody.response

		const parsed = importSchema.safeParse(parsedBody.body)
		if (!parsed.success) return unprocessable(formatZodError(parsed.error))

		const { data, sections } = parsed.data
		const wanted = sections?.length ? new Set(sections) : null
		const restored: Record<string, number> = {}
		const skipped: string[] = []

		for (const [key, value] of Object.entries(data)) {
			if (wanted && !wanted.has(key)) continue
			if (!Array.isArray(value)) continue

			const config = getResource(key)
			if (!config) {
				skipped.push(key)
				continue
			}

			const delegate = delegateFor(config)
			let count = 0

			for (const raw of value) {
				if (!raw || typeof raw !== "object") continue

				// Relations are re-linked by the normal editor, not by the import,
				// so nested objects and arrays are dropped rather than guessed at.
				const row: Record<string, unknown> = {}
				for (const [column, columnValue] of Object.entries(
					raw as Record<string, unknown>,
				)) {
					if (Array.isArray(columnValue)) continue
					if (columnValue !== null && typeof columnValue === "object") continue
					row[column] = columnValue
				}

				const identifier =
					config.model === "setting" ? row.key : row.id
				if (typeof identifier !== "string" || !identifier) continue

				const where =
					config.model === "setting"
						? { key: identifier }
						: { id: identifier }

				// Upsert keeps the operation idempotent: re-importing the same file
				// twice produces the same database instead of duplicate rows.
				await delegate.update({ where, data: row }).catch(async () => {
					await delegate.create({ data: row })
				})
				count += 1
			}

			restored[key] = count
		}

		if ((!wanted || wanted.has("profile")) && data.profile) {
			const profile = data.profile as Record<string, unknown>
			const clean: Record<string, unknown> = {}
			for (const [column, columnValue] of Object.entries(profile)) {
				if (Array.isArray(columnValue)) continue
				if (columnValue !== null && typeof columnValue === "object") continue
				clean[column] = columnValue
			}
			clean.id = "main"
			await prisma.profile.upsert({
				where: { id: "main" },
				update: clean,
				create: clean as never,
			})
			restored.profile = 1
		}

		return ok({ restored, skipped })
	} catch (error) {
		return handleApiError(error, "api/admin/backup")
	}
}
