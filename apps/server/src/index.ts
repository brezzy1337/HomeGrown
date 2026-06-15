/**
 * HomeGrown API — tRPC modular monolith entrypoint.
 *
 * Listens on `env.PORT` (Cloud Run injects PORT; defaults to 3001 locally).
 * This file is the only place that imports `env` and starts the HTTP server —
 * everything else in the router tree is side-effect free.
 */

import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { env } from "./env";
import { appRouter } from "./router";
import { createContext } from "./context";

const server = createHTTPServer({
  router: appRouter,
  createContext,
});

server.listen(env.PORT, () => {
  console.log(`HomeGrown server listening on http://localhost:${env.PORT}`);
});
