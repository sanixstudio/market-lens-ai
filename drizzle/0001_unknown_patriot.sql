ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "listing_url" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "jobs_source_id_unique" ON "jobs" USING btree ("source_id");