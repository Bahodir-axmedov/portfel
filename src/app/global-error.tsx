"use client"

/**
 * Last-resort boundary. Catches errors thrown while rendering the root layout
 * or any segment that has no closer boundary, and replaces the bare Next.js
 * error screen with a branded page that still surfaces the digest so the
 * matching server log line can be located.
 *
 * `global-error.tsx` must render its own <html> and <body>: it replaces the
 * root layout entirely when it activates.
 */
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	return (
		<html lang="uz">
			<body
				style={{
					margin: 0,
					minHeight: "100vh",
					display: "grid",
					placeItems: "center",
					background: "#05070d",
					color: "#e6edf7",
					fontFamily:
						"ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
					padding: "24px",
				}}
			>
				<div style={{ maxWidth: "46ch", textAlign: "center" }}>
					<p
						style={{
							margin: 0,
							fontSize: "13px",
							letterSpacing: "0.28em",
							textTransform: "uppercase",
							color: "#06b6d4",
						}}
					>
						Xatolik
					</p>

					<h1
						style={{
							margin: "16px 0 0",
							fontSize: "28px",
							fontWeight: 600,
							lineHeight: 1.2,
						}}
					>
						Sahifani yuklab bo&apos;lmadi
					</h1>

					<p
						style={{
							margin: "12px 0 0",
							fontSize: "15px",
							lineHeight: 1.6,
							color: "#93a4bf",
						}}
					>
						Server kutilmagan xatoga uchradi. Iltimos, birozdan keyin qayta
						urining.
					</p>

					{error.digest ? (
						<p
							style={{
								margin: "20px 0 0",
								fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
								fontSize: "12px",
								color: "#6b7c99",
							}}
						>
							digest: {error.digest}
						</p>
					) : null}

					<button
						type="button"
						onClick={reset}
						style={{
							marginTop: "28px",
							height: "44px",
							padding: "0 22px",
							borderRadius: "10px",
							border: "1px solid rgba(255,255,255,0.14)",
							background: "rgba(255,255,255,0.06)",
							color: "#e6edf7",
							fontSize: "14px",
							fontWeight: 500,
							cursor: "pointer",
						}}
					>
						Qayta urinish
					</button>
				</div>
			</body>
		</html>
	)
}
