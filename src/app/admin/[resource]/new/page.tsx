import { notFound } from "next/navigation"
import { AdminShell } from "@/components/admin/AdminShell"
import { ResourceForm } from "@/components/admin/ResourceForm"
import { getResource } from "@/lib/resources"

export const dynamic = "force-dynamic"

export default async function NewResourcePage({
	params,
}: {
	params: Promise<{ resource: string }>
}) {
	const { resource } = await params
	const config = getResource(resource)

	if (!config || config.singleton) notFound()

	return (
		<AdminShell
			title={`Yangi ${config.singular.toLowerCase()}`}
			description={config.label}
		>
			<ResourceForm config={config} />
		</AdminShell>
	)
}
