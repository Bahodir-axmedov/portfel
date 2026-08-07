import Link from "next/link"
import { AdminShell } from "@/components/admin/AdminShell"
import {
	AnimatedBarList,
	StatValue,
	TrafficChart,
} from "@/components/admin/AdminCharts"
import { Icon } from "@/components/ui/Icon"
import { getAnalyticsSummary, pruneOldPageViews } from "@/lib/analytics"
import { delegateFor, hasPublishedField } from "@/lib/admin-data"
import { prisma } from "@/lib/prisma"
import { adminResources } from "@/lib/resources"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type ResourceStat = {
	key: string
	label: string
	icon: string
	total: number
	drafts: number
}

/**
 * Per-resource counts.
 *
 * The dashboard used to show four hardcoded numbers (projects, skills,
 * messages, views), so fifteen of the seventeen editable sections were
 * invisible from the home screen. Counting is driven by the same resource
 * registry the sidebar uses, which means a new resource shows up here for free.
 */
async function resourceStats(): Promise<ResourceStat[]> {
	const stats = await Promise.all(
		adminResources.map(async (config) => {
			const delegate = delegateFor(config)
			const total = await delegate.count()
			const drafts = hasPublishedField(config)
				? await delegate.count({ where: { published: false } })
				: 0
			return {
				key: config.key,
				label: config.label,
				icon: config.icon,
				total,
				drafts,
			}
		}),
	)
	return stats
}

function StatCard({
	label,
	value,
	hint,
	icon,
	trend,
}: {
	label: string
	value: string | number
	hint?: string
	icon: string
	trend?: number
}) {
	return (
		<div className="card-surface group relative overflow-hidden rounded-lg p-5 transition-colors duration-300 hover:border-line-strong">
			{/* Hover sheen. `-inset-px` so the gradient reaches under the 1px
			    border instead of stopping short of it and leaving a dark hairline. */}
			<span
				aria-hidden
				className="pointer-events-none absolute -inset-px rounded-lg bg-gradient-to-br from-brand-500/[0.09] via-transparent to-accent-500/[0.07] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
			/>
			<div className="relative flex items-start justify-between gap-3">
				<p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
					{label}
				</p>
				<span className="grid h-8 w-8 place-items-center rounded-md border border-line bg-white/[0.03] transition-colors duration-300 group-hover:border-brand-500/40">
					<Icon name={icon} className="h-4 w-4 text-brand-300" />
				</span>
			</div>
			<p className="relative mt-3 text-3xl font-semibold tabular-nums">
				{typeof value === "number" ? <StatValue value={value} /> : value}
			</p>
			<div className="relative mt-1.5 flex items-center gap-2">
				{hint ? <p className="text-xs text-ink-faint">{hint}</p> : null}
				{trend !== undefined && trend !== 0 ? (
					<span
						className={cn(
							"inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
							trend > 0
								? "bg-success/10 text-success"
								: "bg-danger/10 text-danger",
						)}
					>
						{trend > 0 ? "+" : ""}
						{trend}%
					</span>
				) : null}
			</div>
		</div>
	)
}

function Panel({
	title,
	action,
	children,
}: {
	title: string
	action?: React.ReactNode
	children: React.ReactNode
}) {
	return (
		<section className="card-surface rounded-lg p-5">
			<div className="mb-4 flex items-center justify-between gap-3">
				<h2 className="text-sm font-semibold">{title}</h2>
				{action}
			</div>
			{children}
		</section>
	)
}

export default async function AdminDashboard() {
	// Opportunistic retention pass — keeps the volume from filling up without
	// needing a cron container.
	void pruneOldPageViews()

	const [analytics, stats, recentMessages, latestProjects] = await Promise.all([
		getAnalyticsSummary(),
		resourceStats(),
		prisma.contactMessage.findMany({
			orderBy: { createdAt: "desc" },
			take: 5,
			select: {
				id: true,
				name: true,
				email: true,
				subject: true,
				read: true,
				createdAt: true,
			},
		}),
		prisma.project.findMany({
			orderBy: { updatedAt: "desc" },
			take: 5,
			select: { id: true, title: true, published: true, updatedAt: true },
		}),
	])

	const totalDrafts = stats.reduce((sum, item) => sum + item.drafts, 0)
	const totalRows = stats.reduce((sum, item) => sum + item.total, 0)
	const maxDaily = Math.max(...analytics.daily.map((day) => day.views), 1)
	const dateFormat = new Intl.DateTimeFormat("uz-UZ", {
		day: "2-digit",
		month: "short",
	})

	return (
		<AdminShell
			title="Boshqaruv paneli"
			description="Sayt holati, tashriflar va oxirgi o'zgarishlar"
			actions={
				<Link
					href="/"
					target="_blank"
					rel="noreferrer"
					className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm transition hover:border-line-strong"
				>
					<Icon name="ExternalLink" className="h-4 w-4" />
					Saytni ko&apos;rish
				</Link>
			}
		>
			<div className="space-y-6">
				{/* ---------- headline numbers ---------- */}
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<StatCard
						label="30 kunlik tashrif"
						value={analytics.last30Days}
						hint={`Oldingi 30 kun: ${analytics.previous30Days}`}
						icon="LineChart"
						trend={analytics.trend}
					/>
					<StatCard
						label="7 kunlik tashrif"
						value={analytics.last7Days}
						hint={`Jami: ${analytics.total}`}
						icon="Activity"
					/>
					<StatCard
						label="O'qilmagan xabar"
						value={analytics.unreadMessages}
						hint="Kontakt formasi"
						icon="MessagesSquare"
					/>
					<StatCard
						label="Qoralama yozuvlar"
						value={totalDrafts}
						hint={`Jami ${totalRows} ta yozuv`}
						icon="FileText"
					/>
				</div>

				{/* ---------- unpublished warning ---------- */}
				{totalDrafts > 0 ? (
					<div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
						<Icon name="CircleDot" className="h-4 w-4 shrink-0 text-warning" />
						<p className="text-ink-muted">
							<span className="font-medium text-ink">
								{totalDrafts} ta yozuv
							</span>{" "}
							hali chop etilmagan — ular saytda ko&apos;rinmaydi.
						</p>
						<div className="ml-auto flex flex-wrap gap-2">
							{stats
								.filter((item) => item.drafts > 0)
								.slice(0, 4)
								.map((item) => (
									<Link
										key={item.key}
										href={`/admin/${item.key}?published=false`}
										className="rounded-md border border-line px-2.5 py-1 text-xs transition hover:border-line-strong"
									>
										{item.label} ({item.drafts})
									</Link>
								))}
						</div>
					</div>
				) : null}

				{/* ---------- traffic chart ---------- */}
				<Panel
					title={`Oxirgi ${analytics.daily.length} kun`}
					action={
						<span className="font-mono text-[11px] text-ink-faint">
							max {maxDaily}/kun
						</span>
					}
				>
					<TrafficChart data={analytics.daily} />
				</Panel>

				{/* ---------- breakdowns ---------- */}
				<div className="grid gap-4 lg:grid-cols-3">
					<Panel title="Eng ko'p ochilgan sahifalar">
						<AnimatedBarList
							items={analytics.topPaths.map((item) => ({
								label: item.path,
								value: item.views,
							}))}
						/>
					</Panel>
					<Panel title="Til bo'yicha">
						<AnimatedBarList
							items={analytics.byLocale.map((item) => ({
								label: item.locale.toUpperCase(),
								value: item.views,
							}))}
						/>
					</Panel>
					<Panel title="Havola manbalari">
						<AnimatedBarList
							items={analytics.topReferrers.map((item) => ({
								label: item.referrer,
								value: item.views,
							}))}
						/>
					</Panel>
				</div>

				{/* ---------- recent activity ---------- */}
				<div className="grid gap-4 lg:grid-cols-2">
					<Panel
						title="Oxirgi xabarlar"
						action={
							<Link
								href="/admin/messages"
								className="text-xs text-brand-300 transition hover:text-brand-200"
							>
								Hammasi
							</Link>
						}
					>
						{recentMessages.length === 0 ? (
							<p className="text-xs text-ink-faint">
								Hozircha xabar yo&apos;q.
							</p>
						) : (
							<ul className="space-y-2.5">
								{recentMessages.map((message) => (
									<li
										key={message.id}
										className="flex items-start gap-3 border-b border-line/50 pb-2.5 last:border-0 last:pb-0"
									>
										<span
											className={cn(
												"mt-1.5 size-1.5 shrink-0 rounded-full",
												message.read ? "bg-line-strong" : "bg-brand-400",
											)}
										/>
										<div className="min-w-0 flex-1">
											<p className="truncate text-xs font-medium">
												{message.name}{" "}
												<span className="font-normal text-ink-faint">
													{message.email}
												</span>
											</p>
											<p className="truncate text-xs text-ink-muted">
												{message.subject || "(mavzusiz)"}
											</p>
										</div>
										<span className="shrink-0 font-mono text-[10px] text-ink-faint">
											{dateFormat.format(message.createdAt)}
										</span>
									</li>
								))}
							</ul>
						)}
					</Panel>

					<Panel
						title="Oxirgi tahrirlangan loyihalar"
						action={
							<Link
								href="/admin/projects"
								className="text-xs text-brand-300 transition hover:text-brand-200"
							>
								Hammasi
							</Link>
						}
					>
						{latestProjects.length === 0 ? (
							<p className="text-xs text-ink-faint">
								Loyiha qo&apos;shilmagan.
							</p>
						) : (
							<ul className="space-y-2.5">
								{latestProjects.map((project) => (
									<li key={project.id}>
										<Link
											href={`/admin/projects/${project.id}`}
											className="flex items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-glass"
										>
											<span
												className={cn(
													"size-1.5 shrink-0 rounded-full",
													project.published ? "bg-success" : "bg-warning",
												)}
											/>
											<span className="min-w-0 flex-1 truncate text-xs">
												{project.title}
											</span>
											<span className="shrink-0 font-mono text-[10px] text-ink-faint">
												{dateFormat.format(project.updatedAt)}
											</span>
										</Link>
									</li>
								))}
							</ul>
						)}
					</Panel>
				</div>

				{/* ---------- every resource ---------- */}
				<Panel title="Barcha bo'limlar">
					<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{stats.map((item) => (
							<Link
								key={item.key}
								href={`/admin/${item.key}`}
								className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5 transition hover:border-line-strong hover:bg-glass"
							>
								<Icon name={item.icon} className="h-4 w-4 text-brand-300" />
								<span className="min-w-0 flex-1 truncate text-xs">
									{item.label}
								</span>
								<span className="font-mono text-xs tabular-nums text-ink-faint">
									{item.total}
								</span>
								{item.drafts > 0 ? (
									<span className="rounded-full bg-warning/15 px-1.5 text-[10px] text-warning">
										{item.drafts}
									</span>
								) : null}
							</Link>
						))}
					</div>
				</Panel>
			</div>
		</AdminShell>
	)
}
