import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const marketRegions = pgTable("market_regions", {
  id: text("id").primaryKey(),
  regionType: text("region_type").notNull(),
  regionName: text("region_name").notNull(),
  state: text("state"),
  centroidLat: doublePrecision("centroid_lat").notNull(),
  centroidLng: doublePrecision("centroid_lng").notNull(),
  geohash: text("geohash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Raw job listings after normalization. */
export const jobs = pgTable(
  "jobs",
  {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  /** Original listing URL (e.g. for attribution when using third-party feeds). */
  listingUrl: text("listing_url"),
  title: text("title").notNull(),
  specialty: text("specialty").notNull(),
  discipline: text("discipline"),
  facilityName: text("facility_name"),
  city: text("city"),
  state: text("state"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  grossWeeklyPay: integer("gross_weekly_pay"),
  startDate: text("start_date"),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  normalizedHash: text("normalized_hash").notNull(),
  dataQualityScore: real("data_quality_score").notNull(),
  regionId: text("region_id")
    .notNull()
    .references(() => marketRegions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("jobs_source_id_unique").on(t.sourceId)]
);

export const marketMetrics = pgTable(
  "market_metrics",
  {
    id: text("id").primaryKey(),
    regionId: text("region_id")
      .notNull()
      .references(() => marketRegions.id, { onDelete: "cascade" }),
    specialty: text("specialty").notNull(),
    activeJobs: integer("active_jobs").notNull(),
    freshJobs7d: integer("fresh_jobs_7d").notNull(),
    avgPay: integer("avg_pay"),
    medianPay: integer("median_pay"),
    payP90: integer("pay_p90"),
    payVolatility: real("pay_volatility"),
    competitionScore: real("competition_score"),
    demandScore: real("demand_score"),
    freshnessScore: real("freshness_score"),
    opportunityScore: real("opportunity_score"),
    confidenceScore: real("confidence_score"),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("market_metrics_region_specialty").on(t.regionId, t.specialty)]
);

export const aiInsightsCache = pgTable("ai_insights_cache", {
  id: text("id").primaryKey(),
  cacheKey: text("cache_key").notNull().unique(),
  queryHash: text("query_hash").notNull(),
  regionId: text("region_id").notNull(),
  specialty: text("specialty").notNull(),
  promptVersion: text("prompt_version").notNull(),
  model: text("model").notNull(),
  responseJson: jsonb("response_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const userQueries = pgTable("user_queries", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  specialty: text("specialty").notNull(),
  minPay: integer("min_pay"),
  states: jsonb("states").$type<string[] | null>(),
  freshnessDays: integer("freshness_days"),
  competitionPreference: text("competition_preference"),
  mapBounds: jsonb("map_bounds").$type<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedbackEvents = pgTable("feedback_events", {
  id: text("id").primaryKey(),
  queryId: text("query_id"),
  regionId: text("region_id"),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type JobRow = typeof jobs.$inferSelect;
export type MarketRegionRow = typeof marketRegions.$inferSelect;
export type MarketMetricsRow = typeof marketMetrics.$inferSelect;
