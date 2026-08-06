import Link from "next/link"
import { notFound } from "next/navigation"
import { AdminShell } from "@/components/admin/AdminShell"
import { DataTable, type TableColumn } from "@/components/admin/DataTable"
import { Icon } from "@/components/ui/Icon"
import {
	delegateFor,
	hasPublishedField,
	idField,
	includeFor,
	listOrderBy,
	listWhere,
	toFormValues,
} from "@/lib/admin-data"
import { parseListQuery } from "@/lib/api"
import { getResource } from "@/lib/resources"

export const dynamic = "force-dynamic"

type SearchParams = Record<string, string | string[] | undefined>

/** Rebuilds a URL so `parseListQuery` can validate the incoming parameters. */
function toUrl(searchParams: SearchParams): URL {
	const params = new URLSearchParams()
	for (const [key, value] of Object.entries(searchParams)) {
		if (typeof value === "string") params.set(key, value)
		else if (Array.isArray(value) && value[0]) params.set(key, value[0])
	}
	// Base is irrelevant: only the query string is read.
	return new URL(`http:${"//"}local/?${params.toString()}`)
}

export default async function ResourceListPage({
	params,
	searchParams,
}: {
	params: Promise<{ resource: string }>
	searchParams: Promise<SearchParams>
}) {
	const { resource } = await params
	const rawSearch = await searchParams
	const config = getResource(resource)

	if (!config || config.singleton) notFound()

	const query = parseListQuery(toUrl(rawSearch), config)
	const delegate = delegateFor(config)
	const where = listWhere(config, query)

	// Count and page fetched together; the list is never loaded unbounded.
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

	const items = rows.map((row) => toFormValues(config, row))
	const pageCount = Math.max(1, Math.ceil(total / query.pageSize))

	// Only scalar columns are sortable — ordering by a JSON-encoded tag list or
	// a relation array is not something SQLite can do.
	const unsortable = new Set(["tags", "relation", "image", "file", "richtext"])
	const columns: TableColumn[] = config.columns.map((column) => ({
		name: column.name,
		label: column.label,
		type: column.type,
		sortable: !unsortable.has(column.type ?? "text"),
	}))

	const publishedParam = rawSearch.published
	const publishedFilter =
		publishedParam === "true" || publishedParam === "false"
			? publishedParam
			: "all"

	const draftCount = hasPublishedField(config)
		? await delegate.count({ where: { published: false } })
		: 0

	return (
		<AdminShell
			title={config.label}
			description={
				draftCount > 0
					? `${total} ta yozuv · ${draftCount} ta qoralama`
					: `${total} ta yozuv`
			}
			actions={
				<Link
					href={`/admin/${config.key}/new`}
					className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-gradient px-4 text-sm font-medium text-white shadow-glow transition hover:opacity-95"
				>
					<Icon name="Sparkles" className="h-4 w-4" />
					Yangi qo&apos;shish
				</Link>
			}
		>
			<DataTable
				resourceKey={config.key}
				singular={config.singular}
				columns={columns}
				rows={items}
				idKey={idField(config)}
				hasPublished={hasPublishedField(config)}
				hasOrder={config.fields.some((field) => field.name === "order")}
				searchable={Boolean(config.searchable?.length)}
				page={query.page}
				pageSize={query.pageSize}
				pageCount={pageCount}
				total={total}
				sort={query.sort ?? null}
				direction={query.direction}
				term={query.term}
				publishedFilter={publishedFilter}
			/>
		</AdminShell>
	)
}
