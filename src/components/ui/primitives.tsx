import { Link } from "@/i18n/navigation"
import {
	type AnchorHTMLAttributes,
	type ButtonHTMLAttributes,
	type ComponentProps,
	type InputHTMLAttributes,
	type ReactNode,
	type TextareaHTMLAttributes,
	forwardRef,
} from "react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */

export type ButtonVariant =
	"primary" | "secondary" | "ghost" | "outline" | "danger"
export type ButtonSize = "sm" | "md" | "lg" | "icon"

/**
 * `btn-sweep` (globals.css) adds the diagonal light sweep on hover and is the
 * hook the global <RippleEffect> listener uses to place click ripples. Both
 * effects are pure CSS + one delegated listener, so this file stays a server
 * component and `buttonClass` remains callable from server sections.
 */
const BUTTON_BASE =
	"btn-sweep relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-tight transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:pointer-events-none disabled:opacity-50"

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
	primary:
		"bg-brand-gradient text-white shadow-glow hover:brightness-110 active:brightness-95",
	secondary:
		"border border-line bg-white/[0.045] text-ink backdrop-blur-xl hover:border-line-strong hover:bg-white/[0.08]",
	outline:
		"border border-brand-500/45 text-ink hover:border-brand-400 hover:bg-brand-500/10",
	ghost: "text-ink-muted hover:bg-white/[0.05] hover:text-ink",
	danger: "bg-red-500/90 text-white hover:bg-red-500",
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
	sm: "h-9 px-4 text-[13px]",
	md: "h-11 px-5 text-sm",
	lg: "h-[52px] px-7 text-[15px]",
	icon: "h-10 w-10 p-0",
}

export function buttonClass(
	variant: ButtonVariant = "primary",
	size: ButtonSize = "md",
	className?: string,
) {
	return cn(
		BUTTON_BASE,
		BUTTON_VARIANTS[variant],
		BUTTON_SIZES[size],
		className,
	)
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant
	size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	function Button(
		{ variant = "primary", size = "md", className, children, ...props },
		ref,
	) {
		return (
			<button
				ref={ref}
				className={buttonClass(variant, size, className)}
				{...props}
			>
				{children}
			</button>
		)
	},
)

export type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	href: string
	variant?: ButtonVariant
	size?: ButtonSize
	external?: boolean
}

export function LinkButton({
	href,
	variant = "primary",
	size = "md",
	external,
	className,
	children,
	...props
}: LinkButtonProps) {
	const classes = buttonClass(variant, size, className)
	const isExternal = external ?? /^(http|mailto:|tel:)/.test(href)

	if (isExternal) {
		return (
			<a
				href={href}
				className={classes}
				target="_blank"
				rel="noopener noreferrer"
				{...props}
			>
				{children}
			</a>
		)
	}

	/*
	 * next-intl's Link is type-checked against its own resolved copy of
	 * @types/react. When the dependency tree contains two copies, DOM
	 * attribute unions differ between them (for example `popover`, which
	 * gained the "hint" value in newer typings) and the spread is rejected
	 * even though every value is identical at runtime.
	 *
	 * These props are plain anchor attributes in both worlds, so they are
	 * re-typed against Link's own prop shape. Dropping the spread instead
	 * would silently discard onClick / aria-* / target from callers.
	 */
	const linkProps = props as unknown as Omit<
		ComponentProps<typeof Link>,
		"href" | "className"
	>

	return (
		<Link href={href} className={classes} {...linkProps}>
			{children}
		</Link>
	)
}

/* ------------------------------------------------------------------ *
 * Badge / Pill
 * ------------------------------------------------------------------ */

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "muted"

const BADGE_TONES: Record<BadgeTone, string> = {
	neutral: "border-line bg-white/[0.04] text-ink-muted",
	brand: "border-brand-500/35 bg-brand-500/12 text-brand-400",
	success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
	warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
	muted: "border-transparent bg-white/[0.035] text-ink-faint",
}

export function Badge({
	children,
	tone = "neutral",
	className,
}: {
	children: ReactNode
	tone?: BadgeTone
	className?: string
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium leading-none tracking-tight",
				BADGE_TONES[tone],
				className,
			)}
		>
			{children}
		</span>
	)
}

/** Small pulsing dot used for "Open to Work" and "Active development". */
export function StatusDot({ className }: { className?: string }) {
	return (
		<span className={cn("relative flex h-2 w-2", className)}>
			<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
			<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
		</span>
	)
}

/* ------------------------------------------------------------------ *
 * Section scaffolding
 * ------------------------------------------------------------------ */

export function Section({
	id,
	children,
	className,
}: {
	id?: string
	children: ReactNode
	className?: string
}) {
	return (
		<section
			id={id}
			className={cn("relative scroll-mt-24 py-[76px] md:py-[104px]", className)}
		>
			{children}
		</section>
	)
}

export function Container({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return <div className={cn("container", className)}>{children}</div>
}

export function Eyebrow({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-ink-faint",
				className,
			)}
		>
			<span aria-hidden className="h-px w-6 bg-brand-gradient" />
			{children}
		</span>
	)
}

export function SectionHeading({
	eyebrow,
	title,
	description,
	align = "left",
	className,
	actions,
}: {
	eyebrow?: string
	title: ReactNode
	description?: ReactNode
	align?: "left" | "center"
	className?: string
	actions?: ReactNode
}) {
	const centered = align === "center"

	return (
		<div
			className={cn(
				"flex flex-col gap-4",
				centered && "items-center text-center",
				!centered && actions && "md:flex-row md:items-end md:justify-between",
				className,
			)}
		>
			<div className={cn("flex flex-col gap-4", centered && "items-center")}>
				{eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
				<h2 className="max-w-[24ch] text-display-lg font-semibold tracking-[-0.028em] text-ink">
					{title}
				</h2>
				{description ? (
					<p className="max-w-[62ch] text-[15px] leading-relaxed text-ink-muted">
						{description}
					</p>
				) : null}
			</div>
			{actions ? <div className="flex shrink-0 gap-3">{actions}</div> : null}
		</div>
	)
}

export function Divider({ className }: { className?: string }) {
	return (
		<div
			aria-hidden
			className={cn(
				"h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent",
				className,
			)}
		/>
	)
}

/* ------------------------------------------------------------------ *
 * Form controls (contact form + admin panel)
 * ------------------------------------------------------------------ */

const FIELD_BASE =
	"w-full rounded-md border border-line bg-white/[0.03] px-4 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors duration-200 focus:border-brand-500/60 focus:bg-white/[0.05] disabled:opacity-60"

export const Input = forwardRef<
	HTMLInputElement,
	InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
	return (
		<input ref={ref} className={cn(FIELD_BASE, "h-12", className)} {...props} />
	)
})

export const Textarea = forwardRef<
	HTMLTextAreaElement,
	TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
	return (
		<textarea
			ref={ref}
			className={cn(
				FIELD_BASE,
				"min-h-[132px] resize-y py-3 leading-relaxed",
				className,
			)}
			{...props}
		/>
	)
})

export function Field({
	label,
	hint,
	error,
	required,
	children,
	className,
	htmlFor,
}: {
	label: string
	hint?: string
	error?: string
	required?: boolean
	children: ReactNode
	className?: string
	htmlFor?: string
}) {
	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<label
				htmlFor={htmlFor}
				className="text-[13px] font-medium tracking-tight text-ink-muted"
			>
				{label}
				{required ? <span className="ml-1 text-brand-400">*</span> : null}
			</label>
			{children}
			{error ? (
				<p className="text-[12.5px] text-red-400">{error}</p>
			) : hint ? (
				<p className="text-[12.5px] text-ink-faint">{hint}</p>
			) : null}
		</div>
	)
}

/* ------------------------------------------------------------------ *
 * Empty state — shown for sections with no data yet (certificates, gallery)
 * ------------------------------------------------------------------ */

export function EmptyState({
	title,
	description,
	icon,
	className,
}: {
	title: string
	description?: string
	icon?: ReactNode
	className?: string
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-12 text-center",
				className,
			)}
		>
			{icon ? <div className="text-ink-faint">{icon}</div> : null}
			<p className="text-[15px] font-medium text-ink">{title}</p>
			{description ? (
				<p className="max-w-[46ch] text-[13.5px] leading-relaxed text-ink-faint">
					{description}
				</p>
			) : null}
		</div>
	)
}
