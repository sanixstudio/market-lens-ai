import type { JobRow } from "@/lib/db/schema";
import type { RawMarketMetrics } from "@/lib/services/market-scoring.service";

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function p90(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const idx = Math.ceil(s.length * 0.9) - 1;
  return s[Math.max(0, idx)]!;
}

/**
 * Builds raw metrics for one region+specialty from active jobs, then normalizes
 * demand/freshness/competition against peer aggregates for that specialty.
 */
export function aggregateJobsToRawMetrics(
  jobs: JobRow[],
  now: Date,
  peerMaxActive: number,
  peerMaxFresh: number
): RawMarketMetrics | null {
  const active = jobs.filter((j) => j.isActive);
  if (active.length === 0) return null;

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fresh = active.filter((j) => j.postedAt && j.postedAt >= sevenDaysAgo);

  const pays = active
    .map((j) => j.grossWeeklyPay)
    .filter((p): p is number => p != null && p > 0);

  const med = median(pays);
  const avg = mean(pays);
  const p9 = p90(pays);
  let payVolatility: number | null = null;
  if (pays.length >= 2 && avg && avg > 0) {
    const variance =
      pays.reduce((acc, x) => acc + (x - avg) ** 2, 0) / pays.length;
    payVolatility = Math.min(1, Math.sqrt(variance) / avg);
  }

  const maxA = Math.max(1, peerMaxActive);
  const maxF = Math.max(1, peerMaxFresh);
  const demandScore = Math.min(1, active.length / maxA);
  const freshnessScore =
    active.length > 0 ? Math.min(1, fresh.length / Math.max(1, maxF * 0.5)) : 0;

  /** Saturation proxy: share of specialty listings in this region vs hottest region */
  const competitionScore = Math.min(1, active.length / maxA);

  const payCompleteness = pays.length / active.length;
  const geoCompleteness =
    active.filter((j) => j.lat != null && j.lng != null).length / active.length;
  const sampleBoost = Math.min(1, active.length / 15);
  const confidenceScore = Math.min(
    1,
    0.25 + sampleBoost * 0.45 + payCompleteness * 0.2 + geoCompleteness * 0.1
  );

  return {
    activeJobs: active.length,
    freshJobs7d: fresh.length,
    avgPay: avg != null ? Math.round(avg) : null,
    medianPay: med != null ? Math.round(med) : null,
    payP90: p9 != null ? Math.round(p9) : null,
    payVolatility,
    competitionScore,
    demandScore,
    freshnessScore,
    confidenceScore,
  };
}

/**
 * Groups jobs by region for a single specialty.
 */
export function groupJobsByRegion(jobs: JobRow[]): Map<string, JobRow[]> {
  const m = new Map<string, JobRow[]>();
  for (const j of jobs) {
    const list = m.get(j.regionId) ?? [];
    list.push(j);
    m.set(j.regionId, list);
  }
  return m;
}
