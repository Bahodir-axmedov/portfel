"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/components/admin/Toast"
import {
	parseLocaleList,
	PREFERENCE_LOCALES,
	specsForGroup,
	type PreferenceGroup,
	type PreferenceSpec,
} from "@/lib/preferences"
import { cn } from "@/lib/utils"

/**
 * Theme / language / role screens.
 *
 * The form is generated from `PREFERENCE_SPECS`, the same list the API
 * validates against, so the UI can never offer a value the server rejects.
 * Each group saves on its own: changing the accent colour should not force the
 * language block to be re-submitted.
 */

const CONTROL =
	"h-11 w-full rounded-md border border-line bg-base-raised px-3 text-sm text-ink outline-none transition focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/25 disabled:opacity-60"

const BUTTON =
	"inline-flex h-9 items-center gap-2 rounded-md border border-line bg-glass px-3 text-sm transition hover:border-line-strong disabled:opacity-60"

const CARD = "rounded-xl border border-line bg-base-soft p-5"

type Values = Record<string, string>

type ApiResponse = {
	ok?: boolean
	values?: Values
	error?: string
	fieldErrors?: Array<{ field: string; message: string }>
}

function Control({
	spec,
	value,
	disabled,
	onChange,
}: {
	spec: PreferenceSpec
	value: string
	disabled: boolean
	onChange: (key: string, next: string) => void
}) {
	if (spec.kind === "boolean") {
		const checked = value === "true"
		return (
			<label className="flex cursor-pointer items-center gap-3 rounded-md border border-line bg-base-raised px-3.5 py-3">
				<input
					type="checkbox"
					checked={checked}
					disabled={disabled}
					onChange={(event) =>
						onChange(spec.key, event.target.checked ? "true" : "false")
					}
					className="h-4 w-4 accent-[color:rgb(var(--brand))]"
				/>
				<span className="text-sm">{spec.label}</span>
				<span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
					{checked ? "ON" : "OFF"}
				</span>
			</label>
		)
	}

	if (spec.kind === "number") {
		const current = Number(value)
		return (
			<div>
				<div className="flex items-center justify-between pb-1.5">
					<span className="text-sm">{spec.label}</span>
					<span className="font-mono text-[11px] text-brand-300">
						{Number.isFinite(current) ? current : spec.fallback}
					</span>
				</div>
				<input
					type="range"
					min={spec.min ?? 0}
					max={spec.max ?? 100}
					value={Number.isFinite(current) ? current : Number(spec.fallback)}
					disabled={disabled}
					onChange={(event) => onChange(spec.key, event.target.value)}
					className="h-2 w-full cursor-pointer accent-[color:rgb(var(--brand))] disabled:opacity-60"
				/>
			</div>
		)
	}

	if (spec.kind === "locales") {
		const active = parseLocaleList(value)
		return (
			<div>
				<p className="pb-1.5 text-sm">{spec.label}</p>
				<div className="flex flex-wrap gap-2">
					{PREFERENCE_LOCALES.map((locale) => {
						const on = active.includes(locale.value)
						// The last remaining locale cannot be switched off: an empty list
						// would leave the public site with no reachable language.
						const locked = on && active.length === 1
						return (
							<button
								key={locale.value}
								type="button"
								disabled={disabled || locked}
								aria-pressed={on}
								onClick={() => {
									const next = on
										? active.filter((item) => item !== locale.value)
										: [...active, locale.value]
									onChange(spec.key, next.join(","))
								}}
								className={cn(
									"inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition",
									on
										? "border-brand-500/50 bg-brand-500/10 text-ink"
										: "border-line bg-base-raised text-ink-muted hover:text-ink",
									locked ? "cursor-not-allowed opacity-70" : "",
								)}
							>
								<Icon
									name={on ? "Check" : "CircleDot"}
									className="h-3.5 w-3.5"
								/>
								{locale.label}
							</button>
						)
					})}
				</div>
			</div>
		)
	}

	return (
		<label className="block">
			<span className="block pb-1.5 text-sm">{spec.label}</span>
			<select
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(spec.key, event.target.value)}
				className={CONTROL}
			>
				{spec.options?.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</label>
	)
}

export function PreferencesPanels({
	initial,
	adminEmail,
	sessionHours,
}: {
	initial: Values
	adminEmail: string
	sessionHours: number
}) {
	const router = useRouter()
	const { success, error: notifyError } = useToast()
	const [values, setValues] = useState<Values>(initial)
	const [saved, setSaved] = useState<Values>(initial)
	const [busy, setBusy] = useState<PreferenceGroup | "reset" | null>(null)

	const setValue = (key: string, next: string) =>
		setValues((current) => ({ ...current, [key]: next }))

	const send = async (
		body: { values: Values } | { reset: true },
		marker: PreferenceGroup | "reset",
	) => {
		setBusy(marker)
		try {
			const response = await fetch("/api/admin/preferences", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			})
			const payload = (await response
				.json()
				.catch(() => null)) as ApiResponse | null

			if (!response.ok || !payload?.ok) {
				const first = payload?.fieldErrors?.[0]
				notifyError(
					first
						? `${first.field}: ${first.message}`
						: (payload?.error ?? "Saqlab bo'lmadi"),
				)
				return
			}

			// The server answers with the stored rows, so the form shows exactly
			// what is in the database rather than what was typed.
			if (payload.values) {
				setValues(payload.values)
				setSaved(payload.values)
			}
			success(marker === "reset" ? "Standart holatga qaytarildi" : "Saqlandi")
			router.refresh()
		} catch {
			notifyError("Tarmoq xatosi")
		} finally {
			setBusy(null)
		}
	}

	const saveGroup = (group: PreferenceGroup) => {
		const subset: Values = {}
		for (const spec of specsForGroup(group)) subset[spec.key] = values[spec.key]
		void send({ values: subset }, group)
	}

	const resetAll = () => {
		if (
			!window.confirm(
				"Barcha interfeys sozlamalari standart holatga qaytariladi. Davom etamizmi?",
			)
		) {
			return
		}
		void send({ reset: true }, "reset")
	}

	const isDirty = (group: PreferenceGroup) =>
		specsForGroup(group).some((spec) => values[spec.key] !== saved[spec.key])

	const groups: Array<{
		group: PreferenceGroup
		title: string
		description: string
		icon: string
	}> = [
		{
			group: "theme",
			title: "Mavzu sozlamalari",
			description: "Gradient, glow, animatsiya darajasi va hero qatlamlari",
			icon: "Sparkles",
		},
		{
			group: "language",
			title: "Til sozlamalari",
			description: "Asosiy til, yoqilgan tillar va almashtirgich",
			icon: "Globe",
		},
	]

	return (
		<div className="grid max-w-[1080px] gap-4 lg:grid-cols-2">
			{groups.map((item) => {
				const dirty = isDirty(item.group)
				const saving = busy === item.group
				return (
					<section key={item.group} className={CARD}>
						<header className="flex items-start gap-3 pb-4">
							<span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-base-raised">
								<Icon name={item.icon} className="h-4 w-4 text-brand-300" />
							</span>
							<div>
								<h2 className="text-sm font-semibold tracking-tight">
									{item.title}
								</h2>
								<p className="text-xs text-ink-muted">{item.description}</p>
							</div>
							{dirty ? (
								<span className="ml-auto rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-warning">
									saqlanmagan
								</span>
							) : null}
						</header>

						<div className="space-y-4">
							{specsForGroup(item.group).map((spec) => (
								<div key={spec.key}>
									<Control
										spec={spec}
										value={values[spec.key] ?? spec.fallback}
										disabled={busy !== null}
										onChange={setValue}
									/>
									{spec.help ? (
										<p className="pt-1 text-[11px] text-ink-faint">
											{spec.help}
										</p>
									) : null}
								</div>
							))}
						</div>

						<div className="flex items-center gap-2 pt-5">
							<button
								type="button"
								onClick={() => saveGroup(item.group)}
								disabled={busy !== null || !dirty}
								className={cn(
									BUTTON,
									dirty ? "border-brand-500/50 bg-brand-500/10" : "",
								)}
							>
								<Icon name="Check" className="h-4 w-4" />
								{saving ? "Saqlanmoqda…" : "Saqlash"}
							</button>
							{dirty ? (
								<button
									type="button"
									onClick={() => setValues(saved)}
									disabled={busy !== null}
									className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-ink-faint transition hover:text-ink"
								>
									<Icon name="X" className="h-4 w-4" />
									Bekor qilish
								</button>
							) : null}
						</div>
					</section>
				)
			})}

			<section className={cn(CARD, "lg:col-span-2")}>
				<header className="flex items-start gap-3 pb-4">
					<span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-base-raised">
						<Icon name="Users" className="h-4 w-4 text-accent-400" />
					</span>
					<div>
						<h2 className="text-sm font-semibold tracking-tight">
							Rol boshqaruvi
						</h2>
						<p className="text-xs text-ink-muted">
							Kirish huquqi va sessiya muddati
						</p>
					</div>
				</header>

				<div className="grid gap-3 sm:grid-cols-3">
					<div className="rounded-md border border-line bg-base-raised px-3.5 py-3">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
							hisob
						</p>
						<p className="truncate pt-1 text-sm">{adminEmail}</p>
					</div>
					<div className="rounded-md border border-line bg-base-raised px-3.5 py-3">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
							rol
						</p>
						<p className="flex items-center gap-2 pt-1 text-sm">
							<Icon name="ShieldCheck" className="h-4 w-4 text-brand-300" />
							admin (to&apos;liq huquq)
						</p>
					</div>
					<div className="rounded-md border border-line bg-base-raised px-3.5 py-3">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
							sessiya
						</p>
						<p className="pt-1 text-sm">{sessionHours} soat</p>
					</div>
				</div>

				<div className="mt-4 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
					<Icon
						name="ShieldCheck"
						className="mt-0.5 h-4 w-4 shrink-0 text-warning"
					/>
					<div className="text-xs leading-relaxed text-ink-muted">
						<p>
							Hozirda ma&apos;lumotlar bazasida foydalanuvchilar jadvali (User
							modeli) yo&apos;q. Admin bitta hisobdan iborat va u Railway
							environment o&apos;zgaruvchilari orqali boshqariladi:{" "}
							<span className="font-mono text-[11px] text-ink">
								ADMIN_EMAIL
							</span>{" "}
							va{" "}
							<span className="font-mono text-[11px] text-ink">
								ADMIN_PASSWORD_HASH
							</span>
							. Shu sababli bu yerda yangi foydalanuvchi qo&apos;shish yoki rol
							berish imkoni yo&apos;q &mdash; bu ataylab shunday, yolg&apos;on
							interfeys ko&apos;rsatilmadi.
						</p>
						<p className="pt-2">
							Email yoki parolni almashtirish uchun Railway &rarr; Variables
							bo&apos;limini tahrirlang. Yangi parol hashini{" "}
							<span className="font-mono text-[11px] text-ink">
								npm run hash -- &quot;yangi-parol&quot;
							</span>{" "}
							buyrug&apos;i bilan yarating. Bir nechta foydalanuvchi kerak
							bo&apos;lsa, Prisma sxemasiga User modeli va migratsiya
							qo&apos;shilishi lozim.
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 pt-5">
					<button
						type="button"
						onClick={resetAll}
						disabled={busy !== null}
						className={cn(BUTTON, "hover:border-danger/40 hover:text-danger")}
					>
						<Icon name="Activity" className="h-4 w-4" />
						{busy === "reset"
							? "Qaytarilmoqda…"
							: "Barcha sozlamalarni standartga qaytarish"}
					</button>
					<p className="text-[11px] text-ink-faint">
						Faqat mavzu va til sozlamalariga ta&apos;sir qiladi, kontent
						o&apos;zgarmaydi.
					</p>
				</div>
			</section>
		</div>
	)
}
