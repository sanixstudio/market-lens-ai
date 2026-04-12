CREATE TABLE IF NOT EXISTS "watchlist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"anon_key" text NOT NULL,
	"region_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_region_id_market_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."market_regions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "watchlist_items_anon_region_unique" ON "watchlist_items" USING btree ("anon_key","region_id");
