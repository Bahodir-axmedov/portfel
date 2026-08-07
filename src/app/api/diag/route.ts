import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Production diagnostics.
 *
 * A Server Component crash in a production build is reported to the browser as
 * an opaque digest ("Server Components render error"). React deliberately
 * strips the message so an attacker cannot read internals from a public page.
 * The real message only exists in the container's stderr.
 *
 * This route reproduces every server-side step the home page performs, one at
 * a time, inside its own try/catch, and returns the *actual* error name,
 * message and stack for whichever step fails. That turns an unreadable digest
 * into a precise, provable diagnosis without needing log access.
 *
 * It is protected by AUTH_SECRET (already required by the app, so no new
 * environment variable is introduced) because stack traces are sensitive.
 *
 *     GET /api/diag?token=$AUTH_SECRET
 */

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Step = {
	step: string
	ok: boolean
	info?: unknown
	error?: { name: string; message: string; code?: string; stack?: string }
}

function describe(error: unknown): Step["error"] {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			code: (error as { code?: string }).code,
			stack: error.stack?.split("\n").slice(0, 12).join("\n"),
		}
	}
	return { name: "NonError", message: String(error) }
}

async function run(
	steps: Step[],
	step: string,
	fn: () => Promise<unknown> | unknown,
): Promise<void> {
	try {
		const info = await fn()
		steps.push({ step, ok: true, info })
	} catch (error) {
		steps.push({ step, ok: false, error: describe(error) })
	}
}

export async function GET(request: Request) {
	const secret = process.env.AUTH_SECRET ?? ""
	const token = new URL(request.url).searchParams.get("token") ?? ""
	if (!secret || token !== secret) {
		return NextResponse.json({ error: "forbidden" }, { status: 403 })
	}

	const steps: Step[] = []

	/* 1. Environment ---------------------------------------------------- */
	steps.push({
		step: "env",
		ok: true,
		info: {
			NODE_ENV: process.env.NODE_ENV ?? null,
			DATABASE_URL: process.env.DATABASE_URL ?? null,
			UPLOAD_DIR: process.env.UPLOAD_DIR ?? null,
			NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
			ADMIN_EMAIL: process.env.ADMIN_EMAIL ? "set" : "MISSING",
			ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH ? "set" : "MISSING",
			AUTH_SECRET: "set",
			node: process.version,
		},
	})

	/* 2. Database connection and every table the home page reads --------- */
	await run(steps, "db:connect", async () => {
		await prisma.$queryRaw`SELECT 1`
		return "ok"
	})

	const tables: Array<[string, () => Promise<unknown>]> = [
		["profile", () => prisma.profile.findUnique({ where: { id: "main" } })],
		["skill", () => prisma.skill.count()],
		["language", () => prisma.language.count()],
		["service", () => prisma.service.count()],
		["experience", () => prisma.experience.count()],
		["education", () => prisma.education.count()],
		["certificate", () => prisma.certificate.count()],
		["achievement", () => prisma.achievement.count()],
		["timelineEvent", () => prisma.timelineEvent.count()],
		["project", () => prisma.project.count()],
		["technology", () => prisma.technology.count()],
		["projectImage", () => prisma.projectImage.count()],
		["stat", () => prisma.stat.count()],
		["galleryItem", () => prisma.galleryItem.count()],
		["testimonial", () => prisma.testimonial.count()],
		["socialLink", () => prisma.socialLink.count()],
		["qrCode", () => prisma.qrCode.count()],
		["setting", () => prisma.setting.count()],
		["seoSetting", () => prisma.seoSetting.count()],
		["post", () => prisma.post.count()],
		["contactMessage", () => prisma.contactMessage.count()],
		["pageView", () => prisma.pageView.count()],
	]

	for (const [name, query] of tables) {
		await run(steps, `db:${name}`, async () => {
			const result = await query()
			if (name === "profile") return result ? "row present" : "NO ROW"
			return result
		})
	}

	/* 3. The aggregate loader the home page actually calls ---------------- */
	await run(steps, "queries:getHomeData", async () => {
		const { getHomeData } = await import("@/lib/queries")
		const data = await getHomeData()
		return {
			profile: data.profile ? "present" : "null",
			skills: data.skills.length,
			projects: data.projects.length,
			stats: data.stats.length,
			socialLinks: data.socialLinks.length,
			qrCodes: data.qrCodes.length,
		}
	})

	/* 4. Translation files -------------------------------------------------
	   `src/i18n/request.ts` loads these with a dynamic import. If webpack did
	   not bundle them into the standalone server, every page throws here. */
	for (const locale of ["uz", "ru", "en"]) {
		await run(steps, `messages:${locale}`, async () => {
			const mod = await import(`../../../../messages/${locale}.json`)
			return Object.keys(mod.default).length + " namespaces"
		})
	}

	/* 5. next-intl request config ---------------------------------------- */
	await run(steps, "next-intl:getMessages", async () => {
		const { getMessages } = await import("next-intl/server")
		const messages = await getMessages({ locale: "uz" })
		return Object.keys(messages).length + " namespaces"
	})

	/* 6. Server-side QR generation (Contact section) ---------------------- */
	await run(steps, "qr:svg", async () => {
		const { qrSvg } = await import("@/lib/qr")
		const svg = await qrSvg("https://example.com", { size: 220, margin: 1 })
		return svg.length + " bytes"
	})

	/* 7. Every QR row in the database, individually ----------------------- */
	await run(steps, "qr:rows", async () => {
		const { qrSvg, normalizeQrValue } = await import("@/lib/qr")
		const { SITE_URL } = await import("@/lib/seo")
		const rows = await prisma.qrCode.findMany({ where: { published: true } })
		const results: string[] = []
		for (const row of rows) {
			const target = normalizeQrValue(row.key, row.value ?? "", SITE_URL)
			await qrSvg(target, { size: 220, margin: 1 })
			results.push(`${row.key} -> ok`)
		}
		return results
	})

	/* 8. Intl formatting with the locales the site uses -------------------- */
	await run(steps, "intl:dateTimeFormat", () => {
		const out: Record<string, string> = {}
		for (const tag of ["uz-UZ", "ru-RU", "en-US"]) {
			out[tag] = new Intl.DateTimeFormat(tag, {
				month: "long",
				year: "numeric",
				timeZone: "Asia/Tashkent",
			}).format(new Date())
		}
		return out
	})

	/* 9. Metadata builder -------------------------------------------------- */
	await run(steps, "seo:buildMetadata", async () => {
		const { buildMetadata, SITE_URL } = await import("@/lib/seo")
		buildMetadata({ locale: "uz", path: "/", title: "t", description: "d" })
		return SITE_URL
	})

	const failed = steps.filter((entry) => !entry.ok)

	return NextResponse.json(
		{
			summary:
				failed.length === 0 ? "ALL STEPS PASSED" : `${failed.length} FAILED`,
			firstFailure: failed[0] ?? null,
			steps,
		},
		{ status: 200, headers: { "Cache-Control": "no-store" } },
	)
}
