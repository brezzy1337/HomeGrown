/**
 * @homegrown/shared — single source of truth for every contract shared between
 * apps/server and apps/mobile. Both apps import zod schemas, inferred types, and
 * enums from this package; they never duplicate a shape locally.
 *
 * Note: `AppRouter` intentionally lives in `apps/server` (where tRPC routers
 * compose). Mobile imports it type-only from there to avoid a circular dependency.
 * This package holds everything else the two apps agree on.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Health-check response
// Returned by the server's health endpoint; rendered by mobile's status screen.
// ---------------------------------------------------------------------------

export const healthResponse = z.object({
  /** Always "ok" — any non-200 HTTP status means the server is not healthy. */
  status: z.literal("ok"),
  /** Human-readable service name, e.g. "homegrown-api". */
  service: z.string(),
  /** Seconds the process has been running; never negative. */
  uptimeSeconds: z.number().nonnegative(),
  /** ISO 8601 timestamp of when this response was generated. */
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponse>;
