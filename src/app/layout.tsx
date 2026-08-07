import type { ReactNode } from "react"

/**
 * Pass-through root layout.
 *
 * With `localePrefix: "as-needed"` every real page lives under `app/[locale]`,
 * and that layout renders the `<html>` / `<body>` shell so it can set `lang`
 * and load the fonts for the active locale. Next.js still requires a file at
 * the root of `app/`, so this one simply forwards its children.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
	return children
}
