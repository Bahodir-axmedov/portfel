"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { Markdown } from "@/components/ui/Markdown"
import { Textarea } from "@/components/ui/primitives"
import { cn } from "@/lib/utils"

/**
 * Editor for `richtext` admin fields.
 *
 * It writes Markdown, not HTML, on purpose: the public site renders post
 * bodies with this project's own Markdown parser, which returns tokens and
 * never emits raw HTML. An HTML editor would produce content the renderer
 * cannot display, and storing form-supplied HTML is the usual way stored XSS
 * gets into a site.
 *
 * No editor package is used. Any new dependency changes package-lock.json,
 * and a lockfile mismatch has already broken this project's deploy once.
 */

type Props = {
	id: string
	value: string
	rows?: number
	placeholder?: string
	disabled?: boolean
	onChange: (next: string) => void
}

type Action = {
	label: string
	title: string
	/** Inserted before the selection. */
	prefix: string
	/** Inserted after the selection. Absent for line-level actions. */
	suffix?: string
	/** Used when nothing is selected, so a click is never a no-op. */
	sample: string
	/** Line-level actions apply the prefix to every selected line. */
	perLine?: boolean
	className?: string
}

/*
 * Labels are plain characters rather than icons. Every icon name has to be
 * proven to exist in the installed icon package before it can be used here --
 * an unexported name is a build failure, and this toolbar does not need one.
 */
const ACTIONS: Action[] = [
	{
		label: "B",
		title: "Qalin",
		prefix: "**",
		suffix: "**",
		sample: "matn",
		className: "font-bold",
	},
	{
		label: "I",
		title: "Kursiv",
		prefix: "*",
		suffix: "*",
		sample: "matn",
		className: "italic",
	},
	{
		label: "H2",
		title: "Sarlavha 2",
		prefix: "## ",
		sample: "Sarlavha",
		perLine: true,
	},
	{
		label: "H3",
		title: "Sarlavha 3",
		prefix: "### ",
		sample: "Sarlavha",
		perLine: true,
	},
	{ label: "—", title: "Ro'yxat", prefix: "- ", sample: "band", perLine: true },
	{
		label: "1.",
		title: "Raqamli ro'yxat",
		prefix: "1. ",
		sample: "band",
		perLine: true,
	},
	{
		label: "”",
		title: "Iqtibos",
		prefix: "> ",
		sample: "iqtibos",
		perLine: true,
	},
	{ label: "</>", title: "Kod", prefix: "`", suffix: "`", sample: "kod" },
	{
		label: "link",
		title: "Havola",
		prefix: "[",
		suffix: "](https://)",
		sample: "havola",
	},
]

export function MarkdownEditor({
	id,
	value,
	rows = 14,
	placeholder,
	disabled,
	onChange,
}: Props) {
	const ref = useRef<HTMLTextAreaElement>(null)
	const pending = useRef<[number, number] | null>(null)
	const [preview, setPreview] = useState(false)

	/*
	 * The value is controlled by the parent form, so a toolbar click sends the
	 * new text upwards and comes back as a fresh render. Without restoring the
	 * selection afterwards the caret jumps to the end of the document on every
	 * click, which makes the toolbar unusable for anything but the last word.
	 */
	useLayoutEffect(() => {
		const selection = pending.current
		const node = ref.current
		if (!selection || !node) return
		pending.current = null
		node.focus()
		node.setSelectionRange(selection[0], selection[1])
	})

	const apply = useCallback(
		(action: Action) => {
			const node = ref.current
			if (!node || disabled) return

			const start = node.selectionStart
			const end = node.selectionEnd

			if (action.perLine) {
				// Expanded to whole lines: a list marker or heading placed in the
				// middle of a line is not valid Markdown and would render as text.
				const lineStart = value.lastIndexOf("\n", start - 1) + 1
				const breakIndex = value.indexOf("\n", end)
				const lineEnd = breakIndex === -1 ? value.length : breakIndex
				const block = value.slice(lineStart, lineEnd) || action.sample
				const next = block
					.split("\n")
					.map((line) =>
						// Clicking twice should not stack "## ## " prefixes.
						line.startsWith(action.prefix) ? line : action.prefix + line,
					)
					.join("\n")

				onChange(value.slice(0, lineStart) + next + value.slice(lineEnd))
				pending.current = [lineStart, lineStart + next.length]
				return
			}

			const body = value.slice(start, end) || action.sample
			const next = action.prefix + body + (action.suffix ?? "")
			onChange(value.slice(0, start) + next + value.slice(end))
			// Leaves the inserted text selected so it can be typed over directly.
			pending.current = [
				start + action.prefix.length,
				start + action.prefix.length + body.length,
			]
		},
		[disabled, onChange, value],
	)

	const characters = value.length
	const words = value.trim() ? value.trim().split(/\s+/).length : 0

	return (
		<div className="rounded-lg border border-line bg-base-raised/40">
			<div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
				{ACTIONS.map((action) => (
					<button
						key={action.title}
						// Never "submit": this editor lives inside the resource form and
						// a default-type button would save the record on every click.
						type="button"
						onClick={() => apply(action)}
						disabled={disabled || preview}
						title={action.title}
						aria-label={action.title}
						className={cn(
							"inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-xs text-ink-muted transition hover:bg-glass hover:text-ink disabled:opacity-40",
							action.className,
						)}
					>
						{action.label}
					</button>
				))}

				<button
					type="button"
					onClick={() => setPreview((current) => !current)}
					disabled={disabled}
					aria-pressed={preview}
					className={cn(
						"ml-auto inline-flex h-7 items-center rounded-md border px-2.5 text-xs transition",
						preview
							? "border-brand-500/40 bg-brand-500/10 text-brand-300"
							: "border-line text-ink-faint hover:text-ink",
					)}
				>
					{preview ? "Tahrirlash" : "Ko'rish"}
				</button>
			</div>

			{preview ? (
				<div className="min-h-[132px] px-3 py-3">
					{value.trim() ? (
						/*
						 * The same renderer the public page uses, so the preview cannot
						 * drift away from what a visitor will actually see.
						 */
						<Markdown source={value} />
					) : (
						<p className="text-sm text-ink-faint">Hozircha matn yo&apos;q.</p>
					)}
				</div>
			) : (
				<Textarea
					id={id}
					ref={ref}
					rows={rows}
					value={value}
					placeholder={placeholder}
					onChange={(event) => onChange(event.target.value)}
					disabled={disabled}
					className="rounded-none border-0 bg-transparent focus:ring-0"
				/>
			)}

			<div className="flex items-center justify-between border-t border-line px-3 py-1.5 text-[11px] text-ink-faint">
				<span>Markdown: **qalin** *kursiv* ## sarlavha - ro&apos;yxat</span>
				<span>
					{words} so&apos;z · {characters} belgi
				</span>
			</div>
		</div>
	)
}
