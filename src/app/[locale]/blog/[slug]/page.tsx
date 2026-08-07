import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowLeft, Clock, Eye } from "lucide-react"
import { Markdown } from "@/components/ui/Markdown"
import { Container, Section } from "@/components/ui/primitives"
import { pick } from "@/lib/i18n-content"
import { estimateReadMinutes, toPlainText } from "@/lib/markdown"
import { getPostBySlug, getPosts, incrementPostViews } from "@/lib/queries"
import { absolute, buildMetadata, jsonLd, localePath } from "@/lib/seo"
import { parseArray } from "@/lib/utils"
import { isLocale, type Locale } from "@/i18n/routing"

export const dynamic = "force-dynamic"

const LOCALE_TAGS: Record<Locale, string> = {
	uz: "uz-UZ",
	ru: "ru-RU",
	en: "en-US",
}

/** Shared by the page and its metadata so the post is read once per request. */
async function load(rawLocale: string, slug: string) {
	const locale: Locale = isLocale(rawLocale) ? rawLocale : "uz"
	const post = await getPostBySlug(slug)
	return { locale, post }
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
	const { locale: raw, slug } = await params
	const { locale, post } = await load(raw, slug)

	if (!post) {
		// A deleted or unpublished post must not stay in the index.
		return { title: "404", robots: { index: false, follow: false } }
	}

	const title = pick(post, "title", locale)
	const body = pick(post, "content", locale)
	const description =
		pick(post, "excerpt", locale) || toPlainText(body, 160) || title

	return buildMetadata({
		locale,
		path: `/blog/${post.slug}`,
		title,
		description,
		keywords: parseArray(post.tags),
		image: post.coverImage ?? null,
		type: "article",
		publishedTime: (post.publishedAt ?? post.createdAt).toISOString(),
	})
}

export default async function BlogPostPage({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>
}) {
	const { locale: raw, slug } = await params
	const { locale, post } = await load(raw, slug)

	if (!post) notFound()

	const t = await getTranslations({ locale, namespace: "blog" })

	const title = pick(post, "title", locale)
	const body = pick(post, "content", locale)
	const excerpt = pick(post, "excerpt", locale)
	const tags = parseArray(post.tags)
	const published = post.publishedAt ?? post.createdAt

	const minutes =
		post.readMinutes && post.readMinutes !== 3
			? post.readMinutes
			: estimateReadMinutes(body)

	// Fire-and-forget: the counter must never delay or break the render, and
	// `incrementPostViews` already swallows its own errors. It is intentionally
	// not awaited so a slow write cannot hold the response open.
	void incrementPostViews(post.id)

	const dateFormat = new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
		day: "numeric",
		month: "long",
		year: "numeric",
	})

	const all = await getPosts()
	const related = all.filter((item) => item.id !== post.id).slice(0, 3)

	const articleSchema = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: title,
		description: excerpt || toPlainText(body, 160),
		datePublished: published.toISOString(),
		dateModified: post.updatedAt.toISOString(),
		author: { "@type": "Person", name: "Bahodir Axmedov" },
		mainEntityOfPage: absolute(localePath(locale, `/blog/${post.slug}`)),
		...(post.coverImage ? { image: absolute(post.coverImage) } : {}),
		...(tags.length ? { keywords: tags.join(", ") } : {}),
	}

	return (
		<div className="pt-[var(--nav-height)]">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }}
			/>

			<Section>
				<Container>
					<Link
						href="/blog"
						className="inline-flex items-center gap-2 text-xs text-ink-muted transition-colors hover:text-ink"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						{t("back")}
					</Link>

					<article className="mx-auto mt-8 max-w-[720px]">
						<header>
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
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

							<h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
								{title}
							</h1>

							{excerpt ? (
								<p className="mt-4 text-base leading-relaxed text-ink-muted">
									{excerpt}
								</p>
							) : null}

							{tags.length > 0 ? (
								<div className="mt-5 flex flex-wrap gap-1.5">
									{tags.map((tag) => (
										<span
											key={tag}
											className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-ink-faint"
										>
											{tag}
										</span>
									))}
								</div>
							) : null}
						</header>

						{post.coverImage ? (
							<div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-lg border border-line">
								<Image
									src={post.coverImage}
									alt={title}
									fill
									priority
									sizes="(max-width: 768px) 92vw, 720px"
									className="object-cover"
								/>
							</div>
						) : null}

						<Markdown source={body} className="mt-8" />
					</article>

					{related.length > 0 ? (
						<div className="mx-auto mt-16 max-w-[720px] border-t border-line pt-8">
							<h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
								{t("more")}
							</h2>
							<ul className="mt-4 space-y-1">
								{related.map((item) => (
									<li key={item.id}>
										<Link
											href={`/blog/${item.slug}`}
											className="group flex items-baseline justify-between gap-4 rounded-md px-3 py-2.5 transition-colors hover:bg-glass"
										>
											<span className="text-sm text-ink-muted transition-colors group-hover:text-ink">
												{pick(item, "title", locale)}
											</span>
											<span className="shrink-0 font-mono text-[10.5px] text-ink-faint">
												{dateFormat.format(item.publishedAt ?? item.createdAt)}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>
					) : null}
				</Container>
			</Section>
		</div>
	)
}
