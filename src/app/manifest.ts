import type { MetadataRoute } from "next"
import { AUTHOR_NAME, SITE_NAME } from "@/constants"

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: `${AUTHOR_NAME} — Portfolio`,
		short_name: SITE_NAME,
		description:
			"Software Developer — Telegram botlar, web ilovalar va avtomatlashtirish tizimlari.",
		start_url: "/",
		scope: "/",
		display: "standalone",
		orientation: "portrait",
		background_color: "#0A0A0B",
		theme_color: "#0A0A0B",
		categories: ["portfolio", "developer", "technology"],
		icons: [
			{ src: "/icon-32.png", sizes: "32x32", type: "image/png" },
			{
				src: "/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/apple-touch-icon.png",
				sizes: "180x180",
				type: "image/png",
			},
		],
	}
}
