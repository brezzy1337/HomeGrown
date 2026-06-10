/**
 * HomeGrown API — tRPC modular monolith.
 *
 * Bootstrap order (see CLAUDE.md dependency chains):
 *   1. DB schema + PostGIS migration (packages/shared exports the types)
 *   2. tRPC routers: auth → listings → geo → payments → reviews → events
 *   3. Stripe Connect webhooks
 *
 * Placeholder entrypoint — replaced in the first server milestone.
 */
console.log("HomeGrown server scaffold — implement appRouter (see CLAUDE.md)");
