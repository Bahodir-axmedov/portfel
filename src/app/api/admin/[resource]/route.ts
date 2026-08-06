import { requireSession } from "@/lib/auth"
import {
	delegateFor,
	includeFor,
	listOrderBy,
	listWhere,
	technologyConnect,
	toFormValues,
	toPrismaData,
} from "@/lib/admin-data"
import {
	handleApiError,
	notFound,
	ok,
	parseListQuery,
	readJson,
	requireSameOrigin,
	unprocessable,
} from "@/lib/api"
import { getResource } from "@/lib/resources"
import { formatZodError, resourceSchemas } from "@/lib/validators"
import type { ResourceName } from "@/lib/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Context = { params: Promise<{ resource: string }> }

function schemaFor(key: string) {
	return resourceSchemas[key as ResourceName]
}

/**
 * Lists rows for the admin table.
 *
 * Paginated, sortable and filterable server-side. The previous version issued
 * an unbounded `findMany()` — with `include: { technologies, images }` on
 * projects — so every list load transferred the entire table plus all of its
 * relations. That is fine with 20 rows and fatal with 20 000.
 */
export async function GET(request: Request, { params }: Context) {
	try {
		await requireSession()
		const { resource } = await params
		const config = getResource(resource)
		if (!config) return notFound("Bunday bo'lim yo'q")

		const query = parseListQuery(new URL(request.url), config)
		const delegate = delegateFor(config)
		const where = listWhere(config, query)

		// One round-trip for the page and one for the count, in parallel.
		const [total, rows] = await Promise.all([
			delegate.count({ where }),
			delegate.findMany({
				where,
				orderBy: listOrderBy(config, query),
				skip: (query.page - 1) * query.pageSize,
				take: query.pageSize,
				...includeFor(config),
			}),
		])

		return ok({
			resource: config.key,
			rows: rows.map((row) => toFormValues(config, row)),
			total,
			page: query.page,
			pageSize: query.pageSize,
			pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
			sort: query.sort ?? null,
			direction: query.direction,
		})
	} catch (error) {
		return handleApiError(error, "api/admin/list")
	}
}

/** Creates a new row. */
export async function POST(request: Request, { params }: Context) {
	try {
		await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const { resource } = await params
		const config = getResource(resource)
		const schema = schemaFor(resource)
		if (!config || !schema) return notFound("Bunday bo'lim yo'q")

		const parsedBody = await readJson(request)
		if (!parsedBody.ok) return parsedBody.response

		const parsed = schema.safeParse(parsedBody.body)
		if (!parsed.success) return unprocessable(formatZodError(parsed.error))

		const input = parsed.data as Record<string, unknown>
		const data = toPrismaData(config, input)

		if (config.model === "project" && "technologies" in input) {
			data.technologies = technologyConnect(input.technologies)
		}

		const created = await delegateFor(config).create({ data })

		return ok({ row: toFormValues(config, created) }, { status: 201 })
	} catch (error) {
		return handleApiError(error, "api/admin/create")
	}
}
