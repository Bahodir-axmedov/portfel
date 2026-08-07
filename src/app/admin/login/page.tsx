"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button, Field, Input } from "@/components/ui/primitives"
import { GlassCard } from "@/components/ui/interactive"
import { LogoMark } from "@/components/ui/LogoMark"
import { Icon } from "@/components/ui/Icon"

export default function AdminLoginPage() {
	const router = useRouter()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const [pending, setPending] = useState(false)

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setPending(true)
		setError("")

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			})

			const payload = await response.json().catch(() => null)

			if (!response.ok) {
				setError(
					payload?.error ??
						payload?.fieldErrors?.[0]?.message ??
						"Kirishda xatolik yuz berdi",
				)
				setPending(false)
				return
			}

			router.replace("/admin")
			router.refresh()
		} catch {
			setError("Serverga ulanib bo'lmadi")
			setPending(false)
		}
	}

	return (
		<div className="ambient-grid relative grid min-h-dvh place-items-center px-5 py-12">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-brand-gradient-soft opacity-40 blur-3xl" />

			<GlassCard className="relative w-full max-w-[400px] p-7" hover={false}>
				<div className="mb-6 flex flex-col items-center gap-3 text-center">
					<LogoMark size={48} animated />
					<div>
						<h1 className="text-lg font-semibold tracking-tight">
							Admin panelga kirish
						</h1>
						<p className="mt-1 text-sm text-ink-muted">
							Portfolio kontentini boshqarish uchun tizimga kiring
						</p>
					</div>
				</div>

				<form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
					<Field label="Email" htmlFor="email" required>
						<Input
							id="email"
							name="email"
							type="email"
							autoComplete="username"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							disabled={pending}
							required
						/>
					</Field>

					<Field label="Parol" htmlFor="password" required>
						<Input
							id="password"
							name="password"
							type="password"
							autoComplete="current-password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							disabled={pending}
							required
						/>
					</Field>

					{error ? (
						<p className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
							<Icon name="ShieldCheck" className="h-4 w-4 shrink-0" />
							{error}
						</p>
					) : null}

					<Button type="submit" disabled={pending} className="mt-1 w-full">
						{pending ? "Tekshirilmoqda…" : "Kirish"}
					</Button>
				</form>
			</GlassCard>
		</div>
	)
}
