import { z } from "zod"
import { requireSession } from "@/lib/auth"
import {
	fail,
	handleApiError,
	ok,
	readJson,
	requireSameOrigin,
	unprocessable,
} from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { formatZodError } from "@/lib/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Context = { params: Promise<{ id: string }> }

/**
 * Explicit schema instead of ad-hoc `typeof body.read === "boolean"` checks:
 * `.refine` guarantees the request actually asks for a change, so an empty
 * body can no longer produce a no-op `update({ data: {} })` that still bumps
 * `updatedAt` and answers 200 as if something happened.
 */
const messagePatchSchema = z
	.object({
		read: z.boolean().optional(),
		archived: z.boolean().optional(),
	})
	.refine((value) => value.read !== undefined || value.archived !== undefined, {
		message: "read yoki archived maydoni kerak",
		path: ["read"],
	})

/** Toggles the read / archived flags on a contact message. */
export async function PATCH(request: Request, { params }: Context) {
	try {
		await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const { id } = await params
		if (!id) return fail("ID ko'rsatilmagan", 400)

		const parsedBody = await readJson(request)
		if (!parsedBody.ok) return parsedBody.response

		const parsed = messagePatchSchema.safeParse(parsedBody.body)
		if (!parsed.success) return unprocessable(formatZodError(parsed.error))

		const row = await prisma.contactMessage.update({
			where: { id },
			data: parsed.data,
		})

		return ok({ row })
	} catch (error) {
		return handleApiError(error, "api/admin/messages")
	}
}

export async function DELETE(request: Request, { params }: Context) {
	try {
		await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const { id } = await params
		if (!id) return fail("ID ko'rsatilmagan", 400)

		await prisma.contactMessage.delete({ where: { id } })
		return ok({ id })
	} catch (error) {
		return handleApiError(error, "api/admin/messages")
	}
}
