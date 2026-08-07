"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

/**
 * Per-section error boundary.
 *
 * The `section()` helper in `app/[locale]/page.tsx` already catches anything
 * thrown by the *async Server Component* bodies. It cannot see errors thrown
 * during the **SSR pass of client components** (`Hero`, `SkillsBoard`,
 * `GalleryGrid`, `ContactForm`, and every `motion` / `interactive` primitive
 * they render), because those run later, inside React's HTML renderer, where
 * React replaces the original error with the opaque "An error occurred in the
 * Server Components render" wrapper before Next.js ever sees it.
 *
 * A class error boundary is the one construct React consults *before* it
 * masks the error, and React's server renderer does look for the nearest
 * boundary while streaming HTML. That gives two things at once:
 *
 *  1. Diagnosis — the real `name`, `message`, `stack` and React
 *     `componentStack` are written to stderr, so the container log names the
 *     exact component and line.
 *  2. Containment — only the failing section is replaced by a small notice.
 *     The rest of the page keeps rendering instead of the whole route
 *     returning a 500.
 *
 * `getDerivedStateFromError` is static and cannot see `name`, so the report is
 * emitted from `render()`, which runs on the server too. `reported` guards
 * against duplicate output when React retries the subtree on the client.
 */

type Props = { name: string; children: ReactNode }
type State = { error: Error | null }

const BAR = "=".repeat(72)

function report(name: string, error: Error, componentStack?: string): void {
	const lines = ["", BAR, `[section:${name}] CLIENT RENDER FAILED`, BAR]

	let current: unknown = error
	let depth = 0
	while (current instanceof Error && depth < 5) {
		const pad = "  ".repeat(depth)
		lines.push(`${pad}name    : ${current.name}`)
		lines.push(`${pad}message : ${current.message}`)
		const code = (current as Error & { code?: unknown }).code
		if (code !== undefined) lines.push(`${pad}code    : ${String(code)}`)
		if (current.stack) {
			lines.push(`${pad}stack   :`)
			for (const entry of current.stack.split("\n").slice(0, 16)) {
				lines.push(`${pad}  ${entry.trim()}`)
			}
		}
		current = current.cause
		depth += 1
		if (current !== undefined) lines.push(`${"  ".repeat(depth - 1)}cause   :`)
	}

	if (componentStack) {
		lines.push("componentStack :")
		for (const entry of componentStack.split("\n").slice(0, 16)) {
			if (entry.trim()) lines.push(`  ${entry.trim()}`)
		}
	}

	lines.push(BAR, "")
	const text = `${lines.join("\n")}\n`

	// `process` exists during SSR; the browser falls back to console.error.
	if (typeof process !== "undefined" && process.stderr?.write) {
		process.stderr.write(text)
	} else {
		console.error(text)
	}
}

export class SectionBoundary extends Component<Props, State> {
	state: State = { error: null }
	private reported = false

	static getDerivedStateFromError(error: Error): State {
		return { error }
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		if (this.reported) return
		this.reported = true
		report(this.props.name, error, info.componentStack ?? undefined)
	}

	render() {
		const { error } = this.state
		if (!error) return this.props.children

		if (!this.reported) {
			this.reported = true
			report(this.props.name, error)
		}

		return (
			<section className="border-y border-line/60 py-10">
				<div className="container">
					<p className="text-[13px] text-ink-faint">
						Bu bo&apos;lim vaqtincha yuklanmadi.
					</p>
				</div>
			</section>
		)
	}
}
