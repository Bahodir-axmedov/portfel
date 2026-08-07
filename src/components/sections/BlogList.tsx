"use client"

import { useDeferredValue, useMemo, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search, X } from "lucide-react"
import { EASE } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

/**
 * Client-side search and tag filtering for the blog index.
 *
 * Same split as the projects filter: the post cards are rendered on the server
 * and passed down as `node`, while this component owns only the filter state.
 * The card needs translations and localized fields, so rendering it here would
 * drag the whole i18n runtime and every post body into the client bundle for
 * what is really just a text input.
 *
 * `search` is a pre-lowercased haystack built on the server (title + excerpt +
 * tags). Building it here would mean shipping the raw fields twice.
 */

export type BlogListItem = {
	id: string
	tags: string[]
	search: string
	node: ReactNode
}

export function BlogList({
	items,
	tags,
	allLabel,
	searchLabel,
	emptyLabel,
	clearLabel,
	countTemplate,
}: {
	items: BlogListItem[]
	tags: string[]
	allLabel: string
	searchLabel: string
	emptyLabel: string
	clearLabel: string
	/**
	 * A template containing `%count%`, not a formatter function.
	 *
	 * The placeholder deliberately avoids curly braces. next-intl parses messages
	 * as ICU MessageFormat, so a message written as `{count} ta maqola` would
	 * throw `MISSING_FORMAT_VALUE` the moment the server called `t("count")`
	 * without supplying the argument -- and the count is only known here, on the
	 * client. `%count%` is inert to ICU and survives translation untouched.
	 *
	 * This component is rendered from a Server Component, and functions are not
	 * serialisable across that boundary -- passing `(n) => string` would fail at
	 * request time with "Functions cannot be passed directly to Client
	 * Components". Interpolating a translated template keeps the wording on the
	 * server where the message catalogue lives.
	 */
	countTemplate: string
}) {
	const [query, setQuery] = useState("")
	const [tag, setTag] = useState<string | null>(null)

	// The list re-filters on every keystroke. `useDeferredValue` lets the input
	// stay responsive while the (potentially long) grid re-renders behind it,
	// instead of the caret stuttering on slower phones.
	const deferredQuery = useDeferredValue(query)

	const visible = useMemo(() => {
		const needle = deferredQuery.trim().toLowerCase()
		return items.filter((item) => {
			if (tag && !item.tags.includes(tag)) return false
			if (!needle) return true
			return item.search.includes(needle)
		})
	}, [items, deferredQuery, tag])

	const active = query.trim() !== "" || tag !== null

	return (
		<div>
			<div className="flex flex-col gap-4">
				<div className="relative max-w-md">
					<Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={searchLabel}
						aria-label={searchLabel}
						className="h-11 w-full rounded-md border border-line bg-white/[0.025] pl-10 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand-500/60 focus:bg-white/[0.04]"
					/>
					{query ? (
						<button
							type="button"
							onClick={() => setQuery("")}
							aria-label={clearLabel}
							className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition-colors hover:bg-glass hover:text-ink"
						>
							<X className="h-3.5 w-3.5" />
						</button>
					) : null}
				</div>

				{tags.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						<TagChip
							label={allLabel}
							active={tag === null}
							onClick={() => setTag(null)}
						/>
						{tags.map((item) => (
							<TagChip
								key={item}
								label={item}
								active={tag === item}
								onClick={() => setTag(tag === item ? null : item)}
							/>
						))}
					</div>
				) : null}
			</div>

			{/* A live region so screen readers hear the result count change as the
			    query is typed; a purely visual count would be silent. */}
			<p
				className="mt-5 text-xs text-ink-faint"
				role="status"
				aria-live="polite"
			>
				{countTemplate.replace("%count%", String(visible.length))}
			</p>

			{visible.length === 0 ? (
				<p className="mt-10 rounded-lg border border-dashed border-line py-12 text-center text-sm text-ink-faint">
					{emptyLabel}
				</p>
			) : (
				<motion.div
					layout
					className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
				>
					<AnimatePresence mode="popLayout" initial={false}>
						{visible.map((item) => (
							<motion.div
								key={item.id}
								layout
								initial={{ opacity: 0, scale: 0.94, y: 14 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.94, y: -8 }}
								transition={{ duration: 0.42, ease: EASE }}
							>
								{item.node}
							</motion.div>
						))}
					</AnimatePresence>
				</motion.div>
			)}

			{active ? (
				<button
					type="button"
					onClick={() => {
						setQuery("")
						setTag(null)
					}}
					className="btn-sweep mt-6 inline-flex h-9 items-center gap-2 rounded-full border border-line px-4 text-xs text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
				>
					<X className="h-3.5 w-3.5" />
					{clearLabel}
				</button>
			) : null}
		</div>
	)
}

function TagChip({
	label,
	active,
	onClick,
}: {
	label: string
	active: boolean
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={cn(
				"btn-sweep rounded-full border px-3.5 py-1.5 text-xs transition-colors duration-200",
				active
					? "border-brand-500/60 bg-brand-500/12 text-ink"
					: "border-line text-ink-muted hover:border-line-strong hover:text-ink",
			)}
		>
			{label}
		</button>
	)
}
