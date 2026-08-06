"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/components/admin/Toast"
import { FieldInput } from "./FieldInput"
import type { AdminField, AdminResourceConfig } from "@/types"

type Props = {
	config: AdminResourceConfig
	initial?: Record<string, unknown>
	id?: string
}

type Group = {
	key: string
	base: AdminField
	translations: AdminField[]
}

/** Groups a base field with its RU / EN siblings so they render as tabs. */
function buildGroups(fields: AdminField[]): Group[] {
	const groups: Group[] = []
	for (const field of fields) {
		if (field.translationOf) {
			const parent = groups.find(
				(group) => group.base.name === field.translationOf,
			)
			if (parent) parent.translations.push(field)
			continue
		}
		groups.push({ key: field.name, base: field, translations: [] })
	}
	return groups
}

function TranslatedGroup({
	group,
	values,
	onChange,
	disabled,
	errors,
}: {
	group: Group
	values: Record<string, unknown>
	onChange: (name: string, value: unknown) => void
	disabled: boolean
	errors: Record<string, string>
}) {
	const tabs = [group.base, ...group.translations]
	const [active, setActive] = useState(0)
	const field = tabs[active]

	const filled = (candidate: AdminField) => {
		const value = values[candidate.name]
		if (Array.isArray(value)) return value.length > 0
		return value !== null && value !== undefined && value !== ""
	}

	return (
		<div className="rounded-lg border border-line bg-base-soft/60 p-4">
			<div className="mb-3 flex flex-wrap gap-1.5">
				{tabs.map((tab, index) => {
					const code = tab.translationOf
						? tab.name.endsWith("Ru")
							? "RU"
							: "EN"
						: "UZ"
					return (
						<button
							key={tab.name}
							type="button"
							onClick={() => setActive(index)}
							className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] transition ${
								index === active
									? "bg-glass text-ink"
									: "text-ink-faint hover:text-ink-muted"
							}`}
						>
							{code}
							{filled(tab) ? (
								<span className="h-1.5 w-1.5 rounded-full bg-success" />
							) : null}
						</button>
					)
				})}
			</div>

			<FieldInput
				field={field}
				value={values[field.name]}
				onChange={onChange}
				disabled={disabled}
				error={errors[field.name]}
			/>
		</div>
	)
}

export function ResourceForm({ config, initial, id }: Props) {
	const router = useRouter()
	const { success, error: notifyError } = useToast()
	const groups = useMemo(() => buildGroups(config.fields), [config.fields])

	const [values, setValues] = useState<Record<string, unknown>>(() => {
		const defaults: Record<string, unknown> = {}
		for (const field of config.fields) {
			if (field.type === "checkbox") defaults[field.name] = false
		}
		if (!id) {
			defaults.published = true
			defaults.order = 0
		}
		return { ...defaults, ...(initial ?? {}) }
	})

	const [errors, setErrors] = useState<Record<string, string>>({})
	const [message, setMessage] = useState("")
	const [pending, setPending] = useState(false)
	const [dirty, setDirty] = useState(false)

	// Suppresses the unload guard for our own redirect after a successful save,
	// otherwise saving would immediately pop a "discard changes?" dialog.
	const navigatingAway = useRef(false)

	/**
	 * Unsaved-changes guard.
	 *
	 * These forms hold up to 46 fields. Closing the tab or hitting back used to
	 * discard all of it with no warning. `beforeunload` is the only hook the
	 * browser exposes for a full unload; the listener is registered only while
	 * the form is dirty and removed on unmount, so it cannot leak or fire on an
	 * unrelated page.
	 */
	useEffect(() => {
		if (!dirty) return
		const onBeforeUnload = (event: BeforeUnloadEvent) => {
			if (navigatingAway.current) return
			event.preventDefault()
			event.returnValue = ""
		}
		window.addEventListener("beforeunload", onBeforeUnload)
		return () => window.removeEventListener("beforeunload", onBeforeUnload)
	}, [dirty])

	const onChange = (name: string, value: unknown) => {
		setDirty(true)
		setValues((previous) => ({ ...previous, [name]: value }))
		setErrors((previous) => {
			if (!previous[name]) return previous
			const next = { ...previous }
			delete next[name]
			return next
		})
	}

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setPending(true)
		setErrors({})
		setMessage("")

		const endpoint = id
			? `/api/admin/${config.key}/${id}`
			: `/api/admin/${config.key}`

		try {
			const response = await fetch(endpoint, {
				method: id ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			})

			const payload = await response.json().catch(() => null)

			if (!response.ok) {
				if (Array.isArray(payload?.fieldErrors)) {
					const mapped: Record<string, string> = {}
					for (const issue of payload.fieldErrors) {
						if (issue.field && !mapped[issue.field]) {
							mapped[issue.field] = issue.message
						}
					}
					setErrors(mapped)
				}
				const text = payload?.error ?? "Saqlashda xatolik yuz berdi"
				setMessage(text)
				notifyError(text)
				setPending(false)
				return
			}

			navigatingAway.current = true
			setDirty(false)
			success(id ? "Yozuv yangilandi" : "Yozuv qo'shildi")
			router.push(`/admin/${config.key}`)
			router.refresh()
		} catch {
			setMessage("Serverga ulanib bo'lmadi")
			notifyError("Serverga ulanib bo'lmadi")
			setPending(false)
		}
	}

	/**
	 * Deletion previously fired the request and redirected without ever looking
	 * at the response. A 401, a 404 or a foreign-key conflict all looked exactly
	 * like success: the admin was sent back to a list where the row was still
	 * there, with no explanation.
	 */
	const remove = async () => {
		if (!id) return
		if (
			!window.confirm(
				"Rostdan ham o'chirilsinmi? Bu amalni ortga qaytarib bo'lmaydi.",
			)
		)
			return

		setPending(true)
		setMessage("")

		try {
			const response = await fetch(`/api/admin/${config.key}/${id}`, {
				method: "DELETE",
			})

			if (!response.ok) {
				const payload = await response.json().catch(() => null)
				const text = payload?.error ?? "O'chirishda xatolik yuz berdi"
				setMessage(text)
				notifyError(text)
				setPending(false)
				return
			}

			navigatingAway.current = true
			setDirty(false)
			success("Yozuv o'chirildi")
			router.push(`/admin/${config.key}`)
			router.refresh()
		} catch {
			notifyError("Serverga ulanib bo'lmadi")
			setPending(false)
		}
	}

	return (
		<form onSubmit={submit} className="max-w-[760px] pb-16" noValidate>
			<div className="flex flex-col gap-4">
				{groups.map((group) =>
					group.translations.length ? (
						<TranslatedGroup
							key={group.key}
							group={group}
							values={values}
							onChange={onChange}
							disabled={pending}
							errors={errors}
						/>
					) : (
						<FieldInput
							key={group.key}
							field={group.base}
							value={values[group.base.name]}
							onChange={onChange}
							disabled={pending}
							error={errors[group.base.name]}
						/>
					),
				)}
			</div>

			{message ? (
				<p className="mt-5 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
					<Icon name="ShieldCheck" className="h-4 w-4 shrink-0" />
					{message}
				</p>
			) : null}

			<div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-3 border-t border-line bg-base/90 py-4 backdrop-blur-xl">
				<Button type="submit" disabled={pending}>
					{pending ? "Saqlanmoqda…" : "Saqlash"}
				</Button>

				<Link
					href={`/admin/${config.key}`}
					className="inline-flex h-11 items-center rounded-md px-4 text-sm text-ink-muted transition hover:text-ink"
				>
					Bekor qilish
				</Link>

				{id ? (
					<button
						type="button"
						onClick={remove}
						disabled={pending}
						className="ml-auto inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm text-ink-faint transition hover:text-danger disabled:opacity-60"
					>
						<Icon name="X" className="h-4 w-4" />
						O&apos;chirish
					</button>
				) : null}
			</div>
		</form>
	)
}
