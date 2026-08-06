"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Field, Input, Textarea } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/Icon"
import type { AdminField } from "@/types"

type Props = {
	field: AdminField
	value: unknown
	onChange: (name: string, value: unknown) => void
	disabled?: boolean
	error?: string
}

const selectClass =
	"h-11 w-full rounded-md border border-line bg-base-raised px-3 text-sm text-ink outline-none transition focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/25 disabled:opacity-60"

function toLines(value: unknown): string {
	if (Array.isArray(value)) return value.join("\n")
	if (typeof value === "string" && value.startsWith("[")) {
		try {
			const parsed = JSON.parse(value)
			if (Array.isArray(parsed)) return parsed.join("\n")
		} catch {
			/* fall through */
		}
	}
	return typeof value === "string" ? value : ""
}

/** Uploads a file and returns the stored URL. */
async function uploadFile(file: File): Promise<string> {
	const body = new FormData()
	body.append("file", file)
	const response = await fetch("/api/upload", { method: "POST", body })
	const payload = await response.json().catch(() => null)
	if (!response.ok || !payload?.url) {
		throw new Error(payload?.error ?? "Yuklab bo'lmadi")
	}
	return payload.url as string
}

function MediaField({ field, value, onChange, disabled, error }: Props) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [busy, setBusy] = useState(false)
	const [uploadError, setUploadError] = useState("")
	const current = typeof value === "string" ? value : ""
	const isImage = field.type === "image"

	const pick = async (file?: File) => {
		if (!file) return
		setBusy(true)
		setUploadError("")
		try {
			const url = await uploadFile(file)
			onChange(field.name, url)
		} catch (uploadFailure) {
			setUploadError(
				uploadFailure instanceof Error ? uploadFailure.message : "Xatolik",
			)
		} finally {
			setBusy(false)
		}
	}

	return (
		<Field
			label={field.label}
			hint={field.help}
			error={error || uploadError}
			required={field.required}
			htmlFor={field.name}
		>
			<div className="flex flex-col gap-3">
				{isImage && current ? (
					<div className="relative h-[120px] w-[200px] overflow-hidden rounded-md border border-line bg-base-raised">
						<Image
							src={current}
							alt={field.label}
							fill
							sizes="200px"
							className="object-cover"
							unoptimized
						/>
					</div>
				) : null}

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						disabled={disabled || busy}
						className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-glass px-3 text-sm transition hover:border-line-strong disabled:opacity-60"
					>
						<Icon name="ArrowDown" className="h-4 w-4" />
						{busy ? "Yuklanmoqda…" : "Fayl tanlash"}
					</button>

					{current ? (
						<button
							type="button"
							onClick={() => onChange(field.name, "")}
							disabled={disabled}
							className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-ink-faint transition hover:text-danger"
						>
							<Icon name="X" className="h-4 w-4" />
							O'chirish
						</button>
					) : null}
				</div>

				<input
					ref={inputRef}
					type="file"
					hidden
					accept={isImage ? "image/*" : "application/pdf,video/*"}
					onChange={(event) => pick(event.target.files?.[0])}
				/>

				<Input
					id={field.name}
					value={current}
					placeholder="/uploads/... yoki to'liq havola"
					onChange={(event) => onChange(field.name, event.target.value)}
					disabled={disabled || busy}
				/>
			</div>
		</Field>
	)
}

export function FieldInput(props: Props) {
	const { field, value, onChange, disabled, error } = props

	if (field.type === "image" || field.type === "file") {
		return <MediaField {...props} />
	}

	if (field.type === "checkbox") {
		return (
			<label className="flex cursor-pointer items-center gap-3 rounded-md border border-line bg-base-raised px-3.5 py-3">
				<input
					type="checkbox"
					checked={Boolean(value)}
					onChange={(event) => onChange(field.name, event.target.checked)}
					disabled={disabled}
					className="h-4 w-4 accent-[color:rgb(var(--brand))]"
				/>
				<span className="text-sm">{field.label}</span>
				{field.help ? (
					<span className="ml-auto text-xs text-ink-faint">{field.help}</span>
				) : null}
			</label>
		)
	}

	const common = {
		label: field.label,
		hint: field.help,
		error,
		required: field.required,
		htmlFor: field.name,
	}

	if (field.type === "select") {
		return (
			<Field {...common}>
				<select
					id={field.name}
					value={typeof value === "string" ? value : ""}
					onChange={(event) => onChange(field.name, event.target.value)}
					disabled={disabled}
					className={selectClass}
				>
					<option value="">—</option>
					{field.options?.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</Field>
		)
	}

	if (field.type === "tags" || field.type === "relation") {
		return (
			<Field {...common} hint={field.help ?? "Har bir qatorga bittadan yozing"}>
				<Textarea
					id={field.name}
					rows={field.rows ?? 4}
					value={toLines(value)}
					onChange={(event) =>
						onChange(
							field.name,
							event.target.value
								.split("\n")
								.map((line) => line.trim())
								.filter(Boolean),
						)
					}
					disabled={disabled}
				/>
			</Field>
		)
	}

	if (field.type === "textarea" || field.type === "richtext") {
		return (
			<Field {...common}>
				<Textarea
					id={field.name}
					rows={field.rows ?? 4}
					value={typeof value === "string" ? value : ""}
					placeholder={field.placeholder}
					onChange={(event) => onChange(field.name, event.target.value)}
					disabled={disabled}
				/>
			</Field>
		)
	}

	if (field.type === "icon") {
		const name = typeof value === "string" ? value : ""
		return (
			<Field {...common}>
				<div className="flex items-center gap-2">
					<span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-line bg-base-raised">
						<Icon name={name} className="h-4 w-4 text-accent-400" />
					</span>
					<Input
						id={field.name}
						value={name}
						placeholder="Sparkles"
						onChange={(event) => onChange(field.name, event.target.value)}
						disabled={disabled}
					/>
				</div>
			</Field>
		)
	}

	if (field.type === "color") {
		const color = typeof value === "string" && value ? value : "#3B82F6"
		return (
			<Field {...common}>
				<div className="flex items-center gap-2">
					<input
						type="color"
						value={color}
						onChange={(event) => onChange(field.name, event.target.value)}
						disabled={disabled}
						className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-line bg-base-raised"
					/>
					<Input
						id={field.name}
						value={typeof value === "string" ? value : ""}
						onChange={(event) => onChange(field.name, event.target.value)}
						disabled={disabled}
					/>
				</div>
			</Field>
		)
	}

	return (
		<Field {...common}>
			<Input
				id={field.name}
				type={
					field.type === "number"
						? "number"
						: field.type === "date"
							? "date"
							: "text"
				}
				value={value === null || value === undefined ? "" : String(value)}
				placeholder={field.placeholder}
				min={field.min}
				max={field.max}
				step={field.step}
				onChange={(event) =>
					onChange(
						field.name,
						field.type === "number"
							? event.target.value === ""
								? null
								: Number(event.target.value)
							: event.target.value,
					)
				}
				disabled={disabled}
			/>
		</Field>
	)
}
