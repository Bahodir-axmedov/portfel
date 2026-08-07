/**
 * Generates every static brand asset from `public/logo-mark.svg`:
 *   favicon.ico, icon-32.png, icon-192.png, icon-512.png,
 *   apple-touch-icon.png and the 1200x630 OpenGraph card.
 *
 * Usage: node scripts/generate-assets.mjs
 */
import { readFile, writeFile, copyFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = process.cwd()
const pub = path.join(root, "public")
const tmp = path.join(root, ".asset-tmp")

const BG = { r: 10, g: 10, b: 11, alpha: 1 }
const FONT = "DejaVu Sans, Arial, sans-serif"
const MONO = "DejaVu Sans Mono, Consolas, monospace"

const logoSvg = await readFile(path.join(pub, "logo-mark.svg"))

/** Renders the logo at `size` px on the dark brand background. */
async function icon(size, outFile) {
	const logo = await sharp(logoSvg, { density: 512 })
		.resize(size, size, {
			fit: "contain",
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.png()
		.toBuffer()

	await sharp({
		create: { width: size, height: size, channels: 4, background: BG },
	})
		.composite([{ input: logo, gravity: "centre" }])
		.png()
		.toFile(outFile)

	return outFile
}

function ogSvg() {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0A0A0B" />
      <stop offset="0.55" stop-color="#0C0E14" />
      <stop offset="1" stop-color="#0A0A0B" />
    </linearGradient>
    <radialGradient id="glowA" cx="0.18" cy="0.12" r="0.62">
      <stop stop-color="#3B82F6" stop-opacity="0.38" />
      <stop offset="1" stop-color="#3B82F6" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowB" cx="0.88" cy="0.92" r="0.6">
      <stop stop-color="#06B6D4" stop-opacity="0.30" />
      <stop offset="1" stop-color="#06B6D4" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="accent" x1="80" y1="0" x2="520" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="#60A5FA" />
      <stop offset="1" stop-color="#22D3EE" />
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#FFFFFF" stroke-opacity="0.035" stroke-width="1" />
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#grid)" />
  <rect width="1200" height="630" fill="url(#glowA)" />
  <rect width="1200" height="630" fill="url(#glowB)" />
  <rect x="0.5" y="0.5" width="1199" height="629" fill="none" stroke="#FFFFFF" stroke-opacity="0.09" />

  <rect x="80" y="432" width="132" height="4" rx="2" fill="url(#accent)" />

  <text x="80" y="258" font-family="${MONO}" font-size="26" letter-spacing="5" fill="#22D3EE">SOFTWARE DEVELOPER</text>
  <text x="80" y="356" font-family="${FONT}" font-size="82" font-weight="bold" fill="#F5F5F7">Bahodir Axmedov</text>
  <text x="80" y="406" font-family="${FONT}" font-size="32" fill="#A6A6AE">Telegram Bots \u00b7 Full Stack Web \u00b7 Automation \u00b7 AI</text>
  <text x="80" y="512" font-family="${MONO}" font-size="28" fill="#8A8A93">bahodir.dev</text>
  <text x="80" y="556" font-family="${FONT}" font-size="24" fill="#5F5F68">Kelajakni birga quramiz.</text>
</svg>`
}

async function buildOg() {
	const base = await sharp(Buffer.from(ogSvg()), { density: 144 })
		.resize(1200, 630)
		.png()
		.toBuffer()

	const logo = await sharp(logoSvg, { density: 512 })
		.resize(132, 132)
		.png()
		.toBuffer()

	await sharp(base)
		.composite([{ input: logo, top: 76, left: 80 }])
		.png({ quality: 92 })
		.toFile(path.join(pub, "og.png"))
}

/** Verifies that the SVG renderer can actually draw text with a real font. */
async function textRendersOk() {
	const probe = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><rect width="200" height="60" fill="#000000"/><text x="10" y="42" font-family="${FONT}" font-size="36" fill="#FFFFFF">Bahodir</text></svg>`
	const stats = await sharp(Buffer.from(probe), { density: 144 }).stats()
	return stats.channels[0].mean > 1
}

const ok = await textRendersOk()
console.log(ok ? "text rendering: OK" : "text rendering: FAILED (no font)")

await icon(16, path.join(tmp, "icon-16.png")).catch(async () => {
	await (await import("node:fs/promises")).mkdir(tmp, { recursive: true })
	return icon(16, path.join(tmp, "icon-16.png"))
})
await icon(48, path.join(tmp, "icon-48.png"))
await icon(32, path.join(pub, "icon-32.png"))
await icon(192, path.join(pub, "icon-192.png"))
await icon(512, path.join(pub, "icon-512.png"))
await icon(180, path.join(pub, "apple-touch-icon.png"))
await copyFile(path.join(pub, "logo-mark.svg"), path.join(pub, "logo.svg"))
await buildOg()

console.log("assets generated")
