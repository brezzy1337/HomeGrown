# HomeGrown — Project Scope

> Domain specification for the HomeGrown rebuild, derived from the two legacy repositories.
> This document is the source of truth `/code-todo` reads to plan work per domain. It describes
> **what we are building** (the new Stripe/PostGIS/Drizzle/Expo architecture), grounded in **what
> the legacy app actually did**.
>
> **Two layers:** the **product structure** (personas, channels, and the per-feature ledger) comes
> first, immediately below; the **technical domain spec** (data model, APIs, geo, auth, infra)
> follows in §1–§11.

## Provenance

This project is a ground-up rebuild of two legacy repositories:

| Legacy repo | Stack | Role | Becomes |
|---|---|---|---|
| [`brezzy1337/HomeGrownServerTs`](https://github.com/brezzy1337/HomeGrownServerTs) | Express · tRPC v10 · Prisma · Braintree · Stream Chat | API + data | `apps/server` (tRPC monolith, Drizzle, PostGIS, Stripe) |
| [`brezzy1337/HomeGrownNative`](https://github.com/brezzy1337/HomeGrownNative) | Bare React Native 0.69 · Braintree drop-in · react-query v3 · tRPC v10-alpha · Formik | Mobile app | `apps/mobile` (Expo managed, Stripe PaymentSheet) |

The legacy apps were an incomplete MVP: the signup flow never persisted users, several payment
components were referenced but undefined, `HomeScreen` was a stub, and the server's code drifted
out of sync with its own schema. We are keeping the **domain shape and UX intent**, and discarding
the implementation. **Critically, the legacy repos leaked live credentials** (see
[§9 Security lessons](#9-security-lessons-non-negotiable)) — eliminating that class of mistake is a
first-class goal of the rebuild.

> **A note on legacy fidelity.** The legacy schema's *final state* is not automatically canonical —
> it was a contested, half-finished MVP. Where it carried redundant or unsettled complexity, this
> scope simplifies for a **one-region pilot** rather than importing it wholesale (see the `sales`
> drop in §2, single-store decision in §2, and the slimmed signup flow in §7.3).

---

## Product structure — apps, personas & dashboards

HomeGrown is **two apps over one backend**, split by channel. A single tRPC monolith +
`packages/shared` contracts serve both clients; the two apps meet at the marketplace — **growers in
App B supply wholesale buyers in App A.**

### Two apps

- **App B — Community app (mobile, Expo).** The **MVP and current build focus.** A two-sided
  neighborhood marketplace with a built-in growth funnel:
  **shop from neighbors → sell your surplus → grow into a wholesale supplier.** It hosts three of the
  four personas (neighbor buyer, seller, grower). This is `apps/mobile`, and most of it is already
  designed (the `F-` ledger).
- **App A — Sourcing Desk (web).** Wholesale / store buyers running B2B procurement. **Deferred —
  not in the MVP**; it waits until the community and grower supply develop enough to be worth sourcing
  from. Lands as a new `apps/web` domain when greenlit (**Phase 2+**). Web, not mobile, because
  procurement — POs, net-30, receiving, spend analytics — is desk work (`P-021`).

### Four personas

| Persona | App | Platform | Surface (ledger) | Onboarding |
|---|---|---|---|---|
| **Neighbor buyer** (small buyer) | App B | Mobile | browse / order — the `F-` buyer-role flow | sign up → shop |
| **Seller** (neighbor) | App B | Mobile | **Your Stand** (`SELL-`) | welcome → live |
| **Grower** (wholesale supply) | App B | Mobile | **Supply Hub** (`GROW-`) — *unlocked from seller* | apply → verified |
| **Wholesale buyer** (store) | **App A** | **Web** | **Sourcing Desk** (`BUY-`) | apply → approved |

The **B2B produce-department channel** (`P-###` features) is the seam between the two apps: grower
supply in App B meeting wholesale demand in App A. Its legal/ops surface (receiving, invoicing,
eligibility gating) carries real compliance weight, so the channel is **Phase 2+**.

### The seller → grower progression (core thesis)

The small seller is meant to **graduate into a grower** — that conversion is where HomeGrown has the
greatest impact, because it turns casual surplus into reliable wholesale supply for stores. So
**grower is not a separate persona or app — it is a tier unlocked on top of the seller.** The core
workflow (list produce, manage orders, get paid) stays familiar; becoming a grower *unlocks* the
Supply Hub layer (forward capacity, compliance, split payouts, store demand). The ledger encodes the
bridge both ways: `SELL-13` "Upgrade to supply stores" and `GROW-15` "Also sell to neighbors."

> **Account-model consequence:** model this as **one producer account that gains a `grower`
> capability/tier**, not two account types — see [§2](#2-data-model-server-domain). (Forward note;
> not built in the MVP.)

> ⚠️ **Hard constraint — HomeGrown is a marketplace + coordination layer, NOT an ERP.** Integrate
> with the store's POS/ERP (Odoo, ERPNext, or a grocery POS such as Square); **do not rebuild
> inventory management.** The ERP concepts we borrow (FEFO, reorder, invoicing) are coordination
> features layered on top of the store's system of record — not a replacement for it.

---

## Feature ledger

The full per-feature scope lives in **[`.claude/feature_ledger.md`](.claude/feature_ledger.md)** —
that file is the **scope source of truth**; **Figma (`HomeGrown-Redesign`) remains the design source
of truth.** `/code-todo` reads the ledger to plan and track work. It holds five tables:

- **Feature Ledger (`F-###`)** — 45 current-state features in the redesign, grouped by area.
- **Produce Dept, Proposed (`P-###`)** — 21 B2B produce-department features (gardeners/growers →
  grocery produce departments); UX-scoped, not yet designed.
- **Sourcing Desk (`BUY-##`)**, **Your Stand (`SELL-##`)**, **Supply Hub (`GROW-##`)** — the three
  persona dashboards. Their **Source** column maps each feature back to an `F-`/`P-` origin, or marks
  it New / Onboarding / an ERP tag.

### ID prefixes

| Prefix | Meaning |
|---|---|
| `F-###` | Current-state feature — already in the app redesign |
| `P-###` | Proposed produce-department channel feature (B2B: gardeners/growers → grocery stores) |
| `BUY-##` | Store-buyer dashboard feature — **Sourcing Desk** |
| `SELL-##` | Neighbor-seller dashboard feature — **Your Stand** |
| `GROW-##` | Wholesale-grower dashboard feature — **Supply Hub** |

### Source column (dashboard tables)

The `BUY-/SELL-/GROW-` dashboards map each feature to its origin:

- an existing **`F-`/`P-` ID** → reused from current state or the proposed B2B set,
- **New** → net-new for this persona,
- **Onboarding** → part of an apply / verify / welcome flow,
- an **ERP-borrowed tag** → a transferable idea borrowed from Odoo / ERPNext:
  - **New · FEFO** — shelf-life / best-by / freshness,
  - **New · reorder** — restock nudges / auto-replenish,
  - **New · invoicing** — payment terms / statements.

### Status — design maturity → build state

The ledger today records **design maturity** (`Designed` / `Foundation`) — it reflects the Figma
refinement stage, not build progress. **For implementation, relabel `Status` to build state on the
first pass** (`Not started` · `In progress` · `In review` · `Shipped`) and keep it current as work
proceeds. (The proposed/dashboard tables also carry **Priority** — `Core / Phase 1 / Phase 2 / Wedge
/ Later` — and **Dependency** — `UX / Legal-Ops / Both` — to sequence work; preserve those.)

### Phasing constraints (do not lose these)

- **Phase 1 — HomeGrown owns it:** freshness (**FEFO**) and restock **nudges** are built by us now
  (e.g. `BUY-18`, `SELL-14`/`15`, `GROW-16`/`17`).
- **Phase 2 — gated on the POS/ERP connector:** `BUY-19` "**Coverage**" / auto-replenish depends on
  the connector for sell-through + expiry data. It is **not** buildable until that integration lands.
- **Phase 2+ — compliance weight:** produce-department legal/ops features — receiving (`P-016`),
  invoicing / net terms (`P-017`, `BUY-11`), eligibility gating (`P-005`) — are deferred and treated
  as their own track.

### Update rules

- **New feature** → add a row with the **next sequential ID for its prefix**, and fill **every** column.
- **Do NOT renumber existing IDs** — they are referenced across Figma + docs.
- Figma stays the design source of truth; `feature_ledger.md` stays the scope source of truth — keep
  them in sync.

---

## 1. Domain map

The rebuild follows the four orchestration domains from `.claude/CLAUDE.md`. Each section below is
scoped to one domain so `/code-todo` can route work cleanly.

| Domain | Glob | Owns | Legacy source |
|---|---|---|---|
| **Shared** | `packages/shared/**` | zod schemas, enums, inferred types, `AppRouter` type re-export | (new — legacy duplicated types across apps) |
| **Server** | `apps/server/**` | tRPC routers, Drizzle schema/migrations, auth, PostGIS geo, Stripe webhooks | `HomeGrownServerTs/src` |
| **Mobile** | `apps/mobile/**` | **App B (Community)** — Expo screens, navigation, client auth state, Stripe PaymentSheet | `HomeGrownNative/src` |
| **Infra** | `infra/**` | Dockerfile, Cloud Run / Cloud SQL, CI/CD, Secret Manager | `HomeGrownServerTs/Dockerfile.dev`, `docker-compose.yml` |
| **Web** *(post-MVP, M7)* | `apps/web/**` | **App A (Sourcing Desk)** — wholesale-buyer B2B web client | (new — Phase 2+) |

Reminder: `packages/shared` is **sequential head** of every chain — change it first, then fan out.
The **Web** domain doesn't exist yet — it's a forward placeholder; the MVP routes only across
Shared / Server / Mobile / Infra. When App A starts, add the matching boundary + agent to
`.claude/CLAUDE.md`.

---

## 2. Data model (Server domain)

The legacy Prisma model is the starting point. The canonical forward model below **consolidates and
corrects** it. Notable legacy problems we are fixing are called out inline.

### 2.1 Entities

**`users`** — identity.
- `id` (uuid, PK) — *legacy used autoincrement Int; we use uuid (already in M1 scaffold).*
- `email` (text, unique, not null)
- `username` (text, unique, not null) — *legacy had this; M1 scaffold dropped it. Re-add.*
- `stripeCustomerId` (text, nullable) — buyer's Stripe customer; see [§2.2](#22-payment-account-references).
- `createdAt` (timestamptz)
- Auth credentials: see [§4 Auth](#4-auth-server--mobile) — **password hashing is NOT settled**; legacy used bcrypt + hand-rolled JWT.
- Relations: has one `store`, has many `orders` (as buyer). *(A seller's "sales" are just `orders` for their store — there is no separate sales entity; see below.)*

**`stores`** — a seller storefront. **One store per user for the pilot (1:1).** The legacy schema
flip-flopped here — it dropped the Store table, then restored multi-store-per-user in its final
commit. Multi-store taxes everything (store-switcher UI, per-store ownership checks, a Connect
payout account per store) for no pilot benefit, so we collapse to 1:1 now. **Multi-store is a
post-pilot expansion**; keep the `userId` FK so lifting the 1:1 constraint later needs no reshape.
- `id` (uuid, PK)
- `userId` (uuid, FK → users, unique for the pilot)
- `name`, `logo`, `about` (text)
- `stripeConnectAccountId` (text, nullable) — see [§2.2](#22-payment-account-references).
- Relations: has one `location`, has many `listings`, has many `orders`.

> **Seller → grower progression (post-MVP, forward note).** The store *is* the producer account. A
> seller graduating into a grower is **one account gaining a capability**, not a new entity: add a
> `tier`/`capabilities` field (e.g. `seller` → `+grower`) that unlocks the Supply Hub layer (wholesale
> listings, compliance docs, split payouts). The MVP ships the seller path only; designing the FK/
> capability seam now means the grower unlock is additive later, with no reshape. See the
> [progression thesis](#the-seller--grower-progression-core-thesis).

**`locations`** — a store's physical location. **This is the PostGIS table.**
- `id` (uuid, PK)
- `storeId` (uuid, FK → stores, unique — one location per store)
- `address`, `city`, `state` (text), `zip` (text — *legacy used Int; zips have leading zeros, use text*)
- `geog` (`geography(Point, 4326)`) + **GiST index** — *legacy stored raw `longitude`/`latitude` floats and did app-side filtering. We store a single geography point and query with PostGIS. See [§5 Geo](#5-geo-server).*

**`listings`** — produce for sale. **Consolidates the legacy `PostedVegetables` / `PostedFruit` /
`PostedHerbs` triplet into one table** with a category enum. (Legacy had three near-identical tables
with inconsistent types — vegetables priced as Int, fruit as Float.)
- `id` (uuid, PK)
- `storeId` (uuid, FK → stores)
- `name` (text)
- `category` (enum: `vegetable | fruit | herb`) — extensible later (dairy, eggs, baked, …)
- `priceCents` (integer) — *money is integer cents everywhere; never Float. Legacy mixed Int/Float.*
- `quantity` (integer) — available amount
- `unit` (text/enum — e.g. `each | lb | bunch`) — *legacy had no unit; "amount" was ambiguous.*
- `attributes` (jsonb, nullable) — category-specific extras (e.g. herb `dried: boolean`).
- `createdAt`, `updatedAt`

**`orders`** — a buyer's purchase from one store.
- `id` (uuid, PK)
- `buyerId` (uuid, FK → users)
- `storeId` (uuid, FK → stores) — *legacy code inconsistently referenced a non-existent `sellerId`; the store is the seller.*
- `status` (enum: `pending | paid | fulfilled | cancelled`) — driven by Stripe webhooks, not the client. *Legacy used free-text status strings.*
- `totalCents` (integer)
- `channelId` (text, unique, nullable) — chat thread handle. See [§6 Chat](#6-chat-server--mobile).
- `stripePaymentIntentId` (text, nullable) — payment truth lives in Stripe; mirror its id here.
- `createdAt`
- Relations: has many `orderItems`.

**`orderItems`** — line items. **New table.** Legacy serialized line items as an opaque JSON blob on
the order; we normalize so quantities/prices are queryable and auditable.
- `id` (uuid, PK)
- `orderId` (uuid, FK → orders)
- `listingId` (uuid, FK → listings)
- `nameSnapshot` (text), `priceCentsSnapshot` (integer), `quantity` (integer) — snapshot fields freeze the listing state at purchase time.

**No `sales` entity.** Legacy modeled a seller's `Sales` as a separate table mirroring `Orders` —
pure duplication. In the new model an order has exactly one `storeId`, so a "sale" is simply an
order viewed from the seller's side. The seller's sales list is the `orders.listForStore` query
([§3](#3-api-surface-server-domain)) — there is **no `sales` table and no view to build**.

### 2.2 Payment account references

Legacy modeled Braintree vault state as a three-table chain (`PaymentMethods` → `CustomerID` →
`PaymentMethodID`) plus boolean flags for card/cash/crypto/paypal. **Drop all of it.** Stripe owns
payment-method state. We persist only the foreign keys needed to reconcile webhooks:
- **`users.stripeCustomerId`** — the buyer's Stripe customer (created on first checkout).
- **`stores.stripeConnectAccountId`** — the seller's Connect Express account. It lives on the
  **store** (the payable entity that receives payouts), not the user. Under the pilot's 1:1
  store↔user this is equivalent to per-user, but anchoring it on the store keeps the seller model
  coherent if multi-store ever lands.

### 2.3 Legacy → new schema crosswalk

| Legacy (Prisma) | New (Drizzle + PostGIS) | Change |
|---|---|---|
| `User` (Int id) | `users` (uuid id) | uuid; re-add `username` |
| `Store` (1:N from user) | `stores` (1:1 per user for pilot) | **single store for pilot; multi-store post-pilot** |
| `Location.longitude/latitude` (Float) | `locations.geog` (`geography(Point,4326)`) + GiST | **PostGIS, not floats** |
| `PostedVegetables` / `PostedFruit` / `PostedHerbs` | `listings` + `category` enum | **3 tables → 1** |
| `Orders.items` (JSON) + `Orders.total` (Int) | `orders` + `orderItems` | normalize line items; `totalCents` |
| `Sales` (table) | **— (dropped)** | a sale is an order viewed by the seller; no table/view |
| `PaymentMethods`/`CustomerID`/`PaymentMethodID` | `stripeCustomerId` / `stripeConnectAccountId` | **drop the chain** |
| `Orders.channelId` | `orders.channelId` | keep seam |
| free-text `status`, string `date` | status enums, `timestamptz` | typed |

---

## 3. API surface (Server domain)

Legacy split its API confusingly: some operations were Express REST routes (`users.ts`,
`geoJsondata.ts`), others tRPC procedures (`trpcRouter.ts`), and the client used **axios** for auth
while ignoring tRPC. **The rebuild is tRPC-only, organized into sub-routers under
`apps/server/src/routers/`, each contract typed against `packages/shared`.** Current M1 baseline:
only `health.ping` exists.

Routers to build (each becomes one `apps/server/src/routers/*.ts`):

### `auth` — legacy `auth.register` / `auth.login`
- `register({ email, username, password })` → session/token. Hash password (bcrypt-class).
- `login({ usernameOrEmail, password })` → session/token.
- `me()` (protected) → current principal. *(Replaces legacy `GET /auth` token check.)*

### `stores` — legacy storefront CRUD (was implicit)
- `create({ name, logo, about })` (protected) → store. Also kicks off Stripe Connect onboarding (this is where seller payment setup lives — not at signup).
- `getMine()` (protected) → caller's store.
- `get({ storeId })` → public store profile.

### `listings` — legacy `postVegtable` / `postFruit` / `postHerb` / `getVegatables` / …
- `create({ name, category, priceCents, quantity, unit, attributes? })` (protected, store inferred from caller).
- `update({ listingId, … })` (protected, must own store). *(Legacy had `updateVegtable`.)*
- `listByStore({ storeId })` → public.
- `nearby({ lat, lng, radiusKm })` → PostGIS `ST_DWithin`, distance-ordered, ≤50 results. **This is the marketplace browse query** — see [§5](#5-geo-server). Legacy did a city/state string match + app-side filtering; this replaces it.

### `orders` — legacy `postOrder` (was commented-out/incomplete)
- `create({ storeId, items: [{ listingId, quantity }] })` (protected) → creates order + a Stripe PaymentIntent; returns client secret for PaymentSheet. Also provisions the chat `channelId`.
- `listMine()` (protected) → buyer's orders.
- `listForStore()` (protected, caller's store) → seller's incoming orders. **This is the "sales" list — no separate sales table.**
- Status transitions are **webhook-driven**, not mutations the client can call directly.

### `geo` — legacy `geoJsondata.ts` / `getLocalCoordinates`
- `setStoreLocation({ address, city, state, zip })` (protected, caller's store) → geocode (Mapbox or equivalent) → store as PostGIS point. *Legacy hardcoded a Mapbox token in source — geocoding key now comes from env/Secret Manager.*
- `nearby` may live here or under `listings` (decide during planning).

### `payments` — legacy `braintree.*` + `BraintreePaypal`
- `createConnectOnboardingLink()` (protected) → Stripe Connect Express seller onboarding (invoked from store creation, not signup).
- `createPaymentSheet({ orderId })` (protected) → PaymentIntent + ephemeral key + customer for the mobile PaymentSheet (invoked at checkout, not signup).
- **`POST /webhooks/stripe`** (raw HTTP, not tRPC) → the **source of truth** for payment state; verifies signature, updates `orders.status`, records `stripePaymentIntentId`. Buyers' and sellers' payment UIs are built against this, never the reverse.

---

## 4. Auth (Server + Mobile)

**Legacy approach (do not copy):** hand-rolled HS256 JWT, payload `{ id, username }`, 1-hour expiry,
**secret hardcoded in `config.ts` with the weak fallback `superencryptedsecret`**. Passwords hashed
with bcryptjs (10 rounds). Client stored the token in `AsyncStorage` under `accessToken` and **never
restored auth state on app launch** (no startup token check). Login used axios, bypassing tRPC.

**Forward requirements:**
- Server: `createContext` already has the auth seam (`apps/server/src/context.ts`, currently
  `user: null`). Populate it by validating the `Authorization` header.
- Secret/keys come from env → Secret Manager, **never** a source fallback.
- Mobile: persist the token (Expo SecureStore preferred over AsyncStorage for a credential), and
  **restore session on launch** (the bug the legacy app had). Auth state gates navigation
  (pre-auth stack vs. authenticated stack).
- Password hashing: bcrypt-class is fine; pick the library during planning.

**Open decision:** session strategy (raw JWT vs. a managed auth provider). The CLAUDE.md leaves this
"TBD". See [§10](#10-open-decisions).

---

## 5. Geo (Server)

**Legacy approach (do not copy):** `Location.longitude`/`latitude` stored as raw Floats; "nearby"
was computed by querying every user whose `city`/`state` **string** matched and returning full
records for the client to sort — a full table scan, no spatial index, no real radius.

**Forward requirements (a hard rule in CLAUDE.md):**
- Store location as `geography(Point, 4326)` with a **GiST index** on `locations.geog`.
- Proximity via PostGIS `ST_DWithin` (radius) + `ST_Distance` (ordering) — **never app-side haversine**.
- A typed address is required at **store creation** (it's the seller's map pin), **not at signup**.
  A buyer browsing "nearby" supplies their position from **device GPS (`expo-location`)** — no
  address entry needed to shop. Geocoding (address → point) happens server-side in
  `geo.setStoreLocation`, using a geocoder key from env (legacy hardcoded a Mapbox token).
- Canonical query — the marketplace browse:
  `listings.nearby({ lat, lng, radiusKm })` → join listings→stores→locations,
  `ST_DWithin(geog, point, radiusKm*1000)`, order by `ST_Distance`, cap 50.
- **Dependency chain:** the PostGIS migration must land before the shared `nearby` schema, before
  the server procedure, before the mobile browse screen.

---

## 6. Chat (Server + Mobile)

Legacy wired **Stream Chat**: each order got a `channelId` (a `nanoid`) and a channel was created
with buyer + seller, plus an initial order message — but the integration was incomplete (the route
was commented out, and the Stream **API key + secret were committed in `.env.development`**).

**Forward:** keep the seam — `orders.channelId` — but the provider is **TBD** ("managed chat
provider" per CLAUDE.md). Provision the channel when an order is created. Do not commit provider
credentials. Treat this as a later milestone; leave the column and the seam now.

---

## 7. Mobile app (Mobile domain)

**Legacy stack to drop:** bare RN 0.69 with committed `android/`/`ios/` native folders, Braintree
drop-in, `react-query` v3, `tRPC` v10-alpha, `react-icons` (web icons), axios. **Forward:** Expo
managed, Stripe PaymentSheet, modern tRPC + react-query, `@expo/vector-icons`, tRPC client only.

### 7.1 Navigation

Two stacks gated by auth state (legacy pattern, kept):
- **Pre-auth:** `Hero` → (`LogIn` | `SignUp`)
- **Authenticated:** `Home` (+ future tabs: Browse, Orders, Sell, Profile)

M1 scaffold already has `Hero`, `LogIn`, `SignUp`, `Home` screens and the `RootStackParamList`.
Legacy had a real bug: `SignUpScreen` referenced step components it never imported — the rebuild
wires the flow properly.

### 7.2 Screen specs

- **HeroScreen** — branding splash. Title "HomeGrown", tagline "Discover and Grow Your Local Food
  Movement", "Log in" / "Sign Up" buttons. (Already scaffolded in M1.)
- **LogInScreen** — `usernameOrEmail` + `password` → `auth.login`. On success: persist token,
  restore session, route to `Home`. *(Legacy used axios with no validation; rebuild uses tRPC + zod.)*
- **HomeScreen** — legacy was a stub (`<View>HomeScreen</View>`); M1 wires it to `health.ping` to
  prove the typed chain. Real target: marketplace browse (calls `listings.nearby` with device GPS).
- **SignUpScreen** — registration (see below).

### 7.3 Signup flow (slimmed from legacy)

Legacy intent was a three-step machine `AddUser → AddLocation → AddPayment` threaded through a
`SignUpContext`. It was **broken** (AddUser never registered, so later steps had no token; the
payment forms were never defined). Rather than rebuild all three, the rebuild **collapses signup to
what every new user actually needs**, and pushes location/payment to the moment they're required:

1. **AddUser** — `{ email, username, password }` → **calls `auth.register`**, obtains a session.
   This is the whole required signup. *(The fix: legacy advanced without ever registering.)*

Deferred out of signup (this is the efficiency change):
- **Location** is collected at **store creation** (sellers), not signup. Buyers browse via device
  GPS. The old `AddLocation` step is gone as a signup gate.
- **Payment** is never a signup step. Stripe collects details **where they're needed**: buyers via
  **PaymentSheet at checkout**, sellers via **Connect Express onboarding when they create a store**.
  The old `AddPayment` 4-way card/PayPal/cash/crypto picker is dropped entirely (Braintree with it).

If a multi-step flow is reintroduced later (e.g. a guided seller-onboarding wizard), keep the
`SignUpContext` step-machine pattern and add back-navigation between steps (legacy had none).

### 7.4 Client state

- Auth token in **Expo SecureStore**; restore on launch (legacy `AsyncStorage` + no restore = the bug).
- Form state: pick React Hook Form or keep Formik — validate with **zod schemas shared from
  `packages/shared`** so client and server agree.

---

## 8. Infra (Infra domain)

**Legacy:** `Dockerfile.dev`, a `docker-compose.yml`, `wait-for-it.sh`, env files committed to git
(with live secrets). **Forward (M1 baseline already exists):**
- `infra/Dockerfile` — pinned-digest node:22 image, non-root user, `tsx` runtime (compiled build is
  a later milestone), no secrets baked in.
- `infra/cloudrun.service.yaml` — Cloud Run service; `DATABASE_URL` and all keys injected from
  **Secret Manager** at deploy time; placeholders for project/region/service-account.
- Local dev: `docker-compose.yml` brings up Postgres **+ PostGIS**; `.env` is gitignored, with
  `.env.example` as the committed template.
- CI (`.github/workflows/ci.yml`): install (frozen lockfile) → typecheck → lint → test.
- **Dependency chain:** infra deploy config for a route lands only **after** that server route
  passes local typecheck + tests.

---

## 9. Security lessons (non-negotiable)

The legacy repos leaked real, live credentials. **The single most important constraint on this
rebuild is that this never recurs.** What leaked, and where, in the legacy code (values are **not**
reproduced here — recording them would re-leak them; this is the catalogue of mistakes to never
repeat):

| Secret type | Legacy location | Rebuild rule |
|---|---|---|
| Postgres connection string + password | `HomeGrownServerTs/.env.development`, `.env.test` (committed) | `.env` gitignored; `DATABASE_URL` from Secret Manager in deploys |
| Stream Chat API key + secret | `.env.development` **and** `src/config/config.ts` | provider keys from env only; never committed |
| Braintree access token | `src/config/config.ts` (hardcoded fallback) | no Braintree; Stripe keys from Secret Manager |
| JWT signing secret | `src/config/config.ts` (fallback `superencryptedsecret`) | secret from env; **no source fallback** |
| Mapbox token | `src/routes/users.ts` (hardcoded inline) | geocoder key from env |
| Seed/test passwords | `src/prisma/seed.ts` (plaintext, matched DB pw) | generated/seeded from env, never literal |

Operating rules (also in `.claude/CLAUDE.md`): no secrets in git ever; `.env` local + Secret Manager
in deploys; **if you find a credential in code, stop and flag it**; install scripts disabled
(`ignore-scripts=true`); lockfile committed + frozen in CI; 7-day dependency cooldown; new
dependencies go through `dependency-auditor`.

---

## 10. Open decisions

These need a human call before or during the relevant milestone; `/code-todo` should surface them
rather than guess:

1. **Auth strategy** — raw JWT (server-issued, SecureStore on device) vs. a managed auth provider.
   CLAUDE.md says "TBD".
2. **Chat provider** — Stream (legacy) vs. another managed provider. CLAUDE.md says "TBD". Seam
   (`orders.channelId`) stays regardless.
3. **Geocoder** — Mapbox (legacy) vs. Google vs. Nominatim. Affects the `geo.setStoreLocation` key.
4. **Listing categories** — start with `vegetable | fruit | herb` (legacy) or open the enum wider now.
5. **Mobile form library** — React Hook Form vs. keep Formik (zod validation either way).

---

## 11. Milestone sequencing

Follows the dependency chains in `.claude/CLAUDE.md`
(**schema/migration → shared types → server router → mobile screen**). Suggested order:

**MVP = App B (Community app, mobile)** — the neighbor buyer + seller two-sided marketplace. M2–M5
build it. The grower tier and App A (Sourcing Desk web) are explicitly **post-MVP** (M6–M7), gated on
community/supply traction.

- **M1 (done):** monorepo scaffold, `health.ping` typed end-to-end, Docker/Cloud Run baseline, CI.
- **M2 — Identity & store:** users (+username) & single store schema → shared schemas → `auth` +
  `stores` routers → signup `AddUser` step + auth restore. Settle the auth decision.
- **M3 — Geo & listings:** PostGIS `locations` migration + `listings` table → `nearby` shared schema
  → `geo`/`listings` routers (`ST_DWithin`) → store-location entry + Home browse screen (device GPS).
- **M4 — Orders & payments:** `orders`/`orderItems` → Stripe Connect onboarding (at store creation)
  + PaymentIntent → **Stripe webhook handler first**, then PaymentSheet checkout UI.
- **M5 — Chat:** pick provider; provision `channelId` on order create; buyer/seller messaging UI.
  *(Completes the App B MVP.)*

Post-MVP (gated on traction; Phase 2+):

- **M6 — Grower tier (App B unlock):** add the `tier`/`capabilities` seam to the producer account
  ([§2](#2-data-model-server-domain)) → Supply Hub features unlocked on top of the familiar seller
  workflow (forward capacity, compliance docs, split payouts). Same app, additive.
- **M7 — Sourcing Desk (App A web):** new `apps/web` domain for wholesale buyers; the B2B
  produce-department channel (`P-###`) — RFQ/matching, standing orders, receiving, invoicing/net-terms.
  Carries compliance weight; sequence per the proposed-ledger Priority/Dependency columns.

Each milestone: shared-first and sequential, then fan out to the independent Server / Mobile / Infra
(later Web) domains where file boundaries don't overlap.
