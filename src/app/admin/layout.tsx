import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { ToastProvider } from "@/components/admin/Toast"
import "../globals.css"

const inter = Inter({
	subsets: ["latin", "cyrillic"],
	display: "swap",
	variable: "--font-sans",
})

const mono = JetBrains_Mono({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-mono",
})

export const metadata: Metadata = {
	title: "Admin — Bahodir.dev",
	robots: { index: false, follow: false, nocache: true },
}

/**
 * The admin area is not localized and lives outside the `[locale]` tree,
 * so it renders its own document shell.
 */
export default function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="uz" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${mono.variable} min-h-dvh bg-base text-ink antialiased`}
			>
				<ToastProvider>{children}</ToastProvider>
			</body>
		</html>
	)
}
