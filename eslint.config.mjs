import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"

/**
 * ESLint 9 flat config.
 *
 * ESLint 9 no longer reads `.eslintrc.json`, so without this file
 * `npm run lint` exits with "couldn't find an eslint.config file".
 * `FlatCompat` lets us keep using the official `eslint-config-next`
 * presets, which are still published in eslintrc format.
 */
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
	{
		ignores: [
			".next/**",
			"node_modules/**",
			"public/**",
			"next-env.d.ts",
			"scripts/**",
		],
	},
	...compat.extends("next/core-web-vitals", "next/typescript"),
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"react-hooks/exhaustive-deps": "warn",
		},
	},
]

export default config
