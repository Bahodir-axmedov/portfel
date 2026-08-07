"use client"

import { useState, type FormEvent } from "react"
import { useTranslations } from "next-intl"
import { Check, Send, TriangleAlert } from "lucide-react"
import { Button, Field, Input, Textarea } from "@/components/ui/primitives"
import { GlassCard } from "@/components/ui/interactive"

type Status = "idle" | "sending" | "success" | "error"

const EMPTY = { name: "", email: "", subject: "", message: "" }

export function ContactForm() {
	const t = useTranslations("contact")
	const [values, setValues] = useState(EMPTY)
	const [status, setStatus] = useState<Status>("idle")
	const [errors, setErrors] = useState<Record<string, string>>({})

	const update = (field: keyof typeof EMPTY, value: string) => {
		setValues((previous) => ({ ...previous, [field]: value }))
		setErrors((previous) => {
			if (!previous[field]) return previous
			const next = { ...previous }
			delete next[field]
			return next
		})
	}

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setStatus("sending")
		setErrors({})

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			})

			if (!response.ok) {
				const payload = await response.json().catch(() => null)
				if (payload && payload.fieldErrors) setErrors(payload.fieldErrors)
				setStatus("error")
				return
			}

			setValues(EMPTY)
			setStatus("success")
		} catch {
			setStatus("error")
		}
	}

	const sending = status === "sending"

	return (
		<GlassCard className="p-6 md:p-7">
			<form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
				<div className="grid gap-5 sm:grid-cols-2">
					<Field label={t("name")} htmlFor="name" required error={errors.name}>
						<Input
							id="name"
							name="name"
							autoComplete="name"
							placeholder={t("namePlaceholder")}
							value={values.name}
							onChange={(event) => update("name", event.target.value)}
							disabled={sending}
							required
						/>
					</Field>

					<Field
						label={t("email")}
						htmlFor="email"
						required
						error={errors.email}
					>
						<Input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							placeholder={t("emailPlaceholder")}
							value={values.email}
							onChange={(event) => update("email", event.target.value)}
							disabled={sending}
							required
						/>
					</Field>
				</div>

				<Field label={t("subject")} htmlFor="subject" error={errors.subject}>
					<Input
						id="subject"
						name="subject"
						placeholder={t("subjectPlaceholder")}
						value={values.subject}
						onChange={(event) => update("subject", event.target.value)}
						disabled={sending}
					/>
				</Field>

				<Field
					label={t("message")}
					htmlFor="message"
					required
					error={errors.message}
				>
					<Textarea
						id="message"
						name="message"
						rows={5}
						placeholder={t("messagePlaceholder")}
						value={values.message}
						onChange={(event) => update("message", event.target.value)}
						disabled={sending}
						required
					/>
				</Field>

				<div className="flex flex-wrap items-center gap-4">
					<Button type="submit" size="lg" disabled={sending}>
						{sending ? (
							<>
								<span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
								{t("sending")}
							</>
						) : (
							<>
								<Send className="h-4 w-4" strokeWidth={1.9} />
								{t("send")}
							</>
						)}
					</Button>

					{status === "success" ? (
						<p
							role="status"
							className="inline-flex items-center gap-1.5 text-[13px] text-success"
						>
							<Check className="h-4 w-4" strokeWidth={2} />
							{t("success")}
						</p>
					) : null}

					{status === "error" ? (
						<p
							role="alert"
							className="inline-flex items-center gap-1.5 text-[13px] text-danger"
						>
							<TriangleAlert className="h-4 w-4" strokeWidth={1.9} />
							{t("error")}
						</p>
					) : null}
				</div>
			</form>
		</GlassCard>
	)
}
