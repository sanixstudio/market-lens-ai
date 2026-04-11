import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";
import type { CompareMarketsResponse } from "@/lib/schemas/ai-insight";
import { getMarketDetail } from "./market-detail.service";

/**
 * Side-by-side comparison for two regions; summary is template-based (deterministic).
 */
export async function compareMarkets(
  db: PostgresJsDatabase<typeof schema>,
  regionIds: [string, string],
  specialty: string,
  preference: "low" | "balanced" | "high-opportunity" = "balanced"
): Promise<CompareMarketsResponse> {
  const [a, b] = await Promise.all([
    getMarketDetail(db, regionIds[0], specialty, preference),
    getMarketDetail(db, regionIds[1], specialty, preference),
  ]);

  const comparison = [a, b].map((d, i) => {
    if (!d) {
      return {
        regionId: regionIds[i]!,
        regionName: "Unknown",
        activeJobs: 0,
        medianPay: null as number | null,
        freshnessScore: 0,
        competitionScore: null as number | null,
        opportunityScore: 0,
        confidenceScore: 0,
      };
    }
    return {
      regionId: d.regionId,
      regionName: d.regionName,
      activeJobs: d.metrics.activeJobs,
      medianPay: d.metrics.medianPay,
      freshnessScore:
        d.metrics.activeJobs > 0
          ? Math.min(1, d.metrics.freshJobs7d / d.metrics.activeJobs)
          : 0,
      competitionScore: d.metrics.competitionScore,
      opportunityScore: d.metrics.opportunityScore,
      confidenceScore: d.metrics.confidenceScore,
    };
  });

  const [left, right] = comparison;
  const payLead =
    left.medianPay != null && right.medianPay != null
      ? left.medianPay > right.medianPay
        ? left.regionName
        : right.medianPay > left.medianPay
          ? right.regionName
          : "Roughly tied"
      : "Insufficient pay data";
  const volLead =
    left.opportunityScore > right.opportunityScore
      ? left.regionName
      : right.opportunityScore > left.opportunityScore
        ? right.regionName
        : "Roughly tied";

  const summary = `${volLead} leads on overall opportunity score for ${specialty}. ${payLead} shows stronger median compensation (weekly equivalent, salary ÷ 52) among listings with reported pay. Saturation proxy and posting freshness differ—see metrics for tradeoffs.`;

  return { comparison, summary };
}
