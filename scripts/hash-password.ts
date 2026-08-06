/**
 * Generates a bcrypt hash for the admin password.
 *
 *   npm run hash -- "MyStrongPassword123!"
 *
 * Copy the printed value into `.env` as ADMIN_PASSWORD_HASH.
 * The plain password is never stored anywhere.
 */

import bcrypt from "bcryptjs"
import { randomBytes } from "node:crypto"

const password = process.argv[2]

if (!password) {
	console.error("\n❌ Parol ko'rsatilmadi.\n")
	console.error('   Foydalanish:  npm run hash -- "SizningParolingiz"\n')
	process.exit(1)
}

if (password.length < 8) {
	console.error("\n❌ Parol kamida 8 belgidan iborat bo'lishi kerak.\n")
	process.exit(1)
}

const hash = bcrypt.hashSync(password, 12)
const secret = randomBytes(32).toString("base64")

console.log("\n✅ .env fayliga quyidagilarni qo'shing:\n")
console.log(`ADMIN_PASSWORD_HASH="${hash}"`)
console.log(`AUTH_SECRET="${secret}"`)
console.log(
	"\nℹ️  AUTH_SECRET faqat namuna sifatida yaratildi — agar sizda allaqachon bo'lsa, o'zgartirmang.\n",
)
