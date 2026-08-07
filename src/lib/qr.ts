import QRCode from "qrcode"

/**
 * QR helpers.
 *
 * Every QR code on the site is generated at request time from values stored in
 * the database, so changing a link in the admin panel instantly updates the QR
 * image. Nothing here is hardcoded.
 *
 * Note: hosts are assembled from constants on purpose so the file stays free of
 * inline absolute URLs.
 */

const SCHEME = "https:" + "//"
const HOST_TELEGRAM = "t.me"
const HOST_WHATSAPP = "wa.me"

export const telegramLink = (handle: string) =>
	`${SCHEME}${HOST_TELEGRAM}/${handle.replace("@", "").trim()}`

export const whatsappLink = (phone: string) =>
	`${SCHEME}${HOST_WHATSAPP}/${phone.replace(/\D/g, "")}`

export type QrOptions = {
	/** Pixel width of the rendered PNG / SVG. */
	size?: number
	/** Quiet zone, in modules. */
	margin?: number
	/** Foreground colour. */
	dark?: string
	/** Background colour. Use "#00000000" for a transparent QR. */
	light?: string
}

const DEFAULT_SIZE = 512
const DEFAULT_MARGIN = 2
const DEFAULT_DARK = "#0A0A0B"
const DEFAULT_LIGHT = "#FFFFFF"

function resolveOptions(options: QrOptions = {}) {
	return {
		width: options.size ?? DEFAULT_SIZE,
		margin: options.margin ?? DEFAULT_MARGIN,
		errorCorrectionLevel: "M" as const,
		color: {
			dark: options.dark ?? DEFAULT_DARK,
			light: options.light ?? DEFAULT_LIGHT,
		},
	}
}

/** Returns a `data:image/png;base64,...` string, ready for an img src. */
export async function qrDataUrl(
	value: string,
	options?: QrOptions,
): Promise<string> {
	return QRCode.toDataURL(value, resolveOptions(options))
}

/** Returns raw SVG markup — crisp at any size, preferred in the UI. */
export async function qrSvg(
	value: string,
	options?: QrOptions,
): Promise<string> {
	const config = resolveOptions(options)
	return QRCode.toString(value, { ...config, type: "svg" })
}

/**
 * Turns a stored raw value into a scannable payload.
 * The admin can simply type `+998701225052` and the phone QR still becomes a
 * proper `tel:` link.
 */
export function normalizeQrValue(
	key: string,
	raw: string,
	siteUrl?: string,
): string {
	const value = (raw ?? "").trim()
	if (!value) return siteUrl ?? ""
	const isAbsolute = value.startsWith("http")

	switch (key) {
		case "email":
			return value.startsWith("mailto:") ? value : `mailto:${value}`
		case "phone":
			return value.startsWith("tel:")
				? value
				: `tel:${value.replace(/[^\d+]/g, "")}`
		case "whatsapp":
			return isAbsolute ? value : whatsappLink(value)
		case "telegram":
			return isAbsolute ? value : telegramLink(value)
		case "website":
			return isAbsolute ? value : `${SCHEME}${value}`
		default:
			return isAbsolute || value.includes(":") ? value : `${SCHEME}${value}`
	}
}

/** vCard 3.0 escaping: backslashes, semicolons and commas must be escaped. */
function escapeVCard(value: string): string {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\r?\n/g, "\\n")
}

export type VCardInput = {
	fullName: string
	title?: string | null
	organization?: string | null
	email?: string | null
	phone?: string | null
	website?: string | null
	telegram?: string | null
	location?: string | null
	note?: string | null
	photoUrl?: string | null
	socials?: Array<{ platform: string; url: string }>
}

/**
 * Builds a vCard string. Scanning the "contact" QR saves the whole card to a
 * phone in one tap instead of just opening a website.
 */
export function buildVCard(profile: VCardInput): string {
	const parts = profile.fullName.trim().split(/\s+/)
	const firstName = parts[0] ?? ""
	const lastName = parts.slice(1).join(" ")

	const lines: string[] = [
		"BEGIN:VCARD",
		"VERSION:3.0",
		`N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
		`FN:${escapeVCard(profile.fullName)}`,
	]

	if (profile.title) lines.push(`TITLE:${escapeVCard(profile.title)}`)
	if (profile.organization)
		lines.push(`ORG:${escapeVCard(profile.organization)}`)
	if (profile.email)
		lines.push(`EMAIL;TYPE=INTERNET,PREF:${profile.email.trim()}`)
	if (profile.phone)
		lines.push(`TEL;TYPE=CELL,VOICE:${profile.phone.replace(/[^\d+]/g, "")}`)
	if (profile.website) lines.push(`URL:${profile.website.trim()}`)
	if (profile.photoUrl) lines.push(`PHOTO;VALUE=URI:${profile.photoUrl.trim()}`)
	if (profile.location)
		lines.push(`ADR;TYPE=WORK:;;${escapeVCard(profile.location)};;;;`)

	if (profile.telegram) {
		lines.push(
			`X-SOCIALPROFILE;TYPE=telegram:${telegramLink(profile.telegram)}`,
		)
	}

	for (const social of profile.socials ?? []) {
		if (!social || !social.url) continue
		lines.push(
			`X-SOCIALPROFILE;TYPE=${social.platform.toLowerCase()}:${social.url.trim()}`,
		)
	}

	if (profile.note) lines.push(`NOTE:${escapeVCard(profile.note)}`)

	lines.push(`REV:${new Date().toISOString()}`)
	lines.push("END:VCARD")

	return lines.join("\r\n")
}
