import { envNumber } from "@/lib/env"

/**
 * Shared constants.
 *
 * Anything that is *structure* (section order, allowed categories, upload
 * limits) lives here. Anything that is *content* lives in the database and is
 * edited from the admin panel — never hardcoded in components.
 *
 * This module is imported by client components, so it must stay free of
 * server-only dependencies. `@/lib/env` is deliberately dependency-free.
 */

export const SITE_NAME = "Bahodir.dev"
export const AUTHOR_NAME = "Bahodir Axmedov"
export const DEFAULT_OG_IMAGE = "/og.png"
export const NAV_HEIGHT = 76

/** Landing page sections, in order. `key` maps to messages.nav.<key>. */
export const NAV_ITEMS = [
	{ id: "about", key: "about" },
	{ id: "services", key: "services" },
	{ id: "skills", key: "skills" },
	{ id: "projects", key: "projects" },
	{ id: "journey", key: "journey" },
	{ id: "contact", key: "contact" },
] as const

export type NavItem = (typeof NAV_ITEMS)[number]

export const SECTION_IDS: string[] = NAV_ITEMS.map((item) => item.id)

/** Values allowed by the admin forms — kept in sync with messages + Zod. */
export const PROJECT_CATEGORIES = [
	"telegram_bot",
	"fintech",
	"web",
	"automation",
	"ai",
	"data",
	"other",
] as const

export const PROJECT_STATUSES = [
	"active",
	"completed",
	"demo",
	"paused",
	"planned",
] as const

export const SKILL_CATEGORIES = [
	"frontend",
	"backend",
	"fullstack",
	"database",
	"devops",
	"data",
	"network",
	"fundamentals",
] as const

export const EMPLOYMENT_TYPES = [
	"full_time",
	"part_time",
	"freelance",
	"contract",
	"internship",
] as const

export const LOCATION_TYPES = ["onsite", "hybrid", "remote"] as const

export const LANGUAGE_LEVELS = [
	"native",
	"advanced",
	"intermediate",
	"basic",
] as const

/**
 * Upload guardrails — mirrored by the /api/upload route.
 *
 * `image/svg+xml` is intentionally absent. An SVG is an XML document that can
 * carry <script> and event handlers; serving one from the same origin as the
 * admin panel is a stored-XSS primitive that would hand an attacker the
 * session cookie. Raster formats cannot execute.
 */
export const ACCEPTED_IMAGE_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/avif",
	"image/gif",
]

export const ACCEPTED_DOC_TYPES = ["application/pdf"]

export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"]

/**
 * The extension is derived from the *sniffed* MIME type, never from the
 * filename the browser sent. A file called `payload.php.png` therefore lands
 * on disk as `<slug>-<random>.png`.
 */
export const EXTENSION_BY_MIME: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/avif": "avif",
	"image/gif": "gif",
	"application/pdf": "pdf",
	"video/mp4": "mp4",
	"video/webm": "webm",
}

/**
 * `Number("")` is `0`, so the previous `Number(process.env.X ?? 8)` silently
 * turned an empty environment variable into a 0 MB limit — every upload would
 * have been rejected. `envNumber` validates and clamps instead.
 */
export const MAX_UPLOAD_MB = envNumber(process.env.MAX_UPLOAD_MB, 8, {
	min: 1,
	max: 512,
})

/** Simple in-memory throttling. */
export const CONTACT_RATE_LIMIT = { windowMs: 60_000, max: 3 }
export const LOGIN_RATE_LIMIT = { windowMs: 300_000, max: 8 }
export const UPLOAD_RATE_LIMIT = { windowMs: 60_000, max: 30 }
export const ADMIN_API_RATE_LIMIT = { windowMs: 60_000, max: 240 }

/** Admin list pagination. */
export const ADMIN_PAGE_SIZE = 25
export const ADMIN_PAGE_SIZES = [10, 25, 50, 100] as const
export const ADMIN_MAX_PAGE_SIZE = 200

/** Page views older than this are pruned so the volume cannot grow forever. */
export const ANALYTICS_RETENTION_DAYS = 400

/** Admin resources rendered by the config-driven CRUD screens. */
export const ADMIN_RESOURCES = [
	"projects",
	"skills",
	"languages",
	"services",
	"experiences",
	"education",
	"certificates",
	"achievements",
	"timeline",
	"stats",
	"gallery",
	"testimonials",
	"socials",
	"qrcodes",
	"posts",
	"seo",
	"settings",
] as const

export type AdminResource = (typeof ADMIN_RESOURCES)[number]
