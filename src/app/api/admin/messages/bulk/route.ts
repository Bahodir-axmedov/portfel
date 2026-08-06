import { z } from "zod"
import { requireSession } from "@/lib/auth"
import {
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

/**
 * `ids` is optional for the read/unread actions so the inbox can offer a
 * "mark everything as read" button without shipping thousands of ids to the
 * server just to name them.
 */
const schema = z.object({
	action: z.enum(["read", "unread", "archive", "unarchive", "delete"]),
	ids: z.array(z.string().min(1)).max(500).optional(),
	all: z.boolean().optional(),
})

export async function POST(request: Request) {
	try {
		await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const parsedBody = await readJson(request)
		if (!parsedBody.ok) return parsedBody.response

		const parsed = schema.safeParse(parsedBody.body)
		if (!parsed.success) return unprocessable(formatZodError(parsed.error))

		const { action, ids, all } = parsed.data

		// "Delete everything" is never implicit — an explicit id list is required
		// so a malformed request cannot wipe the inbox.
		if (!ids?.length && !all) return ok({ action, count: 0 })
		if (action === "delete" && !ids?.length) return ok({ action, count: 0 })

		const where = ids?.length ? { id: { in: ids } } : {}

		if (action === "delete") {
			const result = await prisma.contactMessage.deleteMany({ where })
			return ok({ action, count: result.count })
		}

		const data =
			action === "read"
				? { read: true }
				: action === "unread"
					? { read: false }
					: action === "archive"
						? { archived: true }
						: { archived: false }

		const result = await prisma.contactMessage.updateMany({ where, data })
		return ok({ action, count: result.count })
	} catch (error) {
		return handleApiError(error, "api/admin/messages/bulk")
	}
}
