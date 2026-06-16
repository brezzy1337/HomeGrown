/**
 * Geo router — store location management.
 *
 * `setStoreLocation` geocodes a structured address via the injected `ctx.geocode`
 * capability and upserts the store's PostGIS geography point. One location per
 * store is enforced via a unique constraint on `store_id`.
 *
 * All geo operations go through PostGIS — never app-side haversine math.
 * No direct imports of env, db, or geocode.ts — everything via context.
 */

import { TRPCError } from "@trpc/server";
import { setStoreLocationInput, location as locationSchema } from "@homegrown/shared";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";
import { stores, locations } from "../db/schema";

export const geoRouter = router({
  /**
   * Geocode an address and upsert the caller's store location.
   * Protected — requires a valid Bearer token.
   * One location per store (upsert on the unique storeId constraint).
   */
  setStoreLocation: protectedProcedure
    .input(setStoreLocationInput)
    .output(locationSchema)
    .mutation(async ({ input, ctx }) => {
      // Resolve the caller's store
      const [store] = await ctx.db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.userId, ctx.user.id))
        .limit(1);

      if (!store) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You do not have a store. Create one first.",
        });
      }

      // Geocode the address via the injected capability
      const coords = await ctx.geocode(input);
      if (!coords) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not locate that address",
        });
      }

      const { lat, lng } = coords;

      // Upsert: insert or update on store_id conflict
      // geog = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      const [upserted] = await ctx.db
        .insert(locations)
        .values({
          storeId: store.id,
          address: input.address,
          city: input.city,
          state: input.state,
          zip: input.zip,
          geog: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`,
        })
        .onConflictDoUpdate({
          target: locations.storeId,
          set: {
            address: input.address,
            city: input.city,
            state: input.state,
            zip: input.zip,
            geog: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`,
            updatedAt: sql`now()`,
          },
        })
        .returning({
          id: locations.id,
          storeId: locations.storeId,
          address: locations.address,
          city: locations.city,
          state: locations.state,
          zip: locations.zip,
        });

      if (!upserted) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save location",
        });
      }

      return {
        id: upserted.id,
        storeId: upserted.storeId,
        address: upserted.address,
        city: upserted.city,
        state: upserted.state,
        zip: upserted.zip,
        lat,
        lng,
      };
    }),
});
