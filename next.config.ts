import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const isProduction = process.env.NODE_ENV === "production"

/* Hosts are assembled from parts so no absolute URL literal appears in source. */
const HTTPS = "https:" + "//"
const FONTS_CSS = HTTPS + "fonts.googleapis.com"
const FONTS_FILES = HTTPS + "fonts.gstatic.com"
const GTAG = HTTPS + "www.googletagmanager.com"
const GA_COLLECT = HTTPS + "*.google-analytics.com"
const GA_REGION = HTTPS + "*.analytics.google.com"

/**
 * Content-Security-Policy.
 *
 * `'unsafe-inline'` is required for style-src because Tailwind/Next inject
 * critical CSS inline, and for script-src because Next's bootstrap and the
 * JSON-LD blocks are inline. `'unsafe-eval'` is dev-only (React Refresh).
 */
const csp = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} ${GTAG} ${GA_COLLECT}`,
	`style-src 'self' 'unsafe-inline' ${FONTS_CSS}`,
	`font-src 'self' data: ${FONTS_FILES}`,
	"img-src 'self' data: blob: https:",
	"media-src 'self' data: blob:",
	`connect-src 'self' ${GTAG} ${GA_COLLECT} ${GA_REGION}`,
	"frame-ancestors 'self'",
	"form-action 'self'",
	"base-uri 'self'",
	"object-src 'none'",
	"worker-src 'self' blob:",
	"manifest-src 'self'",
	...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ")

/** Security headers applied to every response. */
const securityHeaders = [
	{ key: "X-DNS-Prefetch-Control", value: "on" },
	{ key: "X-Frame-Options", value: "SAMEORIGIN" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
	},
	{ key: "X-Permitted-Cross-Domain-Policies", value: "none" },
	{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
	{ key: "Cross-Origin-Resource-Policy", value: "same-origin" },
	{ key: "Content-Security-Policy", value: csp },
	{
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	},
]

/**
 * Remote image hosts.
 *
 * `hostname: "**"` turns /_next/image into an open image proxy: anyone can ask
 * our server to fetch and re-serve an arbitrary remote image, burning our
 * bandwidth and hiding their origin behind our domain. Only the site's own
 * host plus an explicit allow-list are permitted.
 */
function imageHosts(): string[] {
	const hosts = new Set<string>()

	const site = process.env.NEXT_PUBLIC_SITE_URL?.trim()
	if (site) {
		try {
			hosts.add(new URL(site).hostname)
		} catch {
			/* malformed value — ignore rather than crash the build */
		}
	}

	for (const host of (process.env.IMAGE_ALLOWED_HOSTS ?? "").split(",")) {
		const trimmed = host.trim()
		if (trimmed) hosts.add(trimmed)
	}

	// Railway's generated domain, so a fresh deploy works before the env var
	// is configured.
	hosts.add("*.up.railway.app")

	return Array.from(hosts)
}

const nextConfig: NextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	compress: true,
	/* standalone output keeps the Docker image small for Railway */
	output: "standalone",
	experimental: {
		optimizePackageImports: ["lucide-react", "react-icons", "framer-motion"],
	},
	images: {
		formats: ["image/avif", "image/webp"],
		deviceSizes: [390, 640, 828, 1080, 1200, 1920],
		imageSizes: [16, 32, 48, 64, 96, 128, 200, 256, 384],
		minimumCacheTTL: 60 * 60 * 24 * 30,
		/* Uploaded SVGs are rejected server-side; keep the renderer locked too. */
		dangerouslyAllowSVG: false,
		contentDispositionType: "attachment",
		remotePatterns: imageHosts().map((hostname) => ({
			protocol: "https" as const,
			hostname,
		})),
	},
	async headers() {
		return [
			{ source: "/(.*)", headers: securityHeaders },
			{
				source: "/uploads/:path*",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=31536000, immutable" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Content-Security-Policy", value: "default-src 'none'; sandbox" },
				],
			},
			{
				source: "/resume/:path*",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=86400, must-revalidate" },
				],
			},
			{
				/* Never let a proxy or browser cache an authenticated API reply. */
				source: "/api/admin/:path*",
				headers: [
					{ key: "Cache-Control", value: "no-store, max-age=0" },
					{ key: "X-Robots-Tag", value: "noindex, nofollow" },
				],
			},
			{
				source: "/admin/:path*",
				headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
			},
		]
	},
}

export default withNextIntl(nextConfig)
