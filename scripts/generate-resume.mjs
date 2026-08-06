/**
 * Renders the ATS-friendly resume PDFs (UZ / RU / EN) with headless Chromium.
 *
 * Usage:  node scripts/generate-resume.mjs
 * Set CHROME_BIN if Chromium is not on PATH as `chromium`.
 *
 * Output: public/resume/bahodir-axmedov-cv-{uz,ru,en}.pdf
 */
import { mkdir, writeFile, rm } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import path from "node:path"
import { contact, resumes } from "./resume-data.mjs"

const run = promisify(execFile)
const root = process.cwd()
const outDir = path.join(root, "public", "resume")
const tmpDir = path.join(root, ".resume-tmp")

const escape = (value) =>
	String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")

const CANDIDATES = [
	process.env.CHROME_BIN,
	"chromium",
	"chromium-browser",
	"google-chrome",
	"google-chrome-stable",
].filter(Boolean)

async function findChrome() {
	for (const binary of CANDIDATES) {
		try {
			await run(binary, ["--version"])
			return binary
		} catch {
			continue
		}
	}
	throw new Error(
		"Chromium topilmadi. CHROME_BIN o'zgaruvchisini o'rnating yoki chromium o'rnating.",
	)
}

function template(data) {
	const { labels } = data

	const experience = data.experience
		.map(
			(item) => `
      <article class="entry">
        <div class="entry-head">
          <h3>${escape(item.role)}</h3>
          <span class="period">${escape(item.period)}</span>
        </div>
        <p class="org">${escape(item.company)}</p>
        <ul>
          ${item.bullets.map((bullet) => `<li>${escape(bullet)}</li>`).join("")}
        </ul>
      </article>`,
		)
		.join("")

	const projects = data.projects
		.map(
			(item) => `
      <article class="entry">
        <div class="entry-head">
          <h3>${escape(item.name)}</h3>
          <span class="period">${escape(item.period)}</span>
        </div>
        <p class="text">${escape(item.text)}</p>
      </article>`,
		)
		.join("")

	const skills = data.skills
		.map(
			([group, value]) => `
      <div class="skill-row">
        <span class="skill-label">${escape(group)}</span>
        <span class="skill-value">${escape(value)}</span>
      </div>`,
		)
		.join("")

	const education = data.education
		.map(
			(item) => `
      <article class="entry">
        <div class="entry-head">
          <h3>${escape(item.school)}</h3>
          <span class="period">${escape(item.period)}</span>
        </div>
        <p class="text">${escape(item.degree)}</p>
      </article>`,
		)
		.join("")

	return `<!doctype html>
<html lang="${data.lang}">
<head>
<meta charset="utf-8" />
<title>${escape(contact.name)} \u2014 CV</title>
<style>
  @page { size: A4; margin: 14mm 15mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "DejaVu Sans", Arial, Helvetica, sans-serif;
    font-size: 10.2pt;
    line-height: 1.5;
    color: #14161a;
  }
  header { border-bottom: 2px solid #0f172a; padding-bottom: 9px; margin-bottom: 14px; }
  h1 { font-size: 21pt; margin: 0; letter-spacing: -0.4px; }
  .role { font-size: 11.5pt; color: #2563eb; font-weight: bold; margin: 3px 0 8px; }
  .contacts { font-size: 9.2pt; color: #3d4450; }
  .contacts span { margin-right: 10px; white-space: nowrap; }
  h2 {
    font-size: 10.4pt;
    text-transform: uppercase;
    letter-spacing: 1.1px;
    color: #0f172a;
    border-bottom: 1px solid #cbd3de;
    padding-bottom: 3px;
    margin: 15px 0 8px;
  }
  .entry { margin-bottom: 10px; page-break-inside: avoid; }
  .entry-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
  .entry h3 { font-size: 10.6pt; margin: 0; }
  .period { font-size: 9pt; color: #5b6472; white-space: nowrap; }
  .org { margin: 1px 0 4px; font-size: 9.6pt; color: #2563eb; }
  .text { margin: 2px 0 0; }
  ul { margin: 4px 0 0; padding-left: 15px; }
  li { margin-bottom: 2px; }
  .skill-row { display: flex; gap: 10px; margin-bottom: 3px; }
  .skill-label { min-width: 140px; font-weight: bold; }
  .skill-value { flex: 1; }
  .langs { margin: 0; padding-left: 15px; }
  .summary { margin: 0; text-align: justify; }
</style>
</head>
<body>
  <header>
    <h1>${escape(contact.name)}</h1>
    <p class="role">${escape(data.title)}</p>
    <div class="contacts">
      <span>${escape(contact.email)}</span>
      <span>${escape(contact.phone)}</span>
      <span>${escape(contact.telegram)}</span>
      <span>${escape(contact.github)}</span>
      <span>${escape(contact.linkedin)}</span>
    </div>
  </header>

  <section>
    <h2>${escape(labels.summary)}</h2>
    <p class="summary">${escape(data.summary)}</p>
  </section>

  <section>
    <h2>${escape(labels.experience)}</h2>
    ${experience}
  </section>

  <section>
    <h2>${escape(labels.projects)}</h2>
    ${projects}
  </section>

  <section>
    <h2>${escape(labels.skills)}</h2>
    ${skills}
  </section>

  <section>
    <h2>${escape(labels.education)}</h2>
    ${education}
  </section>

  <section>
    <h2>${escape(labels.languages)}</h2>
    <ul class="langs">
      ${data.languages.map((item) => `<li>${escape(item)}</li>`).join("")}
    </ul>
  </section>
</body>
</html>`
}

const chrome = await findChrome()
await mkdir(outDir, { recursive: true })
await mkdir(tmpDir, { recursive: true })

for (const [locale, data] of Object.entries(resumes)) {
	const htmlPath = path.join(tmpDir, `cv-${locale}.html`)
	const pdfPath = path.join(outDir, `bahodir-axmedov-cv-${locale}.pdf`)

	await writeFile(htmlPath, template(data), "utf8")

	await run(chrome, [
		"--headless=new",
		"--no-sandbox",
		"--disable-gpu",
		"--disable-dev-shm-usage",
		"--no-pdf-header-footer",
		`--print-to-pdf=${pdfPath}`,
		"file:" + "//" + htmlPath,
	])

	console.log(`created ${path.relative(root, pdfPath)}`)
}

await rm(tmpDir, { recursive: true, force: true })
console.log("resumes generated")
