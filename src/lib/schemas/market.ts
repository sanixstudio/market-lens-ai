import { z } from "zod";

export const competitionPreferenceSchema = z.enum([
  "low",
  "balanced",
  "high-opportunity",
]);

export type CompetitionPreference = z.infer<typeof competitionPreferenceSchema>;

export const searchMarketsQuerySchema = z.object({
  specialty: z.string().min(1),
  minPay: z.coerce.number().optional(),
  states: z.string().optional(),
  freshnessDays: z.coerce.number().int().min(1).max(90).optional(),
  competitionPreference: competitionPreferenceSchema.optional().default("balanced"),
  north: z.coerce.number().optional(),
  south: z.coerce.number().optional(),
  east: z.coerce.number().optional(),
  west: z.coerce.number().optional(),
});

export type SearchMarketsQuery = z.infer<typeof searchMarketsQuerySchema>;

export const marketSearchItemSchema = z.object({
  regionId: z.string(),
  regionName: z.string(),
  state: z.string().nullable(),
  centroid: z.object({ lat: z.number(), lng: z.number() }),
  activeJobs: z.number(),
  medianPay: z.number().nullable(),
  demandScore: z.number(),
  freshnessScore: z.number(),
  competitionScore: z.number().nullable(),
  opportunityScore: z.number(),
  confidenceScore: z.number(),
  topFactors: z.array(z.string()),
  hiddenOpportunity: z.boolean().optional(),
});

export const searchMarketsResponseSchema = z.object({
  queryId: z.string(),
  markets: z.array(marketSearchItemSchema),
  hiddenOpportunities: z.array(marketSearchItemSchema),
});

export type SearchMarketsResponse = z.infer<typeof searchMarketsResponseSchema>;

export const marketDetailResponseSchema = z.object({
  regionId: z.string(),
  regionName: z.string(),
  specialty: z.string(),
  metrics: z.object({
    activeJobs: z.number(),
    freshJobs7d: z.number(),
    avgPay: z.number().nullable(),
    medianPay: z.number().nullable(),
    payP90: z.number().nullable(),
    competitionScore: z.number().nullable(),
    opportunityScore: z.number(),
    confidenceScore: z.number(),
  }),
  sampleJobs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      facilityName: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      grossWeeklyPay: z.number().nullable(),
      /** Original job board URL when available (e.g. Remotive attribution). */
      listingUrl: z.string().nullable().optional(),
    })
  ),
});

export type MarketDetailResponse = z.infer<typeof marketDetailResponseSchema>;

export const explainMarketRequestSchema = z.object({
  queryId: z.string(),
  regionId: z.string(),
  specialty: z.string(),
});

export const compareMarketsRequestSchema = z.object({
  regionIds: z.tuple([z.string(), z.string()]),
  specialty: z.string(),
  competitionPreference: competitionPreferenceSchema.optional(),
});

export const feedbackEventRequestSchema = z.object({
  queryId: z.string().optional(),
  regionId: z.string().optional(),
  eventType: z.enum([
    "recommendation_clicked",
    "compare_started",
    "ai_helpful",
    "ai_not_helpful",
    "market_saved",
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
