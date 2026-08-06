import { z } from "zod"
import { requireSession } from "@/lib/auth"
import { delegateFor, idField } from "@/lib/admin-data"
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
 * Dedicated endpoint for the `order` column.
 *
 * The generic PATCH validates the *entire* resource schema, so changing one
 * number would require the client to round-trip and resend every field — and
 * would fail validation if any unrelated required field were empty. Ordering
 * gets its own narrow contract instead.
 */
const reorderSchema = z.object({
	items: z
		.array(
			z.object({
				id: z.string().min(1),
				order: z.number().int().min(0).max(100000),
			}),
		)
		.min(1)
		.max(500),
})

export async function POST(request: Request, { params }: Context) {
	try {
		await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const { resource } = await params
		const config = getResource(resource)
		if (!config) return notFound("Bunday bo'lim yo'q")

		if (!config.fields.some((field) => field.name === "order")) {
			return fail("Bu bo'limda tartib maydoni yo'q", 400)
		}

		const parsedBody = await readJson(request)
		if (!parsedBody.ok) return parsedBody.response

		const parsed = reorderSchema.safeParse(parsedBody.body)
		if (!parsed.success) return unprocessable(formatZodError(parsed.error))

		const delegate = delegateFor(config)
		const key = idField(config)

		// A single transaction so the list can never be observed half-reordered.
		await prisma.$transaction(
			parsed.data.items.map(
				(item) =>
					delegate.update({
						where: { [key]: item.id },
						data: { order: item.order },
					}) as unknown as Promise<unknown>,
			),
		)

		return ok({ count: parsed.data.items.length })
	} catch (error) {
		return handleApiError(error, "api/admin/reorder")
	}
}
