import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

/**
 * Locale-aware navigation helpers. Always import `Link` from here instead of
 * `next/link` inside the public site so URLs keep their locale prefix.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
	createNavigation(routing)
