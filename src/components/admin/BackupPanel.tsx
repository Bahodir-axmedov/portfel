"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/components/admin/Toast"
import { cn } from "@/lib/utils"

type ImportResult = {
	ok?: boolean
	imported?: Record<string, number>
	skipped?: string[]
	error?: string
}

/**
 * Backup / restore.
 *
 * SQLite on a Railway volume has no managed snapshots: if the volume is lost
 * or the service is recreated, every row is gone. A one-click JSON export is
 * the smallest thing that makes the content recoverable.
 */
export function BackupPanel() {
	const router = useRouter()
	const { success, error: notifyError } = useToast()
	const [exporting, setExporting] = useState(false)
	const [importing, setImporting] = useState(false)
	const [result, setResult] = useState<ImportResult | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const exportBackup = async () => {
		setExporting(true)
		try {
			const response = await fetch("/api/admin/backup")
			if (!response.ok) {
				notifyError("Zaxira nusxasini olib bo'lmadi")
				return
			}

			const blob = await response.blob()
			const url = URL.createObjectURL(blob)
			const anchor = document.createElement("a")
			anchor.href = url
			anchor.download = `bahodir-dev-backup-${new Date().toISOString().slice(0, 10)}.json`
			document.body.appendChild(anchor)
			anchor.click()
			anchor.remove()
			// Without revoking, the Blob stays in memory for the lifetime of the
			// document — a real leak on a page the admin keeps open.
			URL.revokeObjectURL(url)
			success("Zaxira nusxasi yuklab olindi")
		} catch {
			notifyError("Tarmoq xatosi")
		} finally {
			setExporting(false)
		}
	}

	const importBackup = async (file: File | undefined) => {
		if (!file) return
		if (
			!window.confirm(
				"Zaxiradan tiklash mavjud yozuvlarni qayta yozadi. Davom etamizmi?",
			)
		) {
			if (inputRef.current) inputRef.current.value = ""
			return
		}

		setImporting(true)
		setResult(null)
		try {
			const text = await file.text()
			let parsed: unknown
			try {
				parsed = JSON.parse(text)
			} catch {
				notifyError("Fayl JSON formatida emas")
				return
			}

			const response = await fetch("/api/admin/backup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ confirm: true, backup: parsed }),
			})
			const payload = (await response.json()) as ImportResult

			if (!response.ok || !payload.ok) {
				notifyError(payload.error ?? "Tiklab bo'lmadi")
				return
			}

			setResult(payload)
			success("Zaxiradan tiklandi")
			router.refresh()
		} catch {
			notifyError("Tarmoq xatosi")
		} finally {
			setImporting(false)
			if (inputRef.current) inputRef.current.value = ""
		}
	}

	return (
		<div className="grid max-w-[860px] gap-4 lg:grid-cols-2">
			<section className="card-surface rounded-lg p-5">
				<div className="flex items-center gap-2">
					<Icon name="Download" className="h-4 w-4 text-brand-300" />
					<h2 className="text-sm font-semibold">Zaxira nusxa olish</h2>
				</div>
				<p className="mt-2 text-xs leading-relaxed text-ink-muted">
					Barcha bo&apos;limlar, profil va xabarlar bitta JSON faylga eksport
					qilinadi. Faylni xavfsiz joyda saqlang — Railway volume yo&apos;qolsa,
					ma&apos;lumotni faqat shu fayldan tiklash mumkin.
				</p>
				<button
					type="button"
					onClick={() => void exportBackup()}
					disabled={exporting}
					className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-brand-gradient px-4 text-sm font-medium text-white shadow-glow transition hover:opacity-95 disabled:opacity-60"
				>
					<Icon name="Download" className="h-4 w-4" />
					{exporting ? "Tayyorlanmoqda…" : "JSON yuklab olish"}
				</button>
			</section>

			<section className="card-surface rounded-lg p-5">
				<div className="flex items-center gap-2">
					<Icon name="Layers" className="h-4 w-4 text-brand-300" />
					<h2 className="text-sm font-semibold">Zaxiradan tiklash</h2>
				</div>
				<p className="mt-2 text-xs leading-relaxed text-ink-muted">
					Eksport qilingan JSON faylni tanlang. Bir xil ID&apos;li yozuvlar
					yangilanadi, yangilari qo&apos;shiladi. Bog&apos;liq jadvallar (loyiha
					rasmlari, texnologiyalar) tiklanmaydi.
				</p>
				<input
					ref={inputRef}
					id="backup-file"
					type="file"
					accept="application/json,.json"
					onChange={(event) => void importBackup(event.target.files?.[0])}
					className="hidden"
				/>
				<label
					htmlFor="backup-file"
					className={cn(
						"mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-line px-4 text-sm transition hover:border-line-strong",
						importing && "pointer-events-none opacity-60",
					)}
				>
					<Icon name="FileText" className="h-4 w-4" />
					{importing ? "Tiklanmoqda…" : "Fayl tanlash"}
				</label>

				{result?.imported ? (
					<div className="mt-4 space-y-1 rounded-md border border-line bg-base-raised p-3">
						<p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
							Natija
						</p>
						{Object.entries(result.imported).map(([key, count]) => (
							<p key={key} className="flex justify-between text-xs">
								<span className="text-ink-muted">{key}</span>
								<span className="tabular-nums">{count}</span>
							</p>
						))}
						{result.skipped?.length ? (
							<p className="pt-1 text-[11px] text-warning">
								O&apos;tkazib yuborildi: {result.skipped.join(", ")}
							</p>
						) : null}
					</div>
				) : null}
			</section>
		</div>
	)
}
