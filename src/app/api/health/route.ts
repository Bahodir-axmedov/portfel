import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Liveness + readiness probe.
 *
 * `railway.json` points `healthcheckPath` here. A probe that only proves the
 * HTTP server answered is close to useless: the common failure mode for this
 * service is the SQLite volume not being mounted, in which case Next.js still
 * serves pages while every query fails. Touching the database is what makes
 * the check meaningful, and it is why a failure returns 503 so Railway rolls
 * the deployment back instead of routing traffic to a broken instance.
 */
export async function GET() {
	const startedAt = Date.now()

	try {
		await prisma.$queryRaw`SELECT 1`
		return NextResponse.json(
			{
				ok: true,
				status: "healthy",
				database: "up",
				latencyMs: Date.now() - startedAt,
				uptime: Math.round(process.uptime()),
				timestamp: new Date().toISOString(),
			},
			{ headers: { "Cache-Control": "no-store" } },
		)
	} catch {
		return NextResponse.json(
			{
				ok: false,
				status: "unhealthy",
				database: "down",
				latencyMs: Date.now() - startedAt,
				uptime: Math.round(process.uptime()),
				timestamp: new Date().toISOString(),
			},
			{ status: 503, headers: { "Cache-Control": "no-store" } },
		)
	}
}
