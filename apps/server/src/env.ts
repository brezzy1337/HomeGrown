/**
 * Environment validation — fails fast on missing or invalid vars.
 *
 * IMPORTANT: Only `src/index.ts` and `src/db/index.ts` should import this
 * module. Importing the router (e.g. in tests) must NOT trigger env
 * validation or a DB connection — keep this module out of the router tree.
 */

import { z } from "zod";

const envSchema = z.object({
  /** Cloud Run injects PORT; defaults to 3001 locally. */
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  /** Postgres connection URL — required at runtime. */
  DATABASE_URL: z.string().url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌  Invalid environment variables:\n");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
