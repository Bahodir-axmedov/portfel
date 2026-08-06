# syntax=docker/dockerfile:1

# ---------- dependencies ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts || npm install --ignore-scripts

# ---------- build ----------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Prisma only needs a syntactically valid URL to generate the client.
ENV DATABASE_URL="file:./build.db"

RUN npx prisma generate
RUN npm run build

# The seed script is TypeScript and imports the /content JSON files, but the
# runtime image ships no TypeScript toolchain. Bundling it here to plain
# CommonJS (with the JSON inlined) lets the entrypoint seed a fresh Railway
# volume using nothing but `node`.
RUN npx esbuild prisma/seed.ts \
	--bundle \
	--platform=node \
	--target=node20 \
	--format=cjs \
	--outfile=prisma/seed.cjs \
	--external:@prisma/client \
	--loader:.json=json \
	--log-level=warning

# ---------- runtime ----------
FROM node:20-alpine AS runner
# su-exec lets the entrypoint drop root *after* fixing volume ownership.
RUN apk add --no-cache openssl su-exec wget
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Railway volume is mounted at /data
ENV DATABASE_URL="file:/data/portfolio.db"
ENV UPLOAD_DIR="/data/uploads"

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma CLI + schema so the container can push the schema on boot
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/content ./content
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && mkdir -p /data/uploads && chown -R nextjs:nodejs /data /app

# NOTE: `USER nextjs` is deliberately NOT set here.
#
# A Railway volume is attached at /data *after* the image is built and it is
# owned by root. A container that has already dropped privileges cannot chown
# it, so the first write fails with EACCES and the service crash-loops. The
# entrypoint therefore starts as root, fixes ownership of the mounted volume,
# and then drops to nextjs:nodejs with su-exec before exec'ing the server.
# The Node process itself never runs as root.

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
	CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/api/health || exit 1

ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]
