/**
 * drizzle-kit configuration.
 *
 * Reads DATABASE_URL directly from process.env (NOT the strict `env` module)
 * so `db:generate` works offline without a real DB — drizzle-kit only needs
 * to read the schema file for migration generation.
 */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env["DATABASE_URL"] ?? "",
  },
});
