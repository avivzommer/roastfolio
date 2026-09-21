# =============================================================================
# Production Dockerfile for Railway (and any other Docker-aware platform).
#
# Base image: Microsoft's Playwright image. It bundles Node 22, Chromium, and
# every system library Playwright needs (fonts, glibc bits, libgbm, libnss, …).
# Using it instead of node-slim saves us ~10 lines of apt-get installs and
# guarantees the headless browser actually runs.
# =============================================================================

FROM mcr.microsoft.com/playwright:v1.55.0-noble AS base

WORKDIR /app

# ----- Install npm dependencies (cached) -----
# Copy prisma/ first because package.json's postinstall hook runs `prisma generate`,
# which needs the schema file to exist at install time.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# ----- Copy source -----
COPY . .

# Make sure the locally-installed Playwright Chromium matches our npm version
# (the base image's Chromium tracks Microsoft's tag, not our package.json).
RUN npx playwright install chromium

# Prisma client generation + Next.js build
RUN npx prisma generate
RUN npm run build

# ----- Runtime -----
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Screenshots are persisted via Railway Volumes, which mounts a persistent disk
# at /app/public/screenshots at runtime. No Docker VOLUME directive needed —
# Railway rejects it. The directory is created automatically when the volume mounts.

EXPOSE 3000

# Start Next.js directly. Schema migrations are applied manually to Turso via
# `turso db shell` because Prisma 7.x's CLI does not yet support libsql:// URLs.
CMD ["npm", "run", "start"]
