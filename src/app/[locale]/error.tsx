"use client"

import Link from "next/link"

/**
 * Segment-level boundary for every localised route. Keeps the root layout and
 * document shell intact while showing a readable failure state, and prints the
 * digest so the corresponding `[onRequestError]` block in the server log can be
 * found without guesswork.
 */
export default function LocaleError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	return (
		<main className="relative grid min-h-screen place-items-center overflow-hidden px-6">
			<div
				className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.18] blur-[110px]"
				style={{ background: "var(--brand-gradient)" }}
				aria-hidden
			/>

			<div className="relative z-10 max-w-[46ch] text-center">
				<p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
					Xatolik
				</p>

				<h1 className="mt-4 text-display-lg font-semibold text-ink">
					Sahifani yuklab bo&apos;lmadi
				</h1>

				<p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
					Server kutilmagan xatoga uchradi. Iltimos, birozdan keyin qayta
					urining.
				</p>

				{error.digest ? (
					<p className="mt-5 font-mono text-xs text-ink-subtle">
						digest: {error.digest}
					</p>
				) : null}

				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<button
						type="button"
						onClick={reset}
						className="inline-flex h-11 items-center gap-2 rounded-md border border-line-strong bg-glass px-5 text-sm font-medium text-ink transition duration-200 hover:bg-glass-hover"
					>
						Qayta urinish
					</button>

					<Link
						href="/"
						className="inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-medium text-ink-muted transition duration-200 hover:text-ink"
					>
						Bosh sahifa
					</Link>
				</div>
			</div>
		</main>
	)
}
