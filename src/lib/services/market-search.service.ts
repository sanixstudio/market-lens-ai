import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";
import {
  getRegionsByIds,
  insertUserQuery,
} from "@/lib/repositories/markets.repository";
import { listActiveJobsBySpecialty } from "@/lib/repositories/jobs.repository";
import type { SearchMarketsQuery } from "@/lib/schemas/market";
import type { SearchMarketsResponse } from "@/lib/schemas/market";
import { aggregateJobsToRawMetrics, groupJobsByRegion } from "./market-aggregation.service";
import {
  computeOpportunityScore,
  isHiddenOpportunity,
  payScoreFromPeerMedian,
  topFactorsForMarket,
} from "./market-scoring.service";
import { logStructured } from "./telemetry.service";

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function parseStates(states?: string): string[] | undefined {
  if (!states?.trim()) return undefined;
  return states
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function inBounds(
  lat: number,
  lng: number,
  b: { north: number; south: number; east: number; west: number }
): boolean {
  if (lat > b.north || lat < b.south) return false;
  if (b.west <= b.east) {
    return lng >= b.west && lng <= b.east;
  }
  return lng >= b.west || lng <= b.east;
}

export type RankedMarketsResult = Omit<SearchMarketsResponse, "queryId">;

/**
 * Aggregates and ranks markets without persisting a user query (for explain peers, etc.).
 */
export async function rankMarketsCore(
  db: PostgresJsDatabase<typeof schema>,
  params: SearchMarketsQuery,
  now = new Date()
): Promise<RankedMarketsResult> {
  const stateList = parseStates(params.states);

  const bounds =
    params.north != null &&
    params.south != null &&
    params.east != null &&
    params.west != null
      ? {
          north: params.north,
          south: params.south,
          east: params.east,
          west: params.west,
        }
      : null;

  const allJobs = await listActiveJobsBySpecialty(db, params.specialty);
  const regionIds = [...new Set(allJobs.map((j) => j.regionId))];
  const regions = await getRegionsByIds(db, regionIds);
  const regionMap = new Map(regions.map((r) => [r.id, r]));

  let filtered = allJobs;
  const minPayFloor = params.minPay;
  if (minPayFloor != null) {
    filtered = filtered.filter(
      (j) => j.grossWeeklyPay != null && j.grossWeeklyPay >= minPayFloor
    );
  }
  if (stateList?.length) {
    filtered = filtered.filter((j) => {
      const r = regionMap.get(j.regionId);
      return r?.state && stateList.includes(r.state.toUpperCase());
    });
  }

  const grouped = groupJobsByRegion(filtered);
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

  type Row = {
    regionId: string;
    regionName: string;
    state: string | null;
    centroid: { lat: number; lng: number };
    raw: ReturnType<typeof aggregateJobsToRawMetrics>;
  };

  const prelim: Row[] = [];
  for (const [regionId, regionJobs] of grouped) {
    const raw = aggregateJobsToRawMetrics(
      regionJobs,
      now,
      peerMaxActive,
      peerMaxFresh
    );
    if (!raw) continue;
    if (params.freshnessDays != null && params.freshnessDays <= 7 && raw.freshJobs7d < 1) {
      continue;
    }
    const region = regionMap.get(regionId);
    if (!region) continue;
    if (
      bounds &&
      !inBounds(region.centroidLat, region.centroidLng, bounds)
    ) {
      continue;
    }
    prelim.push({
      regionId,
      regionName: region.regionName,
      state: region.state,
      centroid: { lat: region.centroidLat, lng: region.centroidLng },
      raw,
    });
  }

  const medians = prelim
    .map((p) => p.raw!.medianPay)
    .filter((m): m is number => m != null);
  const peerMedianPay = median(medians);
  const maxMedianPay = Math.max(0, ...medians);

  const markets = prelim.map((p) => {
    const raw = p.raw!;
    const payScore = payScoreFromPeerMedian(raw.medianPay, maxMedianPay || 1);
    const opportunityScore = computeOpportunityScore(
      payScore,
      raw,
      params.competitionPreference
    );
    return {
      regionId: p.regionId,
      regionName: p.regionName,
      state: p.state,
      centroid: p.centroid,
      activeJobs: raw.activeJobs,
      medianPay: raw.medianPay,
      demandScore: raw.demandScore,
      freshnessScore: raw.freshnessScore,
      competitionScore: raw.competitionScore,
      opportunityScore,
      confidenceScore: raw.confidenceScore,
      topFactors: topFactorsForMarket({
        payScore,
        demandScore: raw.demandScore,
        freshnessScore: raw.freshnessScore,
        competitionScore: raw.competitionScore,
        confidenceScore: raw.confidenceScore,
        preference: params.competitionPreference,
      }),
      _payScore: payScore,
      _raw: raw,
    };
  });

  markets.sort((a, b) => b.opportunityScore - a.opportunityScore);

  const hiddenOpportunities = markets
    .filter((m) =>
      isHiddenOpportunity({
        opportunityScore: m.opportunityScore,
        medianPay: m.medianPay,
        peerMedianPay: peerMedianPay || maxMedianPay || 1,
        confidenceScore: m.confidenceScore,
        competitionScore: m.competitionScore,
      })
    )
    .slice(0, 5)
    .map((m) => ({
      regionId: m.regionId,
      regionName: m.regionName,
      state: m.state,
      centroid: m.centroid,
      activeJobs: m.activeJobs,
      medianPay: m.medianPay,
      demandScore: m.demandScore,
      freshnessScore: m.freshnessScore,
      competitionScore: m.competitionScore,
      opportunityScore: m.opportunityScore,
      confidenceScore: m.confidenceScore,
      topFactors: m.topFactors,
      hiddenOpportunity: true,
    }));

  const mainList = markets.map((m) => ({
    regionId: m.regionId,
    regionName: m.regionName,
    state: m.state,
    centroid: m.centroid,
    activeJobs: m.activeJobs,
    medianPay: m.medianPay,
    demandScore: m.demandScore,
    freshnessScore: m.freshnessScore,
    competitionScore: m.competitionScore,
    opportunityScore: m.opportunityScore,
    confidenceScore: m.confidenceScore,
    topFactors: m.topFactors,
  }));

  return {
    markets: mainList,
    hiddenOpportunities,
  };
}

/**
 * Loads jobs, applies filters, aggregates by region, scores deterministically, returns ranked markets.
 */
export async function searchMarkets(
  db: PostgresJsDatabase<typeof schema>,
  params: SearchMarketsQuery,
  queryId: string,
  now = new Date()
): Promise<SearchMarketsResponse> {
  const t0 = performance.now();
  const stateList = parseStates(params.states);

  const bounds =
    params.north != null &&
    params.south != null &&
    params.east != null &&
    params.west != null
      ? {
          north: params.north,
          south: params.south,
          east: params.east,
          west: params.west,
        }
      : null;

  await insertUserQuery(db, {
    id: queryId,
    userId: null,
    specialty: params.specialty,
    minPay: params.minPay ?? null,
    states: stateList ?? null,
    freshnessDays: params.freshnessDays ?? null,
    competitionPreference: params.competitionPreference,
    mapBounds: bounds,
  });

  const ranked = await rankMarketsCore(db, params, now);

  logStructured("info", "markets.search", {
    durationMs: Math.round(performance.now() - t0),
    specialty: params.specialty,
    resultCount: ranked.markets.length,
    queryId,
  });

  return {
    queryId,
    ...ranked,
  };
}
