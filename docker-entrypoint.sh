#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# Boot sequence for the Railway/Docker runtime.
#
# The container starts as root only long enough to make the mounted volume
# writable, then permanently drops to the unprivileged `nextjs` user.
# ---------------------------------------------------------------------------

# Derive the directory that actually holds the SQLite file instead of assuming
# /data. If DATABASE_URL is repointed the entrypoint follows it.
DB_PATH="$(printf '%s' "${DATABASE_URL:-file:/data/portfolio.db}" | sed -e 's/^file://' -e 's/?.*$//')"
case "$DB_PATH" in
	/*) DATA_DIR="$(dirname "$DB_PATH")" ;;
	*)  DATA_DIR="." ;;
esac

UPLOADS="${UPLOAD_DIR:-/data/uploads}"
RUN_AS=""

if [ "$(id -u)" = "0" ]; then
	echo "[boot] preparing ${DATA_DIR} and ${UPLOADS}"
	mkdir -p "$DATA_DIR" "$UPLOADS"
	chown -R nextjs:nodejs "$DATA_DIR" "$UPLOADS"
	RUN_AS="su-exec nextjs:nodejs"
else
	mkdir -p "$DATA_DIR" "$UPLOADS" 2>/dev/null || true
fi

# Creates / migrates the SQLite file that lives on the Railway volume.
# The CLI lives in its own tree (/app/cli/node_modules) so Node resolves its
# full dependency closure — @prisma/config, effect and friends — instead of the
# partial copy that used to crash the container with MODULE_NOT_FOUND.
PRISMA_CLI="./cli/node_modules/prisma/build/index.js"
if [ ! -f "$PRISMA_CLI" ]; then
	echo "[boot] FATAL: Prisma CLI not found at $PRISMA_CLI" >&2
	exit 1
fi

echo "[boot] syncing database schema..."
$RUN_AS node "$PRISMA_CLI" db push --skip-generate --schema=./prisma/schema.prisma

# A fresh Railway volume produces an empty database, and nothing in the app
# falls back to the /content JSON files, so the site would render every section
# blank. `--if-empty` makes this a no-op on every later boot, which means
# content edited from the admin panel is never overwritten. Set SEED_ON_EMPTY=0
# to opt out entirely.
if [ "${SEED_ON_EMPTY:-1}" = "1" ] && [ -f ./prisma/seed.cjs ]; then
	echo "[boot] seeding database if empty..."
	$RUN_AS node ./prisma/seed.cjs --if-empty \
		|| echo "[boot] WARNING: seed step failed, continuing anyway"
fi

echo "[boot] starting Next.js on port ${PORT:-3000}"
exec $RUN_AS node server.js
