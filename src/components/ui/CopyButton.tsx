"use client"

import { Check, Copy } from "lucide-react"
import { useCopyToClipboard } from "@/hooks"
import { cn } from "@/lib/utils"

/**
 * Small copy-to-clipboard affordance used next to contact details.
 * Falls back silently when the Clipboard API is unavailable.
 */
export function CopyButton({
	value,
	labelCopy,
	labelCopied,
	className,
}: {
	value: string
	labelCopy: string
	labelCopied: string
	className?: string
}) {
	const { copied, copy } = useCopyToClipboard()
	const label = copied ? labelCopied : labelCopy

	return (
		<button
			type="button"
			onClick={() => {
				void copy(value)
			}}
			aria-label={label}
			title={label}
			className={cn(
				"grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line text-ink-faint transition duration-200 hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60",
				copied && "border-success/40 text-success",
				className,
			)}
		>
			{copied ? (
				<Check className="h-3.5 w-3.5" strokeWidth={2.2} />
			) : (
				<Copy className="h-3.5 w-3.5" strokeWidth={1.8} />
			)}
		</button>
	)
}
