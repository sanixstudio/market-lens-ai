import { z } from "zod";

/** Structured explanation returned by the model and validated before API response. */
export const aiExplanationSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  tradeoffs: z.array(z.string()),
  bestFor: z.array(z.string()),
  watchouts: z.array(z.string()),
  confidenceNote: z.string(),
});

export type AIExplanation = z.infer<typeof aiExplanationSchema>;

export const explainMarketResponseSchema = z.object({
  cached: z.boolean(),
  explanation: aiExplanationSchema,
});

export type ExplainMarketResponse = z.infer<typeof explainMarketResponseSchema>;

export const compareMarketsResponseSchema = z.object({
  comparison: z.array(
    z.object({
      regionId: z.string(),
      regionName: z.string(),
      activeJobs: z.number(),
      medianPay: z.number().nullable(),
      freshnessScore: z.number(),
      competitionScore: z.number().nullable(),
      opportunityScore: z.number(),
      confidenceScore: z.number(),
    })
  ),
  summary: z.string(),
});

export type CompareMarketsResponse = z.infer<typeof compareMarketsResponseSchema>;
