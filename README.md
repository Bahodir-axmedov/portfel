# Bahodir.dev — Portfolio

Bahodir Axmedov uchun premium darajadagi shaxsiy portfolio website.
Next.js 15 (App Router), TypeScript, TailwindCSS, Prisma + SQLite, Framer Motion va
to'liq admin panel bilan. Uch tilda: **O'zbek · Rus · Ingliz**.

---

## 1. Texnologiyalar

| Qatlam | Texnologiya |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Components, standalone build) |
| Til | TypeScript (strict) |
| Styling | TailwindCSS 3 + custom design tokens, glassmorphism |
| Animatsiya | Framer Motion, Lenis smooth scroll, custom hooks |
| Ma'lumotlar bazasi | SQLite + Prisma ORM (Railway volume'da saqlanadi) |
| i18n | next-intl (`uz` default, `ru`, `en`) |
| Auth | JWT session cookie (`jose`) + bcrypt parol hash |
| Ikonlar | lucide-react |
| QR | qrcode (server-side SVG / dataURL) |
| Rasm | next/image + sharp optimizatsiya |
| Deploy | Docker + Railway |

---

## 2. Tez boshlash

```bash
# 1. Paketlarni o'rnatish
npm install

# 2. Muhit o'zgaruvchilari
cp .env.example .env

# 3. Admin parol hashini yaratish (chiqqan qiymatni .env ga qo'ying)
npm run hash "MeningKuchliParolim123"

# 4. Bazani yaratish + boshlang'ich ma'lumotlarni yuklash
npm run setup

# 5. Ishga tushirish
npm run dev
```

Sayt: `http://localhost:3000`
Admin panel: `http://localhost:3000/admin`

---

## 3. Muhit o'zgaruvchilari (`.env`)

| O'zgaruvchi | Majburiy | Izoh |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Lokal: `file:./dev.db` · Railway: `file:/data/portfolio.db` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | To'liq domen. SEO, sitemap, OG va QR kodlar shundan foydalanadi |
| `ADMIN_EMAIL` | ✅ | Admin panelga kirish emaili |
| `ADMIN_PASSWORD_HASH` | ✅ | `npm run hash` orqali olingan bcrypt hash. **Ochiq parol hech qachon saqlanmaydi** |
| `AUTH_SECRET` | ✅ | Kamida 32 belgi. JWT imzolash kaliti |
| `AUTH_SESSION_HOURS` | ➖ | Sessiya muddati (default `12`) |
| `UPLOAD_DIR` | ➖ | Lokal: `public/uploads` · Railway: `/data/uploads` |
| `MAX_UPLOAD_MB` | ➖ | Fayl hajmi cheklovi (default `8`) |
| `NEXT_PUBLIC_GA_ID` | ➖ | Google Analytics 4 ID. Bo'sh bo'lsa GA umuman yuklanmaydi |
| `TELEGRAM_BOT_TOKEN` | ➖ | Contact formadan kelgan xabarni Telegramga yuborish uchun |
| `TELEGRAM_CHAT_ID` | ➖ | Xabar yuboriladigan chat ID |

---

## 4. Admin panel

`/admin` manzilida joylashgan, `middleware.ts` orqali himoyalangan.

**Imkoniyatlari:**

- **Dashboard** — sayt statistikasi, oxirgi 14 kunlik grafik, eng ko'p ochilgan sahifalar
- **Profil** — ism, bio (3 xil uzunlik), motto, tug'ilgan sana, joylashuv, aloqa, resume fayllari
- **CRUD bo'limlar** — Loyihalar, Ko'nikmalar, Tillar, Xizmatlar, Ish tajribasi, Ta'lim,
  Sertifikatlar, Yutuqlar, Timeline, Statistika, Galereya, Testimonials, Ijtimoiy tarmoqlar,
  QR kodlar, Blog, SEO, Sozlamalar
- **Xabarlar** — contact formadan kelgan xabarlar, o'qildi/o'chirish
- **Fayl yuklash** — rasm, PDF va video (`/api/upload`)
- **Har bir matn maydoni 3 tilda** — UZ / RU / EN tab'lari orqali

Har bir bo'lim `src/lib/resources/` dagi konfiguratsiya asosida avtomatik quriladi.
Yangi maydon qo'shish uchun schema + resource config'ni yangilash kifoya — alohida UI yozish shart emas.

---

## 5. Kontentni tahrirlash

Ikkita yo'l bor:

1. **Admin panel** (tavsiya etiladi) — brauzer orqali, jonli.
2. **`content/*.json`** — boshlang'ich (seed) ma'lumotlar. O'zgartirgandan keyin:

```bash
npm run db:seed
```

`content/` papkasi: `profile.json`, `expertise.json`, `career.json`, `projects.json`, `site.json`.
Interfeys matnlari (tugmalar, sarlavhalar) esa `messages/uz.json`, `ru.json`, `en.json` da.

---

## 6. Foydali buyruqlar

| Buyruq | Vazifasi |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm start` | Production serverni ishga tushirish |
| `npm run setup` | generate + db push + seed (birinchi o'rnatish) |
| `npm run hash <parol>` | Admin parol uchun bcrypt hash |
| `npm run db:studio` | Prisma Studio — bazani vizual ko'rish |
| `npm run db:seed` | `content/*.json` dan ma'lumot yuklash |
| `npm run resume` | 3 tilda ATS-friendly CV PDF yaratish |
| `npm run assets` | Logotipdan favicon, PWA ikonlar va OG rasm yaratish |
| `npm run typecheck` | TypeScript tekshiruvi |

> `npm run resume` va `npm run assets` uchun tizimda **Chromium** bo'lishi kerak
> (`CHROME_BIN` o'zgaruvchisi orqali yo'lni ko'rsatish mumkin).

---

## 7. Loyiha strukturasi

```
src/
├─ app/
│  ├─ [locale]/          # Ko'p tilli public sahifalar
│  │  ├─ page.tsx        # Landing (Hero → Contact)
│  │  └─ projects/       # Loyihalar ro'yxati + detail sahifa
│  ├─ admin/             # Admin panel (tilga bog'liq emas)
│  ├─ api/               # REST endpointlar
│  ├─ sitemap.ts robots.ts manifest.ts
│  └─ globals.css
├─ components/
│  ├─ sections/          # Hero, About, Skills, Projects, Contact ...
│  ├─ layout/            # Navbar, Footer, SiteChrome, LocaleSwitcher
│  ├─ ui/                # primitives, interactive, motion, Icon, LogoMark
│  └─ admin/             # AdminShell, AdminNav, ResourceForm, FieldInput
├─ lib/
│  ├─ resources/         # Admin CRUD konfiguratsiyasi (17 ta resurs)
│  ├─ queries.ts         # Cache'langan ma'lumot o'qish funksiyalari
│  ├─ auth.ts auth-edge.ts validators.ts rate-limit.ts
│  ├─ seo.ts analytics.ts qr.ts utils.ts prisma.ts
├─ hooks/  i18n/  types/  constants/
content/    # Seed ma'lumotlar (JSON)
messages/   # UI tarjimalari
prisma/     # schema.prisma + seed.ts
scripts/    # hash-password, generate-resume, generate-assets
public/     # Rasmlar, ikonlar, CV PDF'lar, uploads
```

---

## 8. Railway'ga deploy qilish

1. Repozitoriyani GitHub'ga yuklang va Railway'da **New Project → Deploy from GitHub** ni tanlang.
   Railway `Dockerfile` ni avtomatik topadi.
2. **Volume qo'shing** va uni `/data` ga mount qiling.
   SQLite bazasi va yuklangan fayllar shu yerda saqlanadi — deploy'lar orasida yo'qolmaydi.
3. **Variables** bo'limiga quyidagilarni qo'shing:

```
DATABASE_URL=file:/data/portfolio.db
UPLOAD_DIR=/data/uploads
NEXT_PUBLIC_SITE_URL=https://<sizning-domeningiz>
ADMIN_EMAIL=Axmedovbahodir1122@gmail.com
ADMIN_PASSWORD_HASH=<npm run hash natijasi>
AUTH_SECRET=<32+ belgili tasodifiy satr>
```

4. Deploy tugagach konteyner ichida bir marta seed qiling (Railway → Shell):

```bash
node ./node_modules/prisma/build/index.js db push
```

   Boshlang'ich kontentni yuklash uchun lokalda `npm run db:seed` qilib, hosil bo'lgan
   `dev.db` ni volume'ga ko'chirish yoki admin panel orqali qo'lda to'ldirish mumkin.

5. Domen ulangach `NEXT_PUBLIC_SITE_URL` ni yangilang — sitemap, OG va QR kodlar avtomatik yangilanadi.

**Docker bilan lokal test:**

```bash
docker compose up --build
```

---

## 9. SEO va Performance

- Har bir sahifa uchun dinamik `metadata`, OpenGraph va Twitter Card
- JSON-LD: `Person`, `WebSite`, `BreadcrumbList`, `CreativeWork` (loyihalar uchun)
- `sitemap.xml` — 3 tilda barcha sahifalar, `robots.txt` — admin va API yopiq
- `hreflang` alternativalari (`uz`, `ru`, `en`, `x-default`)
- AVIF/WebP rasm formatlari, `next/image`, lazy loading
- Security headerlar, rate limiting (login va contact), zod validatsiya, honeypot
- Animatsiyalar `prefers-reduced-motion` va mobil qurilmalarda avtomatik yengillashadi

---

## 10. Muhim eslatmalar

- **Maab Innovation** ish tajribasi uchun boshlanish sanasi `2025-08-01` deb kiritilgan
  ("1 yil" ma'lumoti asosida). Aniq sanani admin panel → **Ish tajribasi** dan tuzating.
- **BondTrader** loyihasining tavsifi va texnologiyalari taxminiy tarzda to'ldirilgan va
  bazada `isDraftInfo: true` deb belgilangan. Saytda "ma'lumotlar yangilanmoqda" izohi
  ko'rinadi — admin paneldan aniqlashtirib, bu belgini olib tashlang.
- **Testimonials** hozircha placeholder holatida (`isPlaceholder: true`). Haqiqiy izohlar
  qo'shilganda placeholder'larni o'chiring.
- **Sertifikatlar, Yutuqlar va Galereya** bo'limlari bo'sh, lekin to'liq ishlaydi —
  ma'lumot qo'shilishi bilan saytda avtomatik paydo bo'ladi.
- **GA4** ID qo'shilmagan. `NEXT_PUBLIC_GA_ID` ni kiritsangiz, analytics avtomatik yoqiladi.
  Undan tashqari sayt o'zining ichki analitikasini ham yuritadi (`/admin` dashboard).
- **GitHub linklari** loyihalar uchun hali qo'shilmagan — admin paneldan qo'shishingiz mumkin.

---

© 2026 Bahodir Axmedov — *Kelajakni birga quramiz.*
