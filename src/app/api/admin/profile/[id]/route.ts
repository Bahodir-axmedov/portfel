import { requireSession } from "@/lib/auth"
import {
	handleApiError,
	ok,
	readJson,
	requireSameOrigin,
	unprocessable,
} from "@/lib/api"
import { toFormValues, toPrismaData } from "@/lib/admin-data"
import { prisma } from "@/lib/prisma"
import { profileResource } from "@/lib/resources"
import { formatZodError, profileSchema } from "@/lib/validators"
import type { Prisma } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * The profile is a singleton row (`id: "main"`), so it gets its own route
 * instead of going through the generic /api/admin/[resource] handler.
 */
export async function GET() {
	try {
		await requireSession()
		const row = await prisma.profile.findUnique({ where: { id: "main" } })
		return ok({ row: toFormValues(profileResource, row) })
	} catch (error) {
		return handleApiError(error, "api/admin/profile")
	}
}

export async function PATCH(request: Request) {
	try {
		await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const parsedBody = await readJson(request)
		if (!parsedBody.ok) return parsedBody.response

		const parsed = profileSchema.safeParse(parsedBody.body)
		if (!parsed.success) return unprocessable(formatZodError(parsed.error))

		const data = toPrismaData(
			profileResource,
			parsed.data as Record<string, unknown>,
		)

		// Narrowed to the generated Prisma input types instead of the previous
		// blanket `as any` + file-level eslint-disable, so a renamed column is
		// now a compile error rather than a runtime one.
		const row = await prisma.profile.upsert({
			where: { id: "main" },
			update: data as Prisma.ProfileUpdateInput,
			create: { ...data, id: "main" } as Prisma.ProfileCreateInput,
		})

		return ok({ row: toFormValues(profileResource, row) })
	} catch (error) {
		return handleApiError(error, "api/admin/profile")
	}
}
