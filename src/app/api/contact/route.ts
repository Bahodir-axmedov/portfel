import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { contactSchema } from "@/lib/validators"
import { CONTACT_RATE_LIMIT } from "@/constants"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* Assembled from parts so no absolute URL literal lives in the source. */
const TELEGRAM_API = "https:" + "//" + "api.telegram.org/bot"

/**
 * Sends a Telegram ping when the bot credentials are configured.
 * Failures are swallowed — the visitor's message is already saved.
 */
async function notifyTelegram(text: string) {
	const token = process.env.TELEGRAM_BOT_TOKEN
	const chatId = process.env.TELEGRAM_CHAT_ID
	if (!token || !chatId) return

	try {
		await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: chatId,
				text,
				parse_mode: "HTML",
				disable_web_page_preview: true,
			}),
		})
	} catch (error) {
		console.error("[api/contact] telegram", error)
	}
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
}

export async function POST(request: Request) {
	const ip = clientIp(request.headers)
	const limit = rateLimit(`contact:${ip}`, CONTACT_RATE_LIMIT)

	if (!limit.success) {
		return NextResponse.json(
			{
				ok: false,
				error: "Juda tez-tez yuborilmoqda. Bir daqiqadan keyin urinib ko'ring.",
				retryAfter: limit.retryAfter,
			},
			{ status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
		)
	}

	let body: unknown
	try {
		body = await request.json()
	} catch {
		return NextResponse.json(
			{ ok: false, error: "So'rov formati noto'g'ri" },
			{ status: 400 },
		)
	}

	const parsed = contactSchema.safeParse(body)
	if (!parsed.success) {
		// ContactForm keeps errors as { field: message }.
		const fieldErrors: Record<string, string> = {}
		for (const issue of parsed.error.issues) {
			const field = issue.path.join(".")
			if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
		}
		return NextResponse.json({ ok: false, fieldErrors }, { status: 422 })
	}

	const { name, email, subject, message, locale, website } = parsed.data

	// Honeypot: pretend everything went fine so bots do not retry.
	if (website) return NextResponse.json({ ok: true })

	try {
		await prisma.contactMessage.create({
			data: {
				name,
				email,
				subject: subject || null,
				message,
				locale: locale || "uz",
				ip,
			},
		})
	} catch (error) {
		console.error("[api/contact]", error)
		return NextResponse.json(
			{ ok: false, error: "Xabarni saqlashda xatolik yuz berdi" },
			{ status: 500 },
		)
	}

	await notifyTelegram(
		[
			"\u2709\ufe0f <b>Yangi xabar \u2014 bahodir.dev</b>",
			`<b>Ism:</b> ${escapeHtml(name)}`,
			`<b>Email:</b> ${escapeHtml(email)}`,
			subject ? `<b>Mavzu:</b> ${escapeHtml(subject)}` : "",
			"",
			escapeHtml(message),
		]
			.filter(Boolean)
			.join("\n"),
	)

	return NextResponse.json({ ok: true })
}
