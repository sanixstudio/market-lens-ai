CREATE TABLE "ai_insights_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"cache_key" text NOT NULL,
	"query_hash" text NOT NULL,
	"region_id" text NOT NULL,
	"specialty" text NOT NULL,
	"prompt_version" text NOT NULL,
	"model" text NOT NULL,
	"response_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ai_insights_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "feedback_events" (
	"id" text PRIMARY KEY NOT NULL,
	"query_id" text,
	"region_id" text,
	"event_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"title" text NOT NULL,
	"specialty" text NOT NULL,
	"discipline" text,
	"facility_name" text,
	"city" text,
	"state" text,
	"lat" double precision,
	"lng" double precision,
	"gross_weekly_pay" integer,
	"start_date" text,
	"posted_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"normalized_hash" text NOT NULL,
	"data_quality_score" real NOT NULL,
	"region_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"region_id" text NOT NULL,
	"specialty" text NOT NULL,
	"active_jobs" integer NOT NULL,
	"fresh_jobs_7d" integer NOT NULL,
	"avg_pay" integer,
	"median_pay" integer,
	"pay_p90" integer,
	"pay_volatility" real,
	"competition_score" real,
	"demand_score" real,
	"freshness_score" real,
	"opportunity_score" real,
	"confidence_score" real,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_regions" (
	"id" text PRIMARY KEY NOT NULL,
	"region_type" text NOT NULL,
	"region_name" text NOT NULL,
	"state" text,
	"centroid_lat" double precision NOT NULL,
	"centroid_lng" double precision NOT NULL,
	"geohash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_queries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"specialty" text NOT NULL,
	"min_pay" integer,
	"states" jsonb,
	"freshness_days" integer,
	"competition_preference" text,
	"map_bounds" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_region_id_market_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."market_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_metrics" ADD CONSTRAINT "market_metrics_region_id_market_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."market_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "market_metrics_region_specialty" ON "market_metrics" USING btree ("region_id","specialty");