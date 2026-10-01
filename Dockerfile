# =============================================================================
# Production Dockerfile for Railway (and any other Docker-aware platform).
#
# Slim Node base — the crawl runs on Firecrawl's hosted browser so there's no
# Chromium or Playwright inside this image. Image size dropped from ~1.6GB
# (Microsoft Playwright image) to ~250MB.
# =============================================================================

FROM node:22-slim AS base

WORKDIR /app

# ----- Install npm dependencies (cached) -----
# Copy prisma/ first because package.json's postinstall hook runs `prisma generate`,
# which needs the schema file to exist at install time.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# ----- Copy source -----
COPY . .

# Prisma client generation + Next.js build
RUN npx prisma generate
RUN npm run build

# ----- Runtime -----
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

# Screenshots are persisted via Railway Volumes, which mounts a persistent disk
# at /app/public/screenshots at runtime. No Docker VOLUME directive needed —
# Railway rejects it. The directory is created automatically when the volume mounts.

EXPOSE 8080

# Startup script runs migrations against Turso, cleans up any orphaned
# "processing" rows from a previous crash, then hands off to Next.js.
CMD ["sh", "scripts/start.sh"]
