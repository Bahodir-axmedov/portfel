import { cn } from "@/lib/utils"

/**
 * The hero planet.
 *
 * Rendered entirely with CSS gradients: no texture download, no canvas, no
 * WebGL. That is a deliberate trade. A real Earth texture is a 300-500 KB
 * image that has to decode before the largest contentful paint, and a
 * Three.js sphere pulls a ~150 KB runtime into the first bundle. Both cost
 * more than the effect is worth on a first screen that must paint fast on a
 * phone.
 *
 * How the rotation works
 * ----------------------
 * `.planet-surface` and `.planet-clouds` are 200% wide and carry a background
 * tile sized at exactly 50% of their own width. Translating them by -50%
 * therefore lands on a pixel-identical column, so the loop is seamless and
 * needs no JavaScript. Only `transform` is animated, which keeps both bands on
 * the compositor: no layout, no repaint, no main-thread cost while scrolling.
 *
 * Depth comes from stacked layers rather than one gradient:
 *   halo        atmospheric bloom that breathes slowly
 *   surface     the rotating land band
 *   clouds      a second, faster band so the sphere has parallax of its own
 *   terminator  day/night shading, which is what makes it read as a ball
 *   rim         a hairline lit edge, the detail that sells the atmosphere
 *
 * The element is decorative, so it is `aria-hidden` and never focusable.
 */
export function Planet({ className }: { className?: string }) {
	return (
		<div aria-hidden className={cn("planet-stage", className)}>
			<span className="planet-halo" />
			<span className="planet-body">
				<span className="planet-surface" />
				<span className="planet-clouds" />
				<span className="planet-terminator" />
				<span className="planet-rim" />
			</span>
			<span className="planet-arc" />
		</div>
	)
}
