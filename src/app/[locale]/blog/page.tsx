import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowUpRight, Clock, Eye } from "lucide-react"
import { BlogList, type BlogListItem } from "@/components/sections/BlogList"
import { GlassCard } from "@/components/ui/interactive"
import { Container, Section, SectionHeading } from "@/components/ui/primitives"
import { pick } from "@/lib/i18n-content"
import { estimateReadMinutes, toPlainText } from "@/lib/markdown"
import { getPosts, getSeoForRoute } from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"
import { parseArray } from "@/lib/utils"
import { isLocale, type Locale } from "@/i18n/routing"

export const dynamic = "force-dynamic"

const LOCALE_TAGS: Record<Locale, string> = {
	uz: "uz-UZ",
	ru: "ru-RU",
	en: "en-US",
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale: raw } = await params
	const locale: Locale = isLocale(raw) ? raw : "uz"

	const [seo, t] = await Promise.all([
		getSeoForRoute("/blog"),
		getTranslations({ locale, namespace: "blog" }),
	])

	return buildMetadata({
		locale,
		path: "/blog",
		title: pick(seo, "title", locale) || t("title"),
		description: pick(seo, "description", locale) || t("subtitle"),
		keywords: parseArray(seo?.keywords),
		image: seo?.ogImage ?? null,
		noIndex: seo?.noIndex ?? false,
	})
}

export default async function BlogPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale: raw } = await params
	const locale: Locale = isLocale(raw) ? raw : "uz"

	const [posts, t] = await Promise.all([
		getPosts(),
		getTranslations({ locale, namespace: "blog" }),
	])

	const dateFormat = new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
		day: "numeric",
		month: "long",
		year: "numeric",
	})

	const items: BlogListItem[] = posts.map((post) => {
		const title = pick(post, "title", locale)
		const body = pick(post, "content", locale)
		const excerpt = pick(post, "excerpt", locale) || toPlainText(body, 150)
		const tags = parseArray(post.tags)

		// `readMinutes` defaults to 3 in the schema, so a value the author never
		// touched would claim "3 min" for a twenty-minute article. The stored
		// number is treated as an override only when it differs from that default.
		const minutes =
			post.readMinutes && post.readMinutes !== 3
				? post.readMinutes
				: estimateReadMinutes(body)

		const published = post.publishedAt ?? post.createdAt

		return {
			id: post.id,
			tags,
			search: [title, excerpt, tags.join(" ")].join(" ").toLowerCase(),
			node: (
				<GlassCard className="group flex h-full flex-col overflow-hidden p-0">
					<Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
						<div className="relative aspect-[16/9] w-full overflow-hidden">
							{post.coverImage ? (
								<Image
									src={post.coverImage}
									alt={title}
									fill
									sizes="(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 348px"
									className="object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.045]"
								/>
							) : (
								<div className="absolute inset-0 bg-brand-gradient-soft" />
							)}
							<div
								aria-hidden
								className="absolute inset-0 bg-gradient-to-t from-base via-base/30 to-transparent"
							/>
						</div>

						<div className="flex flex-1 flex-col p-5">
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">
								<time dateTime={published.toISOString()}>
									{dateFormat.format(published)}
								</time>
								<span className="inline-flex items-center gap-1">
									<Clock className="h-3 w-3" />
									{minutes} {t("minutesShort")}
								</span>
								{post.views > 0 ? (
									<span className="inline-flex items-center gap-1">
										<Eye className="h-3 w-3" />
										{post.views}
									</span>
								) : null}
							</div>

							<h2 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-brand-200">
								{title}
							</h2>

							{excerpt ? (
								<p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
									{excerpt}
								</p>
							) : null}

							{tags.length > 0 ? (
								<div className="mt-4 flex flex-wrap gap-1.5">
									{tags.slice(0, 3).map((tag) => (
										<span
											key={tag}
											className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-ink-faint"
										>
											{tag}
										</span>
									))}
								</div>
							) : null}

							<span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-brand-300 transition-colors group-hover:text-brand-200">
								{t("read")}
								<ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
							</span>
						</div>
					</Link>
				</GlassCard>
			),
		}
	})

	// Tag order follows first appearance in the (date-sorted) post list rather
	// than alphabetical order, so the newest topics lead the filter row.
	const tags: string[] = []
	for (const item of items) {
		for (const tag of item.tags) {
			if (!tags.includes(tag)) tags.push(tag)
		}
	}

	return (
		<div className="pt-[var(--nav-height)]">
			<Section id="blog">
				<Container>
					<SectionHeading
						eyebrow={t("eyebrow")}
						title={t("title")}
						description={t("subtitle")}
					/>

					<div className="mt-10">
						{items.length === 0 ? (
							<p className="rounded-lg border border-dashed border-line py-16 text-center text-sm text-ink-faint">
								{t("empty")}
							</p>
						) : (
							<BlogList
								items={items}
								tags={tags}
								allLabel={t("all")}
								searchLabel={t("search")}
								emptyLabel={t("noResults")}
								clearLabel={t("clear")}
								countTemplate={t("count")}
							/>
						)}
					</div>
				</Container>
			</Section>
		</div>
	)
}
