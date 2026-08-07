import { notFound } from "next/navigation"
import { AdminShell } from "@/components/admin/AdminShell"
import { ResourceForm } from "@/components/admin/ResourceForm"
import { delegateFor, idWhere, toFormValues } from "@/lib/admin-data"
import { getResource } from "@/lib/resources"

export const dynamic = "force-dynamic"

export default async function EditResourcePage({
	params,
}: {
	params: Promise<{ resource: string; id: string }>
}) {
	const { resource, id } = await params
	const config = getResource(resource)

	if (!config || config.singleton) notFound()

	const row = await delegateFor(config).findUnique({
		where: idWhere(config, id),
		...(config.model === "project" ? { include: { technologies: true } } : {}),
	})

	if (!row) notFound()

	const values = toFormValues(config, row)
	const heading =
		(typeof values.title === "string" && values.title) ||
		(typeof values.name === "string" && values.name) ||
		(typeof values.label === "string" && values.label) ||
		(typeof values.company === "string" && values.company) ||
		(typeof values.author === "string" && values.author) ||
		config.singular

	return (
		<AdminShell title={heading} description={`${config.label} — tahrirlash`}>
			<ResourceForm config={config} initial={values} id={id} />
		</AdminShell>
	)
}
