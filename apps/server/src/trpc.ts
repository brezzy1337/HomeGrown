/**
 * tRPC initialisation — shared primitives used by all routers.
 *
 * Export `router`, `publicProcedure`, and `createCallerFactory` from here;
 * never re-call `initTRPC` elsewhere.
 */

import { initTRPC } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

/** Compose sub-routers into a parent router. */
export const router = t.router;

/** Procedure with no authentication requirement. */
export const publicProcedure = t.procedure;

/** Factory for building server-side callers (used in tests and SSR). */
export const createCallerFactory = t.createCallerFactory;
