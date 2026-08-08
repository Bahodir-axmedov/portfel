import { AdminShell } from "@/components/admin/AdminShell"
import { PreferencesPanels } from "@/components/admin/PreferencesPanels"
import { getSession } from "@/lib/auth"
import { envNumber } from "@/lib/env"
import { mergePreferences, PREFERENCE_KEYS } from "@/lib/preferences"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * Theme / language / role screen.
 *
 * Values are read on the server so the form is already correct on first paint
 * (no loading flash, no second round trip). Only the whitelisted preference
 * keys are selected: the `/admin/settings` CRUD table keeps owning every other
 * row in the same table.
 */
export default async function AdminPreferencesPage() {
	// AdminShell also guards and redirects; this read is only for the email
	// shown in the role card.
	const session = await getSession()

	const rows = await prisma.setting.findMany({
		where: { key: { in: PREFERENCE_KEYS } },
		select: { key: true, value: true },
	})

	return (
		<AdminShell
			title="Interfeys sozlamalari"
			description="Mavzu, til va kirish huquqlari"
		>
			<PreferencesPanels
				initial={mergePreferences(rows)}
				adminEmail={session?.email ?? "—"}
				sessionHours={envNumber(process.env.AUTH_SESSION_HOURS, 12, {
					min: 1,
					max: 720,
				})}
			/>
		</AdminShell>
	)
}
