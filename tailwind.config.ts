import type { Config } from "tailwindcss"

/**
 * Design tokens live here and in src/app/globals.css (CSS variables).
 * Never hardcode brand colors inside components — always use these tokens.
 */
const config: Config = {
	darkMode: ["class"],
	// Only directories that actually exist. A glob pointing at a missing
	// folder makes every future reader assume there is a `features/` layer and
	// costs Tailwind a filesystem walk on each rebuild.
	content: [
		"./src/app/**/*.{ts,tsx,mdx}",
		"./src/components/**/*.{ts,tsx}",
		"./src/lib/**/*.{ts,tsx}",
		"./src/constants/**/*.{ts,tsx}",
	],
	theme: {
		container: {
			center: true,
			padding: { DEFAULT: "1.25rem", sm: "1.5rem", lg: "2rem" },
			screens: { "2xl": "1120px" },
		},
		extend: {
			colors: {
				/* --- base surfaces --- */
				base: {
					DEFAULT: "#0A0A0B",
					soft: "#0E0E11",
					raised: "#14141A",
				},
				/* --- brand gradient stops --- */
				// The 100/200/300 steps are required, not decorative: the admin
				// panel uses text-brand-100/200/300 for links, active tabs and
				// icons. Tailwind silently emits nothing for an undefined shade, so
				// those elements inherited the surrounding colour and the hover
				// states were invisible.
				brand: {
					50: "#EFF6FF",
					100: "#DBEAFE",
					200: "#BFDBFE",
					300: "#93C5FD",
					400: "#60A5FA",
					500: "#3B82F6",
					600: "#2563EB",
					700: "#1D4ED8",
					DEFAULT: "#3B82F6",
				},
				accent: {
					100: "#CFFAFE",
					200: "#A5F3FC",
					300: "#67E8F9",
					400: "#22D3EE",
					500: "#06B6D4",
					600: "#0891B2",
					DEFAULT: "#06B6D4",
				},
				ink: {
					DEFAULT: "#F5F5F7",
					muted: "rgba(245,245,247,0.62)",
					faint: "rgba(245,245,247,0.42)",
				},
				line: {
					DEFAULT: "rgba(255,255,255,0.085)",
					strong: "rgba(255,255,255,0.14)",
				},
				glass: {
					DEFAULT: "rgba(255,255,255,0.032)",
					hover: "rgba(255,255,255,0.055)",
				},
				success: "#22C55E",
				warning: "#F59E0B",
				danger: "#EF4444",
			},
			fontFamily: {
				sans: ["var(--font-sans)", "system-ui", "sans-serif"],
				mono: ["var(--font-mono)", "ui-monospace", "monospace"],
			},
			fontSize: {
				"display-xl": ["clamp(2.125rem,4.05vw,3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.033em" }],
				"display-lg": ["clamp(1.875rem,3.7vw,2.75rem)", { lineHeight: "1.12", letterSpacing: "-0.032em" }],
				"display-md": ["clamp(1.5rem,2.4vw,2rem)", { lineHeight: "1.2", letterSpacing: "-0.028em" }],
			},
			borderRadius: {
				sm: "10px",
				md: "14px",
				lg: "20px",
				xl: "28px",
			},
			backgroundImage: {
				"brand-gradient":
					"linear-gradient(135deg,#3B82F6 0%,#22A6E8 50%,#06B6D4 100%)",
				"brand-gradient-soft":
					"linear-gradient(150deg,rgba(59,130,246,0.20) 0%,rgba(6,182,212,0.12) 100%)",
				"glass-edge":
					"linear-gradient(150deg,rgba(59,130,246,0.22),rgba(255,255,255,0.03) 42%,rgba(6,182,212,0.18))",
				grid: "linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px)",
			},
			backgroundSize: { grid: "72px 72px" },
			boxShadow: {
				glow: "0 6px 24px rgba(59,130,246,0.32)",
				"glow-lg": "0 10px 34px rgba(59,130,246,0.45)",
				card: "0 24px 60px rgba(0,0,0,0.5)",
				"inset-hairline": "inset 0 1px 0 rgba(255,255,255,0.04)",
			},
			backdropBlur: { glass: "18px" },
			transitionTimingFunction: {
				premium: "cubic-bezier(0.16,1,0.3,1)",
			},
			keyframes: {
				"gradient-pan": {
					"0%,100%": { backgroundPosition: "0% 50%" },
					"50%": { backgroundPosition: "100% 50%" },
				},
				float: {
					"0%,100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-12px)" },
				},
				caret: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
				shimmer: {
					"100%": { transform: "translateX(100%)" },
				},
				"draw-logo": {
					from: { strokeDashoffset: "180" },
					to: { strokeDashoffset: "0" },
				},
			},
			animation: {
				"gradient-pan": "gradient-pan 8s ease-in-out infinite",
				float: "float 6s ease-in-out infinite",
				caret: "caret 1s step-end infinite",
				shimmer: "shimmer 2.2s infinite",
				"draw-logo": "draw-logo 1.4s cubic-bezier(0.16,1,0.3,1) forwards",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
}

export default config
