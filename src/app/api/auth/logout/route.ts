import { NextResponse } from "next/server"
import { destroySession } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Clears the admin session cookie. */
export async function POST() {
	await destroySession()
	return NextResponse.json({ ok: true })
}
