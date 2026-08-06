import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { AdminNav } from "./AdminNav"

type AdminShellProps = {
	title: string
	description?: string
	actions?: ReactNode
	children: ReactNode
}

/**
 * Guards every admin screen and provides the sidebar + page header.
 * `middleware.ts` already blocks unauthenticated requests; this is the
 * second layer that also protects direct server renders.
 */
export async function AdminShell({
	title,
	description,
	actions,
	children,
}: AdminShellProps) {
	const session = await getSession()
	if (!session) redirect("/admin/login")

	return (
		<div className="min-h-dvh lg:pl-[264px]">
			<AdminNav email={session.email} />

			<header className="sticky top-0 z-30 border-b border-line bg-base/80 backdrop-blur-xl">
				<div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 pl-16 lg:px-8 lg:pl-8">
					<div>
						<h1 className="text-lg font-semibold tracking-tight">{title}</h1>
						{description ? (
							<p className="mt-0.5 text-sm text-ink-muted">{description}</p>
						) : null}
					</div>
					{actions ? (
						<div className="flex items-center gap-2">{actions}</div>
					) : null}
				</div>
			</header>

			<main className="px-5 py-6 lg:px-8 lg:py-8">{children}</main>
		</div>
	)
}
