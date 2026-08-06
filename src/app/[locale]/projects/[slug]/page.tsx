import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import {
	ArrowLeft,
	ArrowRight,
	Check,
	ExternalLink,
	Github,
	Play,
} from "lucide-react"
import { Icon } from "@/components/ui/Icon"
import { GlassCard } from "@/components/ui/interactive"
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/motion"
import {
	Badge,
	Container,
	Divider,
	LinkButton,
	Section,
} from "@/components/ui/primitives"
import { Link } from "@/i18n/navigation"
import { pick, pickArray } from "@/lib/i18n-content"
import { getProjectBySlug, getProjects } from "@/lib/queries"
import {
	breadcrumbSchema,
	buildMetadata,
	creativeWorkSchema,
	jsonLd,
} from "@/lib/seo"
import { AUTHOR_NAME } from "@/constants"
import { isLocale, type Locale } from "@/i18n/routing"

export const dynamic = "force-dynamic"

type Params = Promise<{ locale: string; slug: string }>

function yearRange(start?: number | null, end?: number | null) {
	if (!start) return null
	if (!end) return `${start} — …`
	if (start === end) return String(start)
	return `${start} — ${end}`
}

export async function generateMetadata({
	params,
}: {
	params: Params
}): Promise<Metadata> {
	const { locale: raw, slug } = await params
	const locale: Locale = isLocale(raw) ? raw : "uz"
	const project = await getProjectBySlug(slug)

	if (!project) {
		const t = await getTranslations({ locale, namespace: "projectDetail" })
		return buildMetadata({
			locale,
			path: `/projects/${slug}`,
			title: t("notFound"),
			description: t("notFound"),
			noIndex: true,
		})
	}

	return buildMetadata({
		locale,
		path: `/projects/${project.slug}`,
		title: project.title,
		description: pick(project, "summary", locale),
		keywords: project.technologies.map((tech) => tech.name),
		image: project.coverImage,
		type: "article",
	})
}

export default async function ProjectDetailPage({
	params,
}: {
	params: Params
}) {
	const { locale: raw, slug } = await params
	const locale: Locale = isLocale(raw) ? raw : "uz"

	const [project, all, t, tp] = await Promise.all([
		getProjectBySlug(slug),
		getProjects(),
		getTranslations("projectDetail"),
		getTranslations("projects"),
	])

	if (!project) notFound()

	const tagline = pick(project, "tagline", locale)
	const summary = pick(project, "summary", locale)
	const description = pick(project, "description", locale)
	const architecture = pick(project, "architecture", locale)
	const features = pickArray(project, "features", locale)
	const roadmap = pickArray(project, "roadmap", locale)
	const years = yearRange(project.yearStart, project.yearEnd)

	const currentIndex = all.findIndex((item) => item.slug === project.slug)
	const next = all.length > 1 ? all[(currentIndex + 1) % all.length] : null

	const facts = [
		{ id: "role", label: t("role"), value: project.role },
		{ id: "client", label: t("client"), value: project.client },
		{ id: "year", label: t("year"), value: years },
		{ id: "status", label: t("status"), value: tp(`status.${project.status}`) },
		{
			id: "users",
			label: t("users"),
			value: project.users ? `${project.users.toLocaleString("en-US")}+` : null,
		},
		{ id: "bot", label: t("bot"), value: project.botUsername },
		{ id: "version", label: t("version"), value: project.version },
	].filter((fact) => fact.value)

	const structuredData = [
		creativeWorkSchema({
			name: project.title,
			description: summary,
			path: `/projects/${project.slug}`,
			image: project.coverImage,
			author: AUTHOR_NAME,
			keywords: project.technologies.map((tech) => tech.name),
			dateCreated: project.yearStart,
		}),
		breadcrumbSchema([
			{ name: tp("title"), path: "/projects" },
			{ name: project.title, path: `/projects/${project.slug}` },
		]),
	]

	return (
		<article className="pt-[calc(var(--nav-height)+28px)]">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
			/>

			<Container>
				<Link
					href="/projects"
					className="inline-flex items-center gap-2 text-sm text-ink-muted transition hover:text-ink"
				>
					<ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
					{t("back")}
				</Link>

				<Reveal>
					<header className="mt-7">
						<div className="flex flex-wrap items-center gap-2">
							<Badge tone="brand">{tp(`category.${project.category}`)}</Badge>
							<Badge tone={project.status === "active" ? "success" : "neutral"}>
								{tp(`status.${project.status}`)}
							</Badge>
							{years ? <Badge tone="muted">{years}</Badge> : null}
						</div>

						<h1 className="mt-4 text-display-lg font-semibold tracking-tight text-ink">
							{project.title}
						</h1>

						{tagline ? (
							<p className="mt-3 max-w-[62ch] text-lg leading-relaxed text-ink-muted">
								{tagline}
							</p>
						) : null}

						<div className="mt-6 flex flex-wrap gap-2.5">
							{project.demoUrl ? (
								<LinkButton href={project.demoUrl} size="sm">
									<ExternalLink className="h-4 w-4" strokeWidth={1.8} />
									{t("openDemo")}
								</LinkButton>
							) : null}
							{project.githubUrl ? (
								<LinkButton
									href={project.githubUrl}
									variant="secondary"
									size="sm"
								>
									<Github className="h-4 w-4" strokeWidth={1.8} />
									{t("sourceCode")}
								</LinkButton>
							) : null}
							{project.videoUrl ? (
								<LinkButton
									href={project.videoUrl}
									variant="ghost"
									size="sm"
								>
									<Play className="h-4 w-4" strokeWidth={1.8} />
									Video
								</LinkButton>
							) : null}
						</div>
					</header>
				</Reveal>

				{project.coverImage ? (
					<Reveal delay={0.06}>
						<div className="relative mt-9 aspect-[16/9] overflow-hidden rounded-xl border border-line">
							<Image
								src={project.coverImage}
								alt={project.title}
								fill
								priority
								sizes="(max-width: 1120px) 100vw, 1120px"
								className="object-cover"
							/>
							<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/70 via-transparent to-transparent" />
						</div>
					</Reveal>
				) : null}

				{project.isDraftInfo ? (
					<Reveal>
						<p className="mt-6 rounded-md border border-warning/30 bg-warning/[0.06] px-4 py-3 text-sm leading-relaxed text-warning">
							{t("draftNotice")}
						</p>
					</Reveal>
				) : null}
			</Container>

			<Section>
				<Container>
					<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
						<div className="space-y-12">
							<Reveal>
								<section>
									<h2 className="text-display-md font-semibold text-ink">
										{t("overview")}
									</h2>
									<div className="mt-4 space-y-4 text-[15px] leading-[1.75] text-ink-muted">
										<p>{summary}</p>
										{description
											? description
													.split(/\n{2,}|\n/)
													.filter(Boolean)
													.map((paragraph, index) => (
														<p key={index}>{paragraph}</p>
													))
											: null}
									</div>
								</section>
							</Reveal>

							{features.length > 0 ? (
								<section>
									<Reveal>
										<h2 className="text-display-md font-semibold text-ink">
											{t("features")}
										</h2>
									</Reveal>
									<StaggerGroup
										step={0.05}
										className="mt-5 grid gap-3 sm:grid-cols-2"
									>
										{features.map((feature, index) => (
											<StaggerItem key={index}>
												<div className="flex h-full items-start gap-3 rounded-lg border border-line bg-glass p-4">
													<span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-gradient text-base">
														<Check className="h-3 w-3" strokeWidth={3} />
													</span>
													<p className="text-sm leading-relaxed text-ink-muted">
														{feature}
													</p>
												</div>
											</StaggerItem>
										))}
									</StaggerGroup>
								</section>
							) : null}

							{architecture ? (
								<Reveal>
									<section>
										<h2 className="text-display-md font-semibold text-ink">
											{t("architecture")}
										</h2>
										<pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-base-soft p-5 font-mono text-[13px] leading-relaxed text-ink-muted">
											{architecture}
										</pre>
									</section>
								</Reveal>
							) : null}

							{roadmap.length > 0 ? (
								<section>
									<Reveal>
										<h2 className="text-display-md font-semibold text-ink">
											{t("roadmap")}
										</h2>
									</Reveal>
									<StaggerGroup step={0.05} className="mt-5 space-y-2.5">
										{roadmap.map((item, index) => (
											<StaggerItem key={index}>
												<div className="flex items-start gap-3.5 rounded-lg border border-line/70 bg-glass px-4 py-3.5">
													<span className="font-mono text-xs text-accent">
														{String(index + 1).padStart(2, "0")}
													</span>
													<p className="text-sm leading-relaxed text-ink-muted">
														{item}
													</p>
												</div>
											</StaggerItem>
										))}
									</StaggerGroup>
								</section>
							) : null}

							{project.images.length > 0 ? (
								<section>
									<Reveal>
										<h2 className="text-display-md font-semibold text-ink">
											{t("gallery")}
										</h2>
									</Reveal>
									<StaggerGroup
										step={0.06}
										className="mt-5 grid gap-4 sm:grid-cols-2"
									>
										{project.images.map((image) => (
											<StaggerItem key={image.id}>
												<figure>
													<div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-line">
														<Image
															src={image.url}
															alt={image.alt ?? project.title}
															fill
															sizes="(max-width: 640px) 100vw, 520px"
															className="object-cover"
														/>
													</div>
													{image.caption ? (
														<figcaption className="mt-2 text-xs text-ink-faint">
															{image.caption}
														</figcaption>
													) : null}
												</figure>
											</StaggerItem>
										))}
									</StaggerGroup>
								</section>
							) : null}
						</div>

						<aside className="lg:sticky lg:top-[calc(var(--nav-height)+24px)] lg:h-fit">
							<Reveal delay={0.08}>
								<GlassCard className="p-5">
									<h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
										{t("info")}
									</h2>

									<dl className="mt-4 space-y-3">
										{facts.map((fact) => (
											<div
												key={fact.id}
												className="flex items-baseline justify-between gap-4"
											>
												<dt className="text-xs uppercase tracking-[0.1em] text-ink-faint">
													{fact.label}
												</dt>
												<dd className="text-right text-sm font-medium text-ink">
													{fact.value}
												</dd>
											</div>
										))}
									</dl>

									{project.technologies.length > 0 ? (
										<>
											<Divider />
											<h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
												{t("technologies")}
											</h3>
											<ul className="mt-3.5 flex flex-wrap gap-1.5">
												{project.technologies.map((tech) => (
													<li
														key={tech.id}
														className="inline-flex items-center gap-1.5 rounded-md border border-line bg-glass px-2.5 py-1.5 text-xs text-ink-muted"
													>
														<Icon
															name={tech.icon}
															className="h-3.5 w-3.5"
															strokeWidth={1.8}
														/>
														{tech.name}
													</li>
												))}
											</ul>
										</>
									) : null}
								</GlassCard>
							</Reveal>
						</aside>
					</div>

					{next ? (
						<Reveal>
							<Link
								href={`/projects/${next.slug}`}
								className="group mt-16 flex items-center justify-between gap-6 rounded-xl border border-line bg-glass px-6 py-6 transition duration-300 hover:border-line-strong hover:bg-glass-hover"
							>
								<span className="min-w-0">
									<span className="block text-xs uppercase tracking-[0.16em] text-ink-faint">
										{t("next")}
									</span>
									<span className="mt-1.5 block truncate text-lg font-medium text-ink">
										{next.title}
									</span>
								</span>
								<ArrowRight
									className="h-5 w-5 shrink-0 text-ink-muted transition group-hover:translate-x-1 group-hover:text-brand-400"
									strokeWidth={1.8}
								/>
							</Link>
						</Reveal>
					) : null}
				</Container>
			</Section>
		</article>
	)
}
