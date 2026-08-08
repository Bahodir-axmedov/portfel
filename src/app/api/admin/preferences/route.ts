import { requireSession } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import {
	handleApiError,
	ok,
	readJson,
	requireSameOrigin,
	unprocessable,
} from "@/lib/api"
import { prisma } from "@/lib/prisma"
import {
	mergePreferences,
	normalizePreference,
	preferenceDefaults,
	preferenceSpec,
	PREFERENCE_KEYS,
} from "@/lib/preferences"
import type { FieldError } from "@/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Theme + language preferences.
 *
 * These live in the existing `Setting` table, but they are *not* served through
 * the generic `/api/admin/[resource]` CRUD endpoint: that one takes a free-form
 * key/value pair, so a typo silently creates a dead row instead of updating the
 * intended setting. This route accepts only the whitelisted keys from
 * `src/lib/preferences.ts` and validates every value against the same spec the
 * form renders from, which makes an unknown key a 422 rather than a new row.
 */

async function readStored(): Promise<Record<string, string>> {
	const rows = await prisma.setting.findMany({
		where: { key: { in: PREFERENCE_KEYS } },
		select: { key: true, value: true },
	})
	return mergePreferences(rows)
}

export async function GET() {
	try {
		await requireSession()
		return ok({ values: await readStored() })
	} catch (error) {
		return handleApiError(error, "api/admin/preferences/read")
	}
}

export async function PUT(request: Request) {
	try {
		const session = await requireSession()
		const crossOrigin = requireSameOrigin(request)
		if (crossOrigin) return crossOrigin

		const parsedBody = await readJson(request)
		if (!parsedBody.ok) return parsedBody.response

		const body = parsedBody.body as {
			values?: Record<string, unknown>
			reset?: boolean
		}

		// `reset` ignores the payload entirely and writes the documented
		// fallbacks, so "restore defaults" cannot be poisoned by a stale form.
		const incoming: Record<string, unknown> =
			body.reset === true ? preferenceDefaults() : (body.values ?? {})

		if (typeof incoming !== "object" || Array.isArray(incoming)) {
			return unprocessable([
				{ field: "values", message: "values obyekt bo'lishi kerak" },
			])
		}

		const fieldErrors: FieldError[] = []
		const accepted: Array<{ key: string; value: string; type: string }> = []

		for (const [key, raw] of Object.entries(incoming)) {
			const spec = preferenceSpec(key)
			if (!spec) {
				fieldErrors.push({ field: key, message: "Noma'lum sozlama kaliti" })
				continue
			}

			const value = normalizePreference(spec, raw)
			if (value === null) {
				fieldErrors.push({ field: key, message: "Qiymat yaroqsiz" })
				continue
			}

			accepted.push({ key, value, type: spec.type })
		}

		if (fieldErrors.length > 0) return unprocessable(fieldErrors)

		if (accepted.length > 0) {
			// One transaction: a half-applied theme (new accent, old glow) would be
			// visible on the public site between two separate writes.
			await prisma.$transaction(
				accepted.map((entry) =>
					prisma.setting.upsert({
						where: { key: entry.key },
						update: { value: entry.value, type: entry.type },
						create: {
							key: entry.key,
							value: entry.value,
							type: entry.type,
							group: entry.key.split(".")[0] ?? "general",
						},
					}),
				),
			)
		}

		void logActivity({
			action: "update",
			resource: "preferences",
			label:
				body.reset === true
					? "Sozlamalar standart holatga qaytarildi"
					: `${accepted.length} sozlama yangilandi`,
			actor: session.email,
			headers: request.headers,
		})

		return ok({ values: await readStored(), updated: accepted.length })
	} catch (error) {
		return handleApiError(error, "api/admin/preferences/write")
	}
}
