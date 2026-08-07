import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { ArrowRight, ArrowUpRight, Github, Pin, Users } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { GlassCard, TiltCard } from "@/components/ui/interactive"
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/motion"
import { ProjectsFilter } from "@/components/sections/ProjectsFilter"
import { PROJECT_CATEGORIES } from "@/constants"
import {
	Badge,
	buttonClass,
	Container,
	EmptyState,
	Section,
	SectionHeading,
} from "@/components/ui/primitives"
import { pick } from "@/lib/i18n-content"
import { compactNumber } from "@/lib/utils"
import type { Locale } from "@/i18n/routing"

export type ProjectRow = Record<string, unknown> & {
	id: string
	slug: string
	title: string
	category: string
	status: string
	coverImage?: string | null
	demoUrl?: string | null
	githubUrl?: string | null
	users?: number | null
	pinned?: boolean
	yearStart?: number | null
	yearEnd?: number | null
	technologies?: Array<{ id: string; name: string }>
}

/**
 * `status` is free-form text in the database and is editable from the admin
 * panel, so it is not guaranteed to match a translation key. next-intl throws
 * on a missing message, and a throw inside a Server Component aborts the whole
 * render, so the lookup is guarded and falls back to the raw value.
 */
function statusLabel(
	t: { (key: "status.active"): string; has: (key: string) => boolean },
	status: string,
): string {
	const key = `status.${status}`
	return t.has(key) ? t(key as "status.active") : status
}

/**
 * Same guard as `statusLabel`, for the category filter chips. `category` is
 * admin-editable free text, so a value outside `PROJECT_CATEGORIES` is possible
 * and must not throw.
 */
function categoryLabel(
	t: { (key: "category.web"): string; has: (key: string) => boolean },
	category: string,
): string {
	const key = `category.${category}`
	return t.has(key) ? t(key as "category.web") : category
}

const STATUS_TONE: Record<string, "success" | "brand" | "warning" | "muted"> = {
	active: "success",
	completed: "brand",
	demo: "warning",
	paused: "muted",
	planned: "muted",
}

export async function Projects({
	projects,
	locale,
	limit,
}: {
	projects: ProjectRow[]
	locale: Locale
	limit?: number
}) {
	const t = await getTranslations("projects")
	const visible = limit ? projects.slice(0, limit) : projects

	/* Filtering is only offered on the full listing. On the home page the section
	   is capped at a handful of pinned projects, where a filter row would mostly
	   render empty categories and add a control that does nothing useful. */
	const filterable = !limit && visible.length > 3

	/* Cards are rendered here, on the server, and passed to the client filter as
	   finished elements. See the note in `ProjectsFilter` for why. Ordering is
	   taken from `PROJECT_CATEGORIES` rather than from the data so the chip row
	   keeps a stable, deliberate order instead of following insertion order. */
	const presentCategories = filterable
		? PROJECT_CATEGORIES.filter((category) =>
				visible.some((project) => project.category === category),
			).map((category) => ({
				id: category as string,
				label: categoryLabel(t, category),
			}))
		: []

	const filterItems = filterable
		? await Promise.all(
				visible.map(async (project) => ({
					id: project.id,
					category: project.category,
					node: await ProjectCard({ project, locale }),
				})),
			)
		: []

	return (
		<Section id="projects">
			<Container>
				<Reveal>
					<SectionHeading
						eyebrow={t("eyebrow")}
						title={t("title")}
						description={t("subtitle")}
						actions={
							projects.length > 0 ? (
								<Link
									href="/projects"
									className={buttonClass("secondary", "md")}
								>
									{t("viewAll")}
									<ArrowRight className="h-4 w-4" strokeWidth={1.8} />
								</Link>
							) : undefined
						}
					/>
				</Reveal>

				{visible.length === 0 ? (
					<div className="mt-12">
						<EmptyState title={t("empty")} />
					</div>
				) : filterable ? (
					<div className="mt-12">
						<ProjectsFilter
							items={filterItems}
							categories={presentCategories}
							allLabel={t("filterAll")}
							emptyLabel={t("empty")}
						/>
					</div>
				) : (
					<StaggerGroup
						step={0.09}
						className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
					>
						{visible.map((project) => (
							<StaggerItem key={project.id} className="h-full">
								<ProjectCard project={project} locale={locale} />
							</StaggerItem>
						))}
					</StaggerGroup>
				)}
			</Container>
		</Section>
	)
}

export async function ProjectCard({
	project,
	locale,
}: {
	project: ProjectRow
	locale: Locale
}) {
	const t = await getTranslations("projects")
	const tagline = pick(project, "tagline", locale)
	const summary = pick(project, "summary", locale)
	const technologies = project.technologies ?? []
	const years = [project.yearStart, project.yearEnd].filter(Boolean).join(" — ")

	return (
		<TiltCard className="h-full" max={5}>
			<GlassCard className="group flex h-full flex-col overflow-hidden p-0">
				{/* Cover */}
				<div className="relative aspect-[16/10] w-full overflow-hidden">
					{project.coverImage ? (
						<Image
							src={project.coverImage}
							alt={project.title}
							fill
							sizes="(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 348px"
							className="object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.045]"
						/>
					) : (
						<div className="absolute inset-0 bg-brand-gradient-soft" />
					)}
					<div
						aria-hidden
						className="absolute inset-0 bg-gradient-to-t from-base via-base/35 to-transparent"
					/>

					<div className="absolute left-3.5 top-3.5 flex flex-wrap items-center gap-2">
						<Badge tone={STATUS_TONE[project.status] ?? "muted"}>
							{statusLabel(t, project.status)}
						</Badge>
						{project.pinned ? (
							<Badge tone="brand">
								<Pin className="h-3 w-3" strokeWidth={2} />
								{t("pinned")}
							</Badge>
						) : null}
					</div>

					{/* Category chip, top-right of the cover. */}
					<div className="absolute right-3.5 top-3.5">
						<span className="rounded-full border border-line bg-base/70 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-muted backdrop-blur-xl">
							{categoryLabel(t, project.category)}
						</span>
					</div>

					{/* Hover preview.

					    Deliberately `pointer-events-none` and `aria-hidden`: it is a
					    visual affordance for the link that already exists in the card
					    footer, not a second control. Making it focusable would add a
					    duplicate tab stop and a duplicate screen-reader announcement for
					    every card, which is a real accessibility regression in exchange
					    for no new capability. */}
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 grid place-items-center bg-base/45 opacity-0 backdrop-blur-[3px] transition-opacity duration-500 ease-premium group-hover:opacity-100"
					>
						<span className="inline-flex translate-y-2 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12.5px] font-medium tracking-tight text-ink shadow-glow transition-transform duration-500 ease-premium group-hover:translate-y-0">
							{t("viewProject")}
							<ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
						</span>
					</div>
				</div>

				{/* Body */}
				<div className="flex flex-1 flex-col p-5">
					<div className="flex items-start justify-between gap-3">
						<h3 className="text-[17px] font-semibold tracking-tight text-ink">
							{project.title}
						</h3>
						<span className="shrink-0 text-[11.5px] tabular-nums text-ink-faint">
							{years}
						</span>
					</div>

					{tagline ? (
						<p className="mt-1 text-[13px] font-medium tracking-tight text-brand-400">
							{tagline}
						</p>
					) : null}

					<p className="mt-3 line-clamp-3 text-[13.5px] leading-relaxed text-ink-muted">
						{summary}
					</p>

					{technologies.length > 0 ? (
						<ul className="mt-4 flex flex-wrap gap-1.5">
							{technologies.slice(0, 5).map((tech) => (
								<li
									key={tech.id}
									className="rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] tracking-tight text-ink-faint"
								>
									{tech.name}
								</li>
							))}
							{technologies.length > 5 ? (
								<li className="rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] text-ink-faint">
									+{technologies.length - 5}
								</li>
							) : null}
						</ul>
					) : null}

					{/* Footer */}
					<div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
						<Link
							href={`/projects/${project.slug}`}
							className="inline-flex items-center gap-1.5 text-[13px] font-medium tracking-tight text-ink transition-colors duration-300 hover:text-brand-400"
						>
							{t("viewProject")}
							<ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.9} />
						</Link>

						<div className="flex items-center gap-2.5">
							{project.users ? (
								<span className="inline-flex items-center gap-1 text-[11.5px] text-ink-faint">
									<Users className="h-3.5 w-3.5" strokeWidth={1.7} />
									{compactNumber(project.users)}
								</span>
							) : null}
							{project.githubUrl ? (
								<a
									href={project.githubUrl}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={t("github")}
									className="text-ink-faint transition-colors duration-200 hover:text-ink"
								>
									<Github className="h-4 w-4" strokeWidth={1.7} />
								</a>
							) : null}
							{project.demoUrl ? (
								<a
									href={project.demoUrl}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={t("demo")}
									className="text-ink-faint transition-colors duration-200 hover:text-ink"
								>
									<ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
								</a>
							) : null}
						</div>
					</div>
				</div>
			</GlassCard>
		</TiltCard>
	)
}
