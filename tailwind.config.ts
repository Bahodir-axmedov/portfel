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
				// Violet is the third brand stop. It exists so the palette reads
				// blue -> violet -> cyan instead of a flat two-stop ramp: a single
				// hue interpolation between #3B82F6 and #06B6D4 passes through a
				// muddy teal, while routing through violet keeps every midpoint
				// saturated. Used by aurora, nebula, neon rings and the tri-stop
				// gradients below.
				violet: {
					100: "#EDE9FE",
					200: "#DDD6FE",
					300: "#C4B5FD",
					400: "#A78BFA",
					500: "#8B5CF6",
					600: "#7C3AED",
					DEFAULT: "#8B5CF6",
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
				"display-xl": [
					"clamp(2.125rem,4.05vw,3.5rem)",
					{ lineHeight: "1.08", letterSpacing: "-0.033em" },
				],
				"display-lg": [
					"clamp(1.875rem,3.7vw,2.75rem)",
					{ lineHeight: "1.12", letterSpacing: "-0.032em" },
				],
				"display-md": [
					"clamp(1.5rem,2.4vw,2rem)",
					{ lineHeight: "1.2", letterSpacing: "-0.028em" },
				],
			},
			borderRadius: {
				sm: "10px",
				md: "14px",
				lg: "20px",
				xl: "28px",
			},
			backgroundImage: {
				// Tri-stop: blue -> violet -> cyan. The violet stop sits at 48%
				// rather than 50% so the cyan half reads slightly wider, which
				// keeps white text legible over the right end of CTA buttons.
				"brand-gradient":
					"linear-gradient(135deg,#3B82F6 0%,#8B5CF6 48%,#06B6D4 100%)",
				// 300% wide so `animate-gradient-pan` has room to travel without
				// the seam becoming visible.
				"brand-gradient-pan":
					"linear-gradient(110deg,#3B82F6 0%,#8B5CF6 25%,#06B6D4 50%,#8B5CF6 75%,#3B82F6 100%)",
				"mesh-hero":
					"radial-gradient(60% 55% at 18% 12%,rgba(59,130,246,0.20),transparent 62%),radial-gradient(50% 50% at 82% 22%,rgba(139,92,246,0.17),transparent 60%),radial-gradient(55% 60% at 60% 92%,rgba(6,182,212,0.14),transparent 62%)",
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
				"glow-violet": "0 6px 26px rgba(139,92,246,0.35)",
				"glow-cyan": "0 6px 26px rgba(6,182,212,0.32)",
				// Neomorphism: one light source top-left, one shadow bottom-right,
				// plus an inset hairline. On a near-black surface the "light" lobe
				// has to be a white alpha rather than a lighter grey, otherwise it
				// reads as grey smudge instead of a lit edge.
				neo: "-6px -6px 16px rgba(255,255,255,0.028), 8px 10px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
				"neo-pressed":
					"inset -4px -4px 10px rgba(255,255,255,0.022), inset 5px 6px 14px rgba(0,0,0,0.55)",
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
				// Slow conic sweep for gradient rings around the portrait and the
				// circular skill dials.
				"spin-slow": {
					from: { transform: "rotate(0deg)" },
					to: { transform: "rotate(360deg)" },
				},
				// Floating badges: a second float track offset in both phase and
				// amplitude so stacked badges never bob in lockstep.
				"float-soft": {
					"0%,100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-7px)" },
				},
				"pulse-ring": {
					"0%": { transform: "scale(0.92)", opacity: "0.7" },
					"70%,100%": { transform: "scale(1.55)", opacity: "0" },
				},
			},
			animation: {
				"gradient-pan": "gradient-pan 8s ease-in-out infinite",
				float: "float 6s ease-in-out infinite",
				caret: "caret 1s step-end infinite",
				shimmer: "shimmer 2.2s infinite",
				"draw-logo": "draw-logo 1.4s cubic-bezier(0.16,1,0.3,1) forwards",
				"spin-slow": "spin-slow 9s linear infinite",
				"float-soft": "float-soft 4.5s ease-in-out infinite",
				"pulse-ring": "pulse-ring 2.4s cubic-bezier(0.16,1,0.3,1) infinite",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
}

export default config
