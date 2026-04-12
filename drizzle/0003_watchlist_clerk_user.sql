ALTER TABLE "watchlist_items" ADD COLUMN IF NOT EXISTS "clerk_user_id" text;
--> statement-breakpoint
ALTER TABLE "watchlist_items" ALTER COLUMN "anon_key" DROP NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS "watchlist_items_anon_region_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "watchlist_items_anon_region_unique" ON "watchlist_items" USING btree ("anon_key","region_id") WHERE "anon_key" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "watchlist_items_clerk_region_unique" ON "watchlist_items" USING btree ("clerk_user_id","region_id") WHERE "clerk_user_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "watchlist_items" DROP CONSTRAINT IF EXISTS "watchlist_items_owner_oneof";
--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_owner_oneof" CHECK (
  ("anon_key" IS NOT NULL AND "clerk_user_id" IS NULL)
  OR
  ("anon_key" IS NULL AND "clerk_user_id" IS NOT NULL)
);
