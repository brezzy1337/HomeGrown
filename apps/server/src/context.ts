/**
 * tRPC request context.
 *
 * Milestone 1: auth slot is stubbed — `user` is always null.
 * Milestone 2: decode the Authorization header (JWT / session token) here and
 * populate `user` with the authenticated principal. The seam is already in
 * place: the header is read but not validated.
 */

import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";

export function createContext({ req }: CreateHTTPContextOptions) {
  // Seam for Milestone 2 auth: the Authorization header is available here.
  // e.g. const token = req.headers.authorization?.replace("Bearer ", "");
  void req; // suppress unused-var lint until auth lands

  return {
    /**
     * Authenticated user principal.
     * Always null in Milestone 1 — real auth lands in Milestone 2.
     */
    user: null as null,
  };
}

export type Context = ReturnType<typeof createContext>;
