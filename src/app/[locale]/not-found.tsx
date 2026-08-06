import { getTranslations } from "next-intl/server"
import { ArrowLeft, Compass } from "lucide-react"
import { Container, LinkButton } from "@/components/ui/primitives"
import { LogoMark } from "@/components/ui/LogoMark"

export default async function NotFound() {
	const t = await getTranslations("common")

	return (
		<main className="relative flex min-h-[72vh] items-center justify-center py-24">
			<Container>
				<div className="mx-auto flex max-w-xl flex-col items-center text-center">
					<LogoMark size={54} animated />

					<p className="mt-8 text-[80px] font-bold leading-none tracking-tight gradient-text sm:text-[104px]">
						404
					</p>

					<h1 className="mt-4 text-display-md font-semibold text-ink">
						{t("notFoundTitle")}
					</h1>

					<p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-ink-muted">
						{t("notFoundText")}
					</p>

					<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
						<LinkButton href="/" variant="primary" size="md">
							<ArrowLeft className="h-4 w-4" strokeWidth={2} />
							{t("goHome")}
						</LinkButton>
						<LinkButton href="/projects" variant="outline" size="md">
							<Compass className="h-4 w-4" strokeWidth={1.8} />
							Projects
						</LinkButton>
					</div>
				</div>
			</Container>
		</main>
	)
}
