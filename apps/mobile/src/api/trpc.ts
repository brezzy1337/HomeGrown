/**
 * Typed tRPC client for HomeGrown mobile.
 *
 * AppRouter is imported type-only from @homegrown/server — no runtime import.
 * The server package's `exports` maps the `types` condition to src/router.ts.
 *
 * EXPO_PUBLIC_API_URL is set in .env (gitignored). Never put secrets here —
 * only the API base URL, which is not a secret.
 */

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@homegrown/server";

export const trpc = createTRPCReact<AppRouter>();

export const API_URL =
  process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3001";
