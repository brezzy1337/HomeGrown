# HomeGrown 🌱

Local food marketplace: discover and buy produce from neighbors and small farms near you.

## Stack (decided June 2026)

| Layer | Choice |
|---|---|
| Mobile | React Native via **Expo** (managed workflow, EAS builds) |
| API | **tRPC** modular monolith on Node |
| Database | **Postgres + PostGIS** (geo discovery is core) |
| Payments | **Stripe Connect Express** (marketplace split payments) |
| Chat | Managed provider (TBD: Stream vs Sendbird) |
| Hosting | **GCP** — Cloud Run (API) + Cloud SQL (Postgres) |

Full decision log: see the Notion hub page ("HomeGrown — Relaunch & Development Hub").

## Layout

```
apps/mobile      Expo app            (@homegrown/mobile)
apps/server      tRPC API monolith   (@homegrown/server)
packages/shared  Shared types/schemas(@homegrown/shared)
infra            GCP deploy config (Cloud Run, Cloud SQL, Dockerfile)
.claude          Claude Code sub-agent orchestration config
```

## Getting started

```bash
corepack enable && corepack prepare pnpm@9.15.0 --activate
pnpm install
cp .env.example .env   # fill in real values — never commit .env

# Initialize the Expo app (one-time, replaces the placeholder):
cd apps/mobile && pnpm create expo-app@latest . --template blank-typescript

pnpm dev:server   # API on :3001
pnpm dev:mobile   # Expo dev server
```

## Ground rules

- **Secrets never enter git.** The legacy repo leaked Braintree/PayPal/JWT/DB credentials; all were rotated. `.env` only.
- **Shared types live in `packages/shared`** and are imported by both apps — no copy-pasted contracts.
- Dependency policy: lockfile committed, exact-ish pins, 7-day release-age cooldown (enforced in `pnpm-workspace.yaml`), install scripts disabled by default.
