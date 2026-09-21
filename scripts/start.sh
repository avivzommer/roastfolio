#!/bin/sh
# Container startup — run migrations, then hand off to Next.js.
# `set -e` makes the script exit loudly on any failure so Railway logs
# show the real error instead of silently stalling.
set -e

echo "[boot] step 1: env"
echo "[boot]   PORT=$PORT"
echo "[boot]   NODE_ENV=$NODE_ENV"
echo "[boot]   DATABASE_URL_LEN=${#DATABASE_URL}"

echo "[boot] step 2: running migrations"
node scripts/apply-migrations.mjs

echo "[boot] step 3: migrations done, starting Next.js"
exec ./node_modules/.bin/next start -H 0.0.0.0 -p 8080
