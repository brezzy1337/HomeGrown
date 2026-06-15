# syntax=docker/dockerfile:1
#
# HomeGrown server image — Milestone 1
# Build context: repo root  (docker build -f infra/Dockerfile .)
# Target platform: linux/amd64 (GCP Cloud Run)
#
# M1 TRADEOFF: tsx executes TypeScript directly at runtime, so devDependencies
# (tsx, esbuild) must be present in the final image. A compiled/bundled build
# that drops devDeps is planned for a later milestone.
#
# NO SECRETS. Secrets (DATABASE_URL, Stripe keys, etc.) are injected at deploy
# time via GCP Secret Manager → Cloud Run env vars. Never bake a value here.

# Pin to a specific digest for full reproducibility.
# node:22.16.0-slim  (linux/amd64) — update the digest when you intentionally
# upgrade the base image; CI will reject an unreviewed digest change.
FROM node:22.16.0-slim@sha256:1471ea646673136b8308550ac14b36d847ffb21c24bc31828279e443c924e488 AS base

# ── System deps ────────────────────────────────────────────────────────────────
# esbuild (tsx's engine) ships its linux-x64 prebuilt binary via the optional
# @esbuild/linux-x64 package, so no native compilation is needed. We still
# need python3 / make / g++ only if other packages require them — they don't
# in M1, so keep the image minimal.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ── pnpm via corepack ───────────────────────────────────────────────────────
# Pin to the same version declared in root package.json (packageManager field).
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ── Workspace skeleton ──────────────────────────────────────────────────────
# Copy manifests first so the install layer is cached independently of source.
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Workspace package manifests (no source yet — install cache layer)
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/server/package.json      ./apps/server/package.json

# ── Install ─────────────────────────────────────────────────────────────────
# --frozen-lockfile: committed pnpm-lock.yaml is authoritative; fail if drift.
# ignore-scripts=true is set in .npmrc; esbuild's prebuilt binary arrives via
# the @esbuild/linux-x64 optional dep (no lifecycle script needed on linux/amd64).
# --filter keeps install scoped to the server and its deps.
RUN pnpm install --frozen-lockfile --filter @homegrown/server...

# ── Application source ──────────────────────────────────────────────────────
COPY packages/shared/ ./packages/shared/
COPY apps/server/     ./apps/server/

# ── Runtime ─────────────────────────────────────────────────────────────────
# Cloud Run injects PORT (typically 8080). The server reads it via env.ts and
# defaults to 3001 locally — do NOT hardcode a value here.
# DATABASE_URL and NODE_ENV are injected at deploy time (Secret Manager / run vars).
ENV NODE_ENV=production

# Expose is documentation only; Cloud Run binds whatever PORT it injects.
EXPOSE 8080

# Non-root user for defence-in-depth.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs server
USER server

CMD ["pnpm", "--filter", "@homegrown/server", "start"]
