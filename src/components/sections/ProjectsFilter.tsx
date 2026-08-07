"use client"

import { useMemo, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { EASE } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

/**
 * One filterable card. `node` is the *already rendered* server output of
 * `ProjectCard`.
 *
 * This is the important architectural detail: `ProjectCard` is an async Server
 * Component. It awaits translations and reads localised fields, so it cannot be
 * imported into a client bundle. Rather than duplicating the whole card in
 * client-land -- which would double the markup and guarantee the two copies
 * drift apart -- the server renders each card and hands the finished element
 * down as a child. The client only owns the filter state and the layout
 * animation, so no project data and no translation machinery is shipped to the
 * browser.
 */
export type FilterableProject = {
	id: string
	category: string
	node: ReactNode
}

export type FilterCategory = {
	id: string
	label: string
}

const GRID_CLASS = "grid gap-5 md:grid-cols-2 xl:grid-cols-3"

export function ProjectsFilter({
	items,
	categories,
	allLabel,
	emptyLabel,
}: {
	items: FilterableProject[]
	categories: FilterCategory[]
	allLabel: string
	emptyLabel: string
}) {
	const [filter, setFilter] = useState("all")

	const visible = useMemo(
		() =>
			filter === "all"
				? items
				: items.filter((item) => item.category === filter),
		[filter, items],
	)

	return (
		<div className="flex flex-col gap-8">
			{categories.length > 1 ? (
				<div
					className="flex flex-wrap gap-2"
					role="group"
					aria-label={allLabel}
				>
					<FilterChip
						active={filter === "all"}
						label={allLabel}
						count={items.length}
						onClick={() => setFilter("all")}
					/>
					{categories.map((category) => (
						<FilterChip
							key={category.id}
							active={filter === category.id}
							label={category.label}
							count={
								items.filter((item) => item.category === category.id).length
							}
							onClick={() => setFilter(category.id)}
						/>
					))}
				</div>
			) : null}

			{/* `layout` on the grid children is what produces the reflow animation:
			    surviving cards slide to their new slot instead of teleporting. The
			    `popLayout` mode takes leaving cards out of flow immediately, so the
			    remaining ones start moving during the exit rather than after it. */}
			<motion.div layout className={GRID_CLASS}>
				<AnimatePresence mode="popLayout" initial={false}>
					{visible.map((item) => (
						<motion.div
							key={item.id}
							layout
							initial={{ opacity: 0, scale: 0.94, y: 14 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.94, y: -8 }}
							transition={{ duration: 0.42, ease: EASE }}
							className="h-full"
						>
							{item.node}
						</motion.div>
					))}
				</AnimatePresence>
			</motion.div>

			{visible.length === 0 ? (
				<p className="py-12 text-center text-[14px] text-ink-faint">
					{emptyLabel}
				</p>
			) : null}
		</div>
	)
}

function FilterChip({
	active,
	label,
	count,
	onClick,
}: {
	active: boolean
	label: string
	count: number
	onClick: () => void
}) {
	// A category with nothing in it is rendered as a disabled chip rather than
	// hidden: a filter row whose options appear and disappear is disorienting,
	// and the zero count is itself useful information.
	const empty = count === 0

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={empty}
			aria-pressed={active}
			className={cn(
				"btn-sweep relative inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium tracking-tight transition-all duration-300",
				active
					? "border-brand-500/50 bg-brand-500/12 text-ink"
					: "border-line bg-white/[0.03] text-ink-muted hover:border-line-strong hover:text-ink",
				empty && "cursor-not-allowed opacity-40 hover:border-line",
			)}
		>
			{label}
			<span className="tabular-nums text-[11px] text-ink-faint">{count}</span>
		</button>
	)
}
