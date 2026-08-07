import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getAdminNotifications } from "@/lib/activity"
import { AdminNav } from "./AdminNav"
import { CommandPalette } from "./CommandPalette"
import { NotificationBell } from "./NotificationBell"

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

	// Loaded after the guard so an unauthenticated request never reaches the
	// database. The helper swallows its own errors and returns an empty feed.
	const notifications = await getAdminNotifications()

	return (
		<div className="min-h-dvh lg:pl-[264px]">
			<AdminNav email={session.email} />

			{/* Mounted at the shell rather than per page so the shortcut works on
			    every admin screen, and so the palette keeps no state that could
			    drift when navigating between resources. */}
			<CommandPalette />

			<header className="sticky top-0 z-30 border-b border-line bg-base/80 backdrop-blur-xl">
				<div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 pl-16 lg:px-8 lg:pl-8">
					<div>
						<h1 className="text-lg font-semibold tracking-tight">{title}</h1>
						{description ? (
							<p className="mt-0.5 text-sm text-ink-muted">{description}</p>
						) : null}
					</div>
					<div className="flex items-center gap-2">
						<NotificationBell
							unread={notifications.unread}
							items={notifications.items}
						/>
						{actions}
					</div>
				</div>
			</header>

			<main className="px-5 py-6 lg:px-8 lg:py-8">{children}</main>
		</div>
	)
}
