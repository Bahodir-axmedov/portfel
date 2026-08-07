import { Fragment } from "react"
import Link from "next/link"
import {
	parseMarkdown,
	type InlineToken,
	type MarkdownBlock,
} from "@/lib/markdown"
import { cn } from "@/lib/utils"

/**
 * Renders a Markdown string as React elements.
 *
 * Deliberately a server component with no `"use client"`: post bodies are
 * static once rendered, so shipping a parser and a token tree to the browser
 * would be pure waste. It also means `dangerouslySetInnerHTML` is never needed
 * anywhere in the blog -- the parser hands back tokens and React escapes every
 * text node, so a post containing markup renders as visible text instead of
 * live HTML.
 */

function Inline({ tokens }: { tokens: InlineToken[] }) {
	return (
		<>
			{tokens.map((token, index) => {
				const key = `${token.type}-${index}`

				if (token.type === "bold") {
					return (
						<strong key={key} className="font-semibold text-ink">
							{token.value}
						</strong>
					)
				}

				if (token.type === "italic") {
					return (
						<em key={key} className="italic">
							{token.value}
						</em>
					)
				}

				if (token.type === "code") {
					return (
						<code
							key={key}
							className="rounded border border-line bg-base-raised px-1.5 py-0.5 font-mono text-[0.86em] text-accent-200"
						>
							{token.value}
						</code>
					)
				}

				if (token.type === "link") {
					const external = /^https?:\/\//i.test(token.href)
					return (
						<a
							key={key}
							href={token.href}
							{...(external
								? { target: "_blank", rel: "noreferrer noopener" }
								: {})}
							className="text-brand-300 underline decoration-brand-500/40 underline-offset-4 transition-colors hover:text-brand-200 hover:decoration-brand-400"
						>
							{token.value}
						</a>
					)
				}

				return <Fragment key={key}>{token.value}</Fragment>
			})}
		</>
	)
}

function Block({ block }: { block: MarkdownBlock }) {
	switch (block.type) {
		case "heading": {
			const common = "group scroll-mt-28 font-semibold tracking-tight text-ink"
			const body = (
				<>
					<Inline tokens={block.text} />
					{/* Anchor affordance, hidden until hover so it never competes
					    with the heading itself. */}
					<Link
						href={`#${block.id}`}
						aria-hidden
						tabIndex={-1}
						className="ml-2 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
					>
						#
					</Link>
				</>
			)

			if (block.level === 2) {
				return (
					<h2 id={block.id} className={cn(common, "mt-12 text-2xl")}>
						{body}
					</h2>
				)
			}
			if (block.level === 3) {
				return (
					<h3 id={block.id} className={cn(common, "mt-9 text-xl")}>
						{body}
					</h3>
				)
			}
			return (
				<h4 id={block.id} className={cn(common, "mt-7 text-lg")}>
					{body}
				</h4>
			)
		}

		case "paragraph":
			return (
				<p className="mt-5 leading-[1.75] text-ink-muted">
					<Inline tokens={block.text} />
				</p>
			)

		case "list": {
			const items = block.items.map((item, index) => (
				<li key={index} className="leading-[1.7]">
					<Inline tokens={item} />
				</li>
			))

			return block.ordered ? (
				<ol className="mt-5 list-decimal space-y-2 pl-5 text-ink-muted marker:text-brand-400">
					{items}
				</ol>
			) : (
				<ul className="mt-5 list-disc space-y-2 pl-5 text-ink-muted marker:text-brand-400">
					{items}
				</ul>
			)
		}

		case "quote":
			return (
				<blockquote className="mt-6 rounded-r-md border-l-2 border-brand-500/70 bg-white/[0.025] py-3 pl-5 pr-4 text-ink-muted">
					<Inline tokens={block.text} />
				</blockquote>
			)

		case "code":
			return (
				<div className="mt-6 overflow-hidden rounded-lg border border-line bg-base-raised">
					{block.lang ? (
						<div className="border-b border-line px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
							{block.lang}
						</div>
					) : null}
					<pre className="overflow-x-auto p-4">
						<code className="font-mono text-[13px] leading-relaxed text-ink-muted">
							{block.value}
						</code>
					</pre>
				</div>
			)

		case "image":
			/* A plain <img>, not next/image, on purpose. The src comes from post
			   body text an admin typed, so it can point at any host. next/image
			   throws at request time for a hostname missing from
			   `images.remotePatterns`, which would turn one bad paste into a
			   500 on the whole post. Width/height are unknown here too. */
			return (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={block.src}
					alt={block.alt}
					loading="lazy"
					decoding="async"
					className="mt-6 w-full rounded-lg border border-line"
				/>
			)

		case "divider":
			return <hr className="mt-8 border-line" />

		default:
			return null
	}
}

export function Markdown({
	source,
	className,
}: {
	source: string
	className?: string
}) {
	const blocks = parseMarkdown(source)

	if (blocks.length === 0) return null

	return (
		<div className={cn("text-[15.5px]", className)}>
			{blocks.map((block, index) => (
				<Block key={index} block={block} />
			))}
		</div>
	)
}
