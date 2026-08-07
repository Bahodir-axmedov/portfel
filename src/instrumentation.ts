/**
 * Next.js instrumentation hooks.
 *
 * `onRequestError` is the only officially supported way to observe the REAL
 * error behind a production "Server Components render" digest. In production
 * builds Next.js masks the message in both the browser payload and the default
 * console line, printing only the wrapper plus `digest: '<hash>'`. The digest is
 * a one-way hash, so it can never be turned back into a message. This hook
 * receives the original `Error` instance before masking, which lets the
 * container log the exact name, message, cause and stack.
 *
 * Runs on the Node.js server runtime only. It writes to stderr, so the output
 * appears directly in Railway deploy logs next to the masked line.
 */

type RequestErrorContext = {
	routerKind?: string
	routePath?: string
	routeType?: string
	renderSource?: string
	revalidateReason?: string
}

type RequestErrorRequest = {
	path?: string
	method?: string
	headers?: Record<string, string | undefined>
}

const SEPARATOR = "=".repeat(72)

function describe(value: unknown, depth = 0): string[] {
	const indent = "  ".repeat(depth)
	const lines: string[] = []

	if (value instanceof Error) {
		lines.push(`${indent}name    : ${value.name}`)
		lines.push(`${indent}message : ${value.message}`)

		const digest = (value as Error & { digest?: unknown }).digest
		if (digest !== undefined) {
			lines.push(`${indent}digest  : ${String(digest)}`)
		}

		const code = (value as Error & { code?: unknown }).code
		if (code !== undefined) {
			lines.push(`${indent}code    : ${String(code)}`)
		}

		const stack = value.stack
		if (typeof stack === "string") {
			lines.push(`${indent}stack   :`)
			for (const line of stack.split("\n")) {
				lines.push(`${indent}  ${line.trim()}`)
			}
		}

		if (value.cause !== undefined && depth < 4) {
			lines.push(`${indent}cause   :`)
			lines.push(...describe(value.cause, depth + 1))
		}

		return lines
	}

	try {
		lines.push(`${indent}value   : ${JSON.stringify(value)}`)
	} catch {
		lines.push(`${indent}value   : ${String(value)}`)
	}

	return lines
}

export function onRequestError(
	error: unknown,
	request: RequestErrorRequest,
	context: RequestErrorContext,
): void {
	const lines: string[] = []

	lines.push("")
	lines.push(SEPARATOR)
	lines.push("[onRequestError] UNMASKED SERVER ERROR")
	lines.push(SEPARATOR)
	lines.push(`time         : ${new Date().toISOString()}`)
	lines.push(`method       : ${request.method ?? "unknown"}`)
	lines.push(`path         : ${request.path ?? "unknown"}`)
	lines.push(`routerKind   : ${context.routerKind ?? "unknown"}`)
	lines.push(`routePath    : ${context.routePath ?? "unknown"}`)
	lines.push(`routeType    : ${context.routeType ?? "unknown"}`)
	lines.push(`renderSource : ${context.renderSource ?? "unknown"}`)
	lines.push(SEPARATOR)
	lines.push(...describe(error))
	lines.push(SEPARATOR)
	lines.push("")

	process.stderr.write(`${lines.join("\n")}\n`)
}

/**
 * Required export. Kept intentionally empty: no APM or tracing vendor is wired
 * into this project, and registering nothing keeps cold starts unaffected.
 */
export async function register(): Promise<void> {
	return
}
