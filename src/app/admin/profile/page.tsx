import { AdminShell } from "@/components/admin/AdminShell"
import { ResourceForm } from "@/components/admin/ResourceForm"
import { toFormValues } from "@/lib/admin-data"
import { prisma } from "@/lib/prisma"
import { profileResource } from "@/lib/resources"

export const dynamic = "force-dynamic"

export default async function AdminProfilePage() {
	const row = await prisma.profile.findUnique({ where: { id: "main" } })

	return (
		<AdminShell
			title="Profil"
			description="Hero, About, Contact va SEO bo'limlari shu ma'lumotlardan foydalanadi"
		>
			<ResourceForm
				config={profileResource}
				initial={toFormValues(profileResource, row)}
				id="main"
			/>
		</AdminShell>
	)
}
