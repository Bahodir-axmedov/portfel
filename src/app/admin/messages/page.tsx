import { AdminShell } from "@/components/admin/AdminShell"
import { MessageList, type MessageItem } from "@/components/admin/MessageList"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 20

type Filter = "all" | "unread" | "archived"

/**
 * Inbox.
 *
 * Previously this loaded a fixed `take: 100` with no filter and no pagination,
 * so message 101 was simply unreachable from the UI. Now the query is driven
 * by the selected filter and paginated.
 */
export default async function AdminMessagesPage({
	searchParams,
}: {
	searchParams: Promise<{ filter?: string; page?: string }>
}) {
	const { filter: rawFilter, page: rawPage } = await searchParams

	const filter: Filter =
		rawFilter === "unread" || rawFilter === "archived" ? rawFilter : "all"

	const parsedPage = Number.parseInt(rawPage ?? "1", 10)
	const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

	const where =
		filter === "unread"
			? { read: false, archived: false }
			: filter === "archived"
				? { archived: true }
				: { archived: false }

	const [total, unread, rows] = await Promise.all([
		prisma.contactMessage.count({ where }),
		prisma.contactMessage.count({ where: { read: false, archived: false } }),
		prisma.contactMessage.findMany({
			where,
			// `id` as a tiebreaker keeps pagination stable when two messages share
			// the same timestamp.
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
		}),
	])

	// Dates are serialised to ISO strings before crossing into the client
	// component so server and client render byte-identical markup.
	const messages: MessageItem[] = rows.map((row) => ({
		id: row.id,
		name: row.name,
		email: row.email,
		subject: row.subject,
		message: row.message,
		locale: row.locale,
		ip: row.ip,
		read: row.read,
		archived: row.archived,
		createdAt: row.createdAt.toISOString(),
	}))

	return (
		<AdminShell
			title="Xabarlar"
			description={
				unread
					? `${unread} ta o'qilmagan xabar`
					: "Barcha xabarlar o'qilgan"
			}
		>
			<MessageList
				messages={messages}
				filter={filter}
				page={page}
				pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
				total={total}
				unread={unread}
			/>
		</AdminShell>
	)
}
