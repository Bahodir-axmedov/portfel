import { z } from "zod"
import { requireSession } from "@/lib/auth"
import {
	delegateFor,
	duplicateData,
	hasPublishedField,
	idField,
	includeFor,
} from "@/lib/admin-data"
import {
	fail,
	handleApiError,
	notFound,
	ok,
	readJson,
	requireSameOrigin,
	unprocessable,
} from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { getResource } from "@/lib/resources"
import { formatZodError } from "@/lib/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Context = { params: Promise<{ resource: string }> }

/**
 * A static `bulk` segment sits next to the dynamic `[id]` segment. Next.js
 * always matches the static one first, so /api/admin/projects/bulk can never
 * be mistaken for a row whose id is literally "bulk".
 */
const bulkSchema = z.object({
	action: z.enum(["delete", "publish", "unpublish", "duplicate"]),
	// Capped so one request cannot lock the SQLite file for minutes.
	ids: z.array(z.string().min(1)).min(1).max(200),
})

export async function POST(request: Request, { params }: Context) {
	try {
		await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const { resource } = await params
		const config = getResource(resource)
		if (!config) return notFound("Bunday bo'lim yo'q")
		if (config.singleton) {
			return fail("Bu bo'limda ommaviy amal mavjud emas", 400)
		}

		const parsedBody = await readJson(request)
		if (!parsedBody.ok) return parsedBody.response

		const parsed = bulkSchema.safeParse(parsedBody.body)
		if (!parsed.success) return unprocessable(formatZodError(parsed.error))

		const { action, ids } = parsed.data
		const delegate = delegateFor(config)
		const key = idField(config)
		const where = { [key]: { in: ids } }

		if (action === "delete") {
			const result = await delegate.deleteMany({ where })
			return ok({ action, count: result.count })
		}

		if (action === "publish" || action === "unpublish") {
			if (!hasPublishedField(config)) {
				return fail("Bu bo'limda 'published' maydoni yo'q", 400)
			}
			const result = await delegate.updateMany({
				where,
				data: { published: action === "publish" },
			})
			return ok({ action, count: result.count })
		}

		// duplicate
		const rows = await delegate.findMany({ where, ...includeFor(config) })
		if (rows.length === 0) return ok({ action, count: 0 })

		// One transaction: either every clone lands or none does, so a failure
		// halfway through cannot leave the list in a partially duplicated state.
		const created = await prisma.$transaction(
			rows.map((row: Record<string, unknown>) => {
				const data = duplicateData(config, row)
				if (config.model === "project" && Array.isArray(row.technologies)) {
					data.technologies = {
						connect: (row.technologies as Array<{ id: string }>).map(
							(technology) => ({ id: technology.id }),
						),
					}
				}
				return delegate.create({ data }) as unknown as Promise<unknown>
			}),
		)

		return ok({ action, count: created.length })
	} catch (error) {
		return handleApiError(error, "api/admin/bulk")
	}
}
