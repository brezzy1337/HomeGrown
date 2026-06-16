# infra — GCP deployment (Milestone 1)

Target: **Cloud Run** (server container) + **Cloud SQL** Postgres with PostGIS.

---

## Milestone 1 tradeoff: tsx in production

The server runs `tsx src/index.ts` directly (no compiled `dist/`). This means
devDependencies — `tsx` and `esbuild` — must be present in the runtime image,
adding ~60 MB. A compiled/bundled build (tsc or esbuild bundle) that drops all
devDeps is planned for a later milestone. The tradeoff is acceptable for M1:
startup time and image size are not pilot-blockers, and keeping the build simple
reduces first-deploy risk.

---

## Directory layout

```
infra/
  Dockerfile            # server image (build context = repo root)
  README.md             # this file
  cloudrun.service.yaml # Cloud Run service template (no secrets)
```

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| `gcloud` CLI (latest) | auth, build trigger, deploy |
| Docker (local) | optional local smoke-test of the image |
| GCP project with billing enabled | Cloud Run, Artifact Registry, Cloud SQL, Secret Manager |

Authenticate once:

```bash
gcloud auth login
gcloud auth configure-docker <REGION>-docker.pkg.dev
gcloud config set project <PROJECT_ID>
```

Replace `<PROJECT_ID>` and `<REGION>` throughout with your actual values
(e.g. `homegrown-prod`, `us-central1`). These are intentionally left as
placeholders — never commit real project IDs if your repo is public.

---

## 1. Artifact Registry — create the repository (once)

```bash
gcloud artifacts repositories create homegrown \
  --repository-format=docker \
  --location=<REGION> \
  --description="HomeGrown server images"
```

---

## 2. Build and push the image

Build context is the **repo root**. The Dockerfile is referenced via `-f`.

```bash
# From repo root:
IMAGE=<REGION>-docker.pkg.dev/<PROJECT_ID>/homegrown/server

docker build \
  --platform linux/amd64 \
  -f infra/Dockerfile \
  -t "${IMAGE}:$(git rev-parse --short HEAD)" \
  -t "${IMAGE}:latest" \
  .

docker push "${IMAGE}:$(git rev-parse --short HEAD)"
docker push "${IMAGE}:latest"
```

Or trigger Cloud Build (no local Docker required):

```bash
gcloud builds submit \
  --config infra/cloudbuild.yaml \
  --substitutions=_IMAGE="${IMAGE}" \
  .
```

---

## 3. Secret Manager — wire secrets (once per secret)

Secrets are **never** baked into the image or committed to the repo. They live
in Secret Manager and are mounted as env vars by Cloud Run at deploy time.

```bash
# Create the DATABASE_URL secret (value comes from Cloud SQL connection string):
echo -n "postgresql://user:password@/dbname?host=/cloudsql/<PROJECT_ID>:<REGION>:<INSTANCE_ID>" \
  | gcloud secrets create DATABASE_URL --data-file=-

# Grant Cloud Run's service account read access:
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:<PROJECT_NUMBER>-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Add future secrets the same way (`STRIPE_SECRET_KEY`, `JWT_SECRET`, etc.).

---

## 4. Cloud SQL — provision the PostGIS instance (once)

```bash
gcloud sql instances create homegrown-db \
  --database-version=POSTGRES_16 \
  --tier=db-g1-small \
  --region=<REGION> \
  --root-password=<GENERATED_AT_RUNTIME_NOT_COMMITTED>

# Enable PostGIS extension (connect once after instance is up):
gcloud sql connect homegrown-db --user=postgres
# Inside psql:
# CREATE EXTENSION IF NOT EXISTS postgis;
# CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

**PostGIS extension and Cloud SQL permissions.** The Drizzle migration runs
`CREATE EXTENSION IF NOT EXISTS postgis` automatically on first startup. On Cloud
SQL this DDL requires a role that holds `cloudsqlsuperuser` membership (the
default `postgres` user created with the instance has this role). If you connect
as a lesser-privileged application user, grant the extension first as `postgres`
(or any `cloudsqlsuperuser` member) before the migration runs — otherwise the
migration step will fail with `ERROR: must be owner of extension postgis`. In
practice: create the extension once manually via `gcloud sql connect` as shown
above, then the `IF NOT EXISTS` guard makes subsequent migration runs safe under
any role.

The Cloud SQL **instance connection name** follows the pattern:
`<PROJECT_ID>:<REGION>:<INSTANCE_ID>` — used in the connection URL and the
`--add-cloudsql-instances` flag below.

---

## 5. Deploy to Cloud Run

```bash
IMAGE=<REGION>-docker.pkg.dev/<PROJECT_ID>/homegrown/server

gcloud run deploy homegrown-server \
  --image="${IMAGE}:$(git rev-parse --short HEAD)" \
  --region=<REGION> \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest" \
  --add-cloudsql-instances="<PROJECT_ID>:<REGION>:<INSTANCE_ID>" \
  --service-account="<SERVICE_ACCOUNT_EMAIL>"
```

Key flags explained:

- `--port=8080` — Cloud Run injects `PORT=8080`; the server reads it from env
  (no hardcoded port in code or image).
- `--set-secrets` — Secret Manager value injected as an env var at runtime;
  the image never sees the plaintext value at build time.
- `--add-cloudsql-instances` — attaches the Cloud SQL connector sidecar so the
  server can connect via the Unix socket path embedded in `DATABASE_URL`.
- `--allow-unauthenticated` — appropriate for a public API; restrict if needed.

### Declarative alternative

`infra/cloudrun.service.yaml` is a template for `gcloud run services replace`.
Fill in the `<PLACEHOLDER>` values and run:

```bash
gcloud run services replace infra/cloudrun.service.yaml --region=<REGION>
```

---

## 6. Verify the deployment

```bash
URL=$(gcloud run services describe homegrown-server \
        --region=<REGION> --format="value(status.url)")

curl "${URL}/health/ping"
# Expected: {"result":{"data":{"ok":true,...}}}
```

---

## Environment variables reference

| Variable | Source | Notes |
|----------|--------|-------|
| `PORT` | Cloud Run (automatic) | Injected by runtime; defaults to 3001 locally |
| `NODE_ENV` | `--set-env-vars` | Set to `production` in deploy command |
| `DATABASE_URL` | Secret Manager (`--set-secrets`) | Postgres URL with Cloud SQL socket path |

Future secrets (`STRIPE_SECRET_KEY`, etc.) follow the same `--set-secrets` pattern.

---

## Future: compiled build (post-M1)

Replace the `CMD` with a build step that runs `tsc` (or an esbuild bundle) and
copies only the `dist/` output + `node_modules` (production-only install) into
the final stage. This removes tsx and all devDependencies from the image,
reducing size and attack surface.
