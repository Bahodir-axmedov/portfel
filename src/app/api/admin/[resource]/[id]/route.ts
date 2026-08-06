import { requireSession } from "@/lib/auth"
import {
	delegateFor,
	idWhere,
	includeFor,
	technologyConnect,
	toFormValues,
	toPrismaData,
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
import { getResource } from "@/lib/resources"
import { formatZodError, resourceSchemas } from "@/lib/validators"
import type { ResourceName } from "@/lib/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Context = { params: Promise<{ resource: string; id: string }> }

/** Loads a single row for the edit form. */
export async function GET(_request: Request, { params }: Context) {
	try {
		await requireSession()
		const { resource, id } = await params
		const config = getResource(resource)
		if (!config) return notFound()
		if (!id) return fail("ID ko'rsatilmagan", 400)

		const row = await delegateFor(config).findUnique({
			where: idWhere(config, id),
			...includeFor(config),
		})

		if (!row) return notFound()
		return ok({ row: toFormValues(config, row) })
	} catch (error) {
		return handleApiError(error, "api/admin/read")
	}
}

/** Updates an existing row. */
export async function PATCH(request: Request, { params }: Context) {
	try {
		await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const { resource, id } = await params
		const config = getResource(resource)
		const schema = resourceSchemas[resource as ResourceName]
		if (!config || !schema) return notFound()
		if (!id) return fail("ID ko'rsatilmagan", 400)

		const parsedBody = await readJson(request)
		if (!parsedBody.ok) return parsedBody.response

		const parsed = schema.safeParse(parsedBody.body)
		if (!parsed.success) return unprocessable(formatZodError(parsed.error))

		const input = parsed.data as Record<string, unknown>
		const data = toPrismaData(config, input)

		if (config.model === "project" && "technologies" in input) {
			data.technologies = technologyConnect(input.technologies)
		}

		const updated = await delegateFor(config).update({
			where: idWhere(config, id),
			data,
		})

		return ok({ row: toFormValues(config, updated) })
	} catch (error) {
		return handleApiError(error, "api/admin/update")
	}
}

/** Deletes a row. */
export async function DELETE(request: Request, { params }: Context) {
	try {
		await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const { resource, id } = await params
		const config = getResource(resource)
		if (!config) return notFound()
		if (!id) return fail("ID ko'rsatilmagan", 400)

		await delegateFor(config).delete({ where: idWhere(config, id) })
		return ok({ id })
	} catch (error) {
		return handleApiError(error, "api/admin/delete")
	}
}
