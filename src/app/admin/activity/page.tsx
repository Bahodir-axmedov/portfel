import Link from "next/link"
/*
 * Only icon names already imported elsewhere in this repository are used here.
 * esbuild does not resolve package exports, so a name that does not exist in
 * the installed lucide-react version compiles cleanly in the sandbox and then
 * fails the real build with "is not exported from" -- exactly how `SiLinkedin`
 * broke a previous deploy. Sticking to proven names removes that class of risk.
 */
import {
	Activity,
	ArrowRight,
	Download,
	FileText,
	ShieldCheck,
	Sparkles,
	Upload,
	X,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import {
	getActivityLogs,
	getActivityResources,
	pruneOldActivity,
} from "@/lib/activity"
import { getResource } from "@/lib/resources"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 40

const ACTION_META: Record<
	string,
	{ label: string; icon: typeof Activity; tone: string }
> = {
	create: {
		label: "Qo'shildi",
		icon: Sparkles,
		tone: "text-success border-success/30 bg-success/10",
	},
	update: {
		label: "Tahrirlandi",
		icon: FileText,
		tone: "text-brand-300 border-brand-500/30 bg-brand-500/10",
	},
	delete: {
		label: "O'chirildi",
		icon: X,
		tone: "text-danger border-danger/30 bg-danger/10",
	},
	login: {
		label: "Kirish",
		icon: ShieldCheck,
		tone: "text-ink-muted border-line bg-white/[0.03]",
	},
	logout: {
		label: "Chiqish",
		icon: ArrowRight,
		tone: "text-ink-muted border-line bg-white/[0.03]",
	},
	upload: {
		label: "Yuklandi",
		icon: Upload,
		tone: "text-accent-300 border-accent-500/30 bg-accent-500/10",
	},
	restore: {
		label: "Tiklandi",
		icon: Download,
		tone: "text-warning border-warning/30 bg-warning/10",
	},
}

const dateFormat = new Intl.DateTimeFormat("uz-UZ", {
	day: "2-digit",
	month: "short",
	hour: "2-digit",
	minute: "2-digit",
})

/** Turns a resource key into the label already used in the sidebar. */
function resourceLabel(key: string): string {
	if (key === "auth") return "Hisob"
	if (key === "media") return "Media"
	if (key === "backup") return "Zaxira"
	return getResource(key)?.label ?? key
}

/**
 * Admin audit trail.
 *
 * Read-only by design. Entries are never editable from the UI, because a log
 * that its own operator can rewrite proves nothing.
 */
export default async function AdminActivityPage({
	searchParams,
}: {
	searchParams: Promise<{ resource?: string; action?: string; page?: string }>
}) {
	const {
		resource: rawResource,
		action: rawAction,
		page: rawPage,
	} = await searchParams

	const parsedPage = Number.parseInt(rawPage ?? "1", 10)
	const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

	// Only whitelisted values reach the query, so a hand-edited URL cannot turn
	// the filter into an arbitrary Prisma condition.
	const action = rawAction && rawAction in ACTION_META ? rawAction : undefined

	// Housekeeping runs here rather than on a timer: this deployment has no cron
	// and the page is visited rarely enough that the delete is cheap.
	void pruneOldActivity()

	const resources = await getActivityResources()
	const resource =
		rawResource && resources.includes(rawResource) ? rawResource : undefined

	const { rows, total } = await getActivityLogs({
		resource,
		action,
		limit: PAGE_SIZE,
		skip: (page - 1) * PAGE_SIZE,
	})

	const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

	const buildHref = (next: Record<string, string | undefined>) => {
		const query = new URLSearchParams()
		const merged = { resource, action, page: String(page), ...next }
		for (const [key, value] of Object.entries(merged)) {
			if (value && value !== "1") query.set(key, value)
		}
		const suffix = query.toString()
		return suffix ? `/admin/activity?${suffix}` : "/admin/activity"
	}

	return (
		<AdminShell
			title="Faoliyat jurnali"
			description={total ? `${total} ta yozuv` : "Hozircha yozuv yo'q"}
		>
			<div className="flex flex-wrap gap-2">
				<FilterChip
					href={buildHref({ action: undefined, page: "1" })}
					active={!action}
				>
					Barcha amallar
				</FilterChip>
				{Object.entries(ACTION_META).map(([key, meta]) => (
					<FilterChip
						key={key}
						href={buildHref({ action: key, page: "1" })}
						active={action === key}
					>
						{meta.label}
					</FilterChip>
				))}
			</div>

			{resources.length > 1 ? (
				<div className="mt-3 flex flex-wrap gap-2">
					<FilterChip
						href={buildHref({ resource: undefined, page: "1" })}
						active={!resource}
					>
						Barcha bo&apos;limlar
					</FilterChip>
					{resources.map((key) => (
						<FilterChip
							key={key}
							href={buildHref({ resource: key, page: "1" })}
							active={resource === key}
						>
							{resourceLabel(key)}
						</FilterChip>
					))}
				</div>
			) : null}

			{rows.length === 0 ? (
				<p className="mt-8 rounded-lg border border-dashed border-line py-16 text-center text-sm text-ink-faint">
					Hech qanday yozuv topilmadi.
				</p>
			) : (
				<ul className="card-surface mt-6 divide-y divide-line overflow-hidden p-0">
					{rows.map((row) => {
						const meta = ACTION_META[row.action] ?? {
							label: row.action,
							icon: Activity,
							tone: "text-ink-muted border-line bg-white/[0.03]",
						}
						const ActionIcon = meta.icon

						return (
							<li
								key={row.id}
								className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-white/[0.02]"
							>
								<span
									className={cn(
										"inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]",
										meta.tone,
									)}
								>
									<ActionIcon className="h-3 w-3" />
									{meta.label}
								</span>

								<span className="shrink-0 text-xs text-ink-faint">
									{resourceLabel(row.resource)}
								</span>

								<span className="min-w-0 flex-1 truncate text-sm text-ink">
									{row.label ?? row.entityId ?? "—"}
								</span>

								<span className="shrink-0 text-xs text-ink-faint">
									{row.actor}
								</span>

								<time
									dateTime={row.createdAt.toISOString()}
									className="shrink-0 font-mono text-[11px] text-ink-faint"
								>
									{dateFormat.format(row.createdAt)}
								</time>
							</li>
						)
					})}
				</ul>
			)}

			{pageCount > 1 ? (
				<div className="mt-6 flex items-center justify-between text-xs text-ink-muted">
					<PagerLink
						href={buildHref({ page: String(page - 1) })}
						disabled={page <= 1}
					>
						Oldingi
					</PagerLink>
					<span>
						{page} / {pageCount}
					</span>
					<PagerLink
						href={buildHref({ page: String(page + 1) })}
						disabled={page >= pageCount}
					>
						Keyingi
					</PagerLink>
				</div>
			) : null}
		</AdminShell>
	)
}

function FilterChip({
	href,
	active,
	children,
}: {
	href: string
	active: boolean
	children: React.ReactNode
}) {
	return (
		<Link
			href={href}
			aria-current={active ? "page" : undefined}
			className={cn(
				"rounded-full border px-3 py-1.5 text-xs transition-colors",
				active
					? "border-brand-500/60 bg-brand-500/12 text-ink"
					: "border-line text-ink-muted hover:border-line-strong hover:text-ink",
			)}
		>
			{children}
		</Link>
	)
}

function PagerLink({
	href,
	disabled,
	children,
}: {
	href: string
	disabled: boolean
	children: React.ReactNode
}) {
	/* A disabled pager renders as plain text rather than a dead link, so
	   keyboard users never land on a control that does nothing. */
	if (disabled) {
		return <span className="text-ink-faint">{children}</span>
	}

	return (
		<Link
			href={href}
			className="rounded-md border border-line px-3 py-1.5 transition-colors hover:border-line-strong hover:text-ink"
		>
			{children}
		</Link>
	)
}
