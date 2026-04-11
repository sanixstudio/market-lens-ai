import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";
import { listActiveJobsByRegionAndSpecialty } from "@/lib/repositories/jobs.repository";
import { getRegionById } from "@/lib/repositories/markets.repository";
import type { MarketDetailResponse } from "@/lib/schemas/market";
import { aggregateJobsToRawMetrics, groupJobsByRegion } from "./market-aggregation.service";
import {
  computeOpportunityScore,
  payScoreFromPeerMedian,
} from "./market-scoring.service";
import { listActiveJobsBySpecialty } from "@/lib/repositories/jobs.repository";

/**
 * Builds market detail with metrics from live job rows and sample listings.
 */
export async function getMarketDetail(
  db: PostgresJsDatabase<typeof schema>,
  regionId: string,
  specialty: string,
  preference: "low" | "balanced" | "high-opportunity" = "balanced",
  now = new Date()
): Promise<MarketDetailResponse | null> {
  const region = await getRegionById(db, regionId);
  if (!region) return null;

  const allSpecialtyJobs = await listActiveJobsBySpecialty(db, specialty);
  const grouped = groupJobsByRegion(allSpecialtyJobs);
  const peerMaxActive = Math.max(
    1,
    ...[...grouped.values()].map((list) => list.filter((j) => j.isActive).length)
  );
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const peerMaxFresh = Math.max(
    1,
    ...[...grouped.values()].map(
      (list) =>
        list.filter((j) => j.isActive && j.postedAt && j.postedAt >= sevenDaysAgo)
          .length
    )
  );

  const regionJobs = grouped.get(regionId) ?? [];
  const raw = aggregateJobsToRawMetrics(
    regionJobs,
    now,
    peerMaxActive,
    peerMaxFresh
  );
  if (!raw) {
    return {
      regionId,
      regionName: region.regionName,
      specialty,
      metrics: {
        activeJobs: 0,
        freshJobs7d: 0,
        avgPay: null,
        medianPay: null,
        payP90: null,
        competitionScore: null,
        opportunityScore: 0,
        confidenceScore: 0,
      },
      sampleJobs: [],
    };
  }

  const medians = [...grouped.values()]
    .map((jobs) => aggregateJobsToRawMetrics(jobs, now, peerMaxActive, peerMaxFresh))
    .map((m) => m?.medianPay)
    .filter((m): m is number => m != null);
  const maxMedianPay = Math.max(1, ...medians);

  const payScore = payScoreFromPeerMedian(raw.medianPay, maxMedianPay);
  const opportunityScore = computeOpportunityScore(payScore, raw, preference);

  const samples = await listActiveJobsByRegionAndSpecialty(
    db,
    regionId,
    specialty,
    12
  );

  return {
    regionId,
    regionName: region.regionName,
    specialty,
    metrics: {
      activeJobs: raw.activeJobs,
      freshJobs7d: raw.freshJobs7d,
      avgPay: raw.avgPay,
      medianPay: raw.medianPay,
      payP90: raw.payP90,
      competitionScore: raw.competitionScore,
      opportunityScore,
      confidenceScore: raw.confidenceScore,
    },
    sampleJobs: samples.map((j) => ({
      id: j.id,
      title: j.title,
      facilityName: j.facilityName,
      city: j.city,
      state: j.state,
      grossWeeklyPay: j.grossWeeklyPay,
      listingUrl: j.listingUrl ?? undefined,
    })),
  };
}
