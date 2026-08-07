import { z } from "zod"
import { requireSession } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import { delegateFor, idWhere } from "@/lib/admin-data"
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
 * Drag and drop ordering.
 *
 * Like `bulk`, this is a static segment sitting next to the dynamic `[id]`
 * segment, so Next.js can never mistake /api/admin/skills/reorder for a row
 * whose id is literally "reorder".
 */
const reorderSchema = z.object({
	items: z
		.array(
			z.object({
				id: z.string().min(1),
				// Bounded on purpose: `order` feeds an integer column and an
				// unbounded value from the client has no legitimate use.
				order: z.number().int().min(0).max(100000),
			}),
		)
		.min(1)
		// Matches the largest admin page size, and keeps one request from holding
		// the SQLite write lock for an unreasonable time.
		.max(200),
})

export async function POST(request: Request, { params }: Context) {
	try {
		const session = await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const { resource } = await params
		const config = getResource(resource)
		if (!config) return notFound("Bunday bo'lim yo'q")
		if (config.singleton) {
			return fail("Bu bo'limni tartiblab bo'lmaydi", 400)
		}

		// The same check the list page uses to decide whether to show drag
		// handles. Without it, a hand-made request could try to write `order`
		// onto a model that has no such column.
		const hasOrder = config.fields.some((field) => field.name === "order")
		if (!hasOrder) {
			return fail("Bu bo'limda 'order' maydoni yo'q", 400)
		}

		const parsedBody = await readJson(request)
		if (!parsedBody.ok) return parsedBody.response

		const parsed = reorderSchema.safeParse(parsedBody.body)
		if (!parsed.success) return unprocessable(formatZodError(parsed.error))

		const { items } = parsed.data

		// A duplicated id would make the final ordering depend on statement order
		// rather than on what the user dropped, so it is rejected outright.
		const unique = new Set(items.map((item) => item.id))
		if (unique.size !== items.length) {
			return fail("Ro'yxatda takrorlangan ID bor", 400)
		}

		const delegate = delegateFor(config)

		// One transaction: a half-applied reorder would leave the list in an
		// order the user never chose, which is harder to recover from than a
		// clean failure.
		await prisma.$transaction(
			items.map((item) =>
				delegate.update({
					where: idWhere(config, item.id),
					data: { order: item.order },
				}),
			),
		)

		void logActivity({
			action: "update",
			resource,
			label: `${items.length} ta yozuv qayta tartiblandi`,
			actor: session.email,
			headers: request.headers,
		})

		return ok({ count: items.length })
	} catch (error) {
		return handleApiError(error, "api/admin/reorder")
	}
}
