/**
 * Drizzle schema — Milestone 1 placeholder.
 *
 * Only the `users` table is defined here. Real schema additions land in
 * Milestone 2, including:
 *   - `locations` table with PostGIS `geography(Point, 4326)` column + GiST index
 *   - `listings` table (linked to users + locations)
 *   - Stripe Connect account references
 *   - Reviews, events, etc.
 *
 * DO NOT add geo/PostGIS columns until the PostGIS migration is scaffolded.
 */

import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
