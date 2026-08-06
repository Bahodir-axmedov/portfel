import Link from "next/link"
import { defaultLocale, htmlLang } from "@/i18n/routing"
import "./globals.css"

/**
 * Global fallback for requests that never reach a locale segment (for example
 * a path the middleware skipped). Localised 404s live in
 * `app/[locale]/not-found.tsx`; because the root layout is a pass-through,
 * this page renders its own document shell.
 */
export default function GlobalNotFound() {
	return (
		<html lang={htmlLang[defaultLocale]}>
			<body>
				<main className="relative grid min-h-screen place-items-center overflow-hidden px-6">
					<div
						className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.18] blur-[110px]"
						style={{ background: "var(--brand-gradient)" }}
						aria-hidden
					/>

					<div className="relative z-10 text-center">
						<p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
							404
						</p>
						<h1 className="mt-4 text-display-lg font-semibold text-ink">
							Sahifa topilmadi
						</h1>
						<p className="mx-auto mt-3 max-w-[44ch] text-[15px] leading-relaxed text-ink-muted">
							The page you are looking for does not exist or has been moved.
						</p>

						<Link
							href="/"
							className="mt-8 inline-flex h-11 items-center gap-2 rounded-md border border-line-strong bg-glass px-5 text-sm font-medium text-ink transition duration-200 hover:bg-glass-hover"
						>
							Bosh sahifa
						</Link>
					</div>
				</main>
			</body>
		</html>
	)
}
