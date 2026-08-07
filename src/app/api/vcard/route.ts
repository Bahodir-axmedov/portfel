import { NextResponse } from "next/server"
import { buildVCard } from "@/lib/qr"
import { getProfile, getSocialLinks } from "@/lib/queries"
import { absolute } from "@/lib/seo"
import { slugify } from "@/lib/utils"

/**
 * Downloadable contact card.
 *
 * The "Save contact" button and the contact QR both point here, so a scan
 * saves the whole card to a phone instead of just opening a link. Everything
 * is read from the database, so admin edits are reflected immediately.
 */
export const dynamic = "force-dynamic"

export async function GET() {
	const [profile, socials] = await Promise.all([getProfile(), getSocialLinks()])

	if (!profile) {
		return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
	}

	const vcard = buildVCard({
		fullName: profile.fullName,
		title: profile.jobTitle,
		organization: profile.brandName,
		email: profile.email,
		phone: profile.phone,
		website: absolute("/"),
		telegram: profile.telegram,
		location: profile.location,
		note: profile.shortBio,
		photoUrl: profile.avatarUrl ? absolute(profile.avatarUrl) : null,
		socials: socials.map((social) => ({
			platform: social.platform,
			url: social.url,
		})),
	})

	const fileName = `${slugify(profile.fullName) || "contact"}.vcf`

	return new NextResponse(vcard, {
		status: 200,
		headers: {
			"Content-Type": "text/vcard; charset=utf-8",
			"Content-Disposition": `attachment; filename="${fileName}"`,
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	})
}
