# Cloud Run Job + Cloud Scheduler — reconciliation poller
#
# What it does
# ────────────
# Resyncs seller onboarding flags from the Stripe API and reconciles stale
# payments. This is the P0 marketplace unblock: transactions can complete only
# after seller Stripe Connect onboarding is confirmed as current.
#
# Cadence: every 15 minutes, driven by Cloud Scheduler.
#
# Image & command
# ───────────────
# Same server image as the always-on Cloud Run Service. The Job overrides the
# container command to `node /app/reconcile.mjs` (built by `build:reconcile`
# in apps/server/package.json; copied into the image by infra/Dockerfile).
#
# Secrets & Cloud SQL
# ───────────────────
# reconcile.main.ts imports ../env which validates the FULL env schema at boot.
# All six runtime secrets are injected from Secret Manager (same set as the
# service) and the Cloud SQL instance is attached so the unix-socket
# DATABASE_URL resolves inside the job container.
# No secret value ever appears in this file — only Secret Manager resource IDs.

locals {
  # Shared image reference (mirrors cloudrun.service.yaml template pattern).
  server_image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.ar_repo}/server:latest"

  # Cloud SQL connection name used for unix-socket DATABASE_URL.
  cloudsql_connection_name = "${var.project_id}:${var.region}:${var.cloudsql_instance}"

  # The six runtime secrets the job needs (same as the service; MIGRATE_DATABASE_URL
  # is CI-only and must NOT be injected into runtime containers).
  reconcile_secrets = [
    "DATABASE_URL",
    "JWT_SECRET",
    "GOOGLE_GEOCODING_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_WEBHOOK_SECRET_CONNECT",
  ]
}

# ── Scheduler invoker service account ────────────────────────────────────────
# Dedicated least-privilege SA used exclusively by Cloud Scheduler to trigger
# the job via the Cloud Run Admin API. It receives run.invoker on the job only.

resource "google_service_account" "reconcile_scheduler" {
  project      = var.project_id
  account_id   = "homegrown-reconcile-sched"
  display_name = "HomeGrown reconcile scheduler invoker SA"

  depends_on = [google_project_service.apis]
}

# ── Cloud Run Job ─────────────────────────────────────────────────────────────

resource "google_cloud_run_v2_job" "reconcile" {
  project  = var.project_id
  name     = "homegrown-reconcile"
  location = var.region

  template {
    # Cloud Scheduler triggers one execution at a time; parallelism = 1 and
    # max_retries = 1 guard against duplicate runs or infinite retry loops.
    parallelism = 1
    task_count  = 1

    # Cloud SQL sidecar — required for the unix-socket DATABASE_URL to resolve.
    # The annotation must sit on the outer template block (not template.template).
    annotations = {
      "run.googleapis.com/cloudsql-instances" = local.cloudsql_connection_name
    }

    template {
      # Reuse the runtime SA — it already has secretAccessor on all six runtime
      # secrets (google_secret_manager_secret_iam_member.runtime_secret_accessor
      # in iam.tf).
      service_account = google_service_account.runtime.email

      # Maximum wall-clock time for a single task execution.
      timeout = "600s"

      max_retries = 1

      containers {
        image   = local.server_image
        command = ["node", "/app/reconcile.mjs"]

        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }

        # ── Static env ─────────────────────────────────────────────────────
        env {
          name  = "NODE_ENV"
          value = "production"
        }

        # ── Secret-backed env vars (all six runtime secrets) ───────────────
        # Values are never inlined — each references a Secret Manager secret by
        # resource ID and asks for the "latest" enabled version.

        dynamic "env" {
          for_each = local.reconcile_secrets
          content {
            name = env.value
            value_source {
              secret_key_ref {
                secret  = google_secret_manager_secret.secrets[env.value].secret_id
                version = "latest"
              }
            }
          }
        }
      }
    }
  }

  depends_on = [google_project_service.apis]
}

# ── IAM: scheduler invoker SA → job ──────────────────────────────────────────
# Grants the scheduler SA permission to trigger (execute) the job via the
# Cloud Run Admin API. Scoped to the job resource — not project-wide.

resource "google_cloud_run_v2_job_iam_member" "scheduler_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_job.reconcile.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.reconcile_scheduler.email}"
}

# ── Cloud Scheduler job ───────────────────────────────────────────────────────
# Triggers the Cloud Run Job every 15 minutes by calling the Cloud Run Admin API
# run endpoint with an OAuth token signed by the scheduler invoker SA.

resource "google_cloud_scheduler_job" "reconcile" {
  project  = var.project_id
  region   = var.region
  name     = "homegrown-reconcile"
  schedule = "*/15 * * * *"

  # UTC keeps the schedule behaviour predictable across DST transitions and
  # avoids any ambiguity about the pilot region's local time.
  time_zone = "Etc/UTC"

  http_target {
    # Cloud Run Admin API v2 run endpoint — triggers one job execution.
    uri         = "https://run.googleapis.com/v2/${google_cloud_run_v2_job.reconcile.id}:run"
    http_method = "POST"

    oauth_token {
      service_account_email = google_service_account.reconcile_scheduler.email
      # Default audience is the URI itself, which is correct for Cloud Run Admin API.
    }
  }

  depends_on = [
    google_project_service.apis,
    google_cloud_run_v2_job.reconcile,
    google_cloud_run_v2_job_iam_member.scheduler_invoker,
  ]
}
