import { getTranslations } from "next-intl/server"
import { Reveal } from "@/components/ui/motion"
import {
	Container,
	EmptyState,
	Section,
	SectionHeading,
} from "@/components/ui/primitives"
import { pick } from "@/lib/i18n-content"
import type { Locale } from "@/i18n/routing"
import { GalleryGrid, type GalleryPhoto } from "./GalleryGrid"

type GalleryRow = Record<string, unknown> & {
	id: string
	url: string
	thumbUrl?: string | null
	category?: string | null
}

/**
 * The gallery ships empty on purpose — items are added from the admin panel
 * and the section immediately starts rendering them.
 */
export async function Gallery({
	items,
	locale,
}: {
	items: GalleryRow[]
	locale: Locale
}) {
	const t = await getTranslations("gallery")

	const photos: GalleryPhoto[] = items.map((item) => {
		const url = String(item.url)
		return {
			id: String(item.id),
			title: pick(item, "title", locale),
			url,
			thumbUrl: item.thumbUrl ? String(item.thumbUrl) : url,
			category: item.category ? String(item.category) : null,
		}
	})

	return (
		<Section id="gallery">
			<Container>
				<Reveal>
					<SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
				</Reveal>

				<div className="mt-10">
					{photos.length === 0 ? (
						<Reveal delay={0.05}>
							<EmptyState title={t("title")} description={t("empty")} />
						</Reveal>
					) : (
						<GalleryGrid
							photos={photos}
							labels={{
								close: t("close"),
								prev: t("prev"),
								next: t("next"),
							}}
						/>
					)}
				</div>
			</Container>
		</Section>
	)
}
