/**
 * Health router — public, no DB dependency.
 *
 * `ping` is the liveness check used by Cloud Run and the mobile status screen.
 * Output is validated against the shared `healthResponse` contract so any
 * shape drift is caught at the tRPC boundary, not the client.
 */

import { healthResponse } from "@homegrown/shared";
import { publicProcedure, router } from "../trpc";

export const healthRouter = router({
  ping: publicProcedure.output(healthResponse).query(() => {
    return {
      status: "ok" as const,
      service: "homegrown-server",
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }),
});
