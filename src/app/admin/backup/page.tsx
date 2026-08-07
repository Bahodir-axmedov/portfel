import { AdminShell } from "@/components/admin/AdminShell"
import { BackupPanel } from "@/components/admin/BackupPanel"
import { Icon } from "@/components/ui/Icon"

export const dynamic = "force-dynamic"

export default function AdminBackupPage() {
	return (
		<AdminShell
			title="Zaxira va tiklash"
			description="Ma'lumotlar bazasini JSON formatida eksport va import qilish"
		>
			<div className="space-y-4">
				<div className="flex max-w-[860px] items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
					<Icon
						name="ShieldCheck"
						className="mt-0.5 h-4 w-4 shrink-0 text-warning"
					/>
					<p className="text-xs leading-relaxed text-ink-muted">
						Zaxira faylida barcha kontent bo&apos;limlari va kontakt xabarlari
						bo&apos;ladi. Fayl parol yoki maxfiy kalitlarni o&apos;z ichiga
						olmaydi — ular faqat environment o&apos;zgaruvchilarida saqlanadi.
					</p>
				</div>
				<BackupPanel />
			</div>
		</AdminShell>
	)
}
