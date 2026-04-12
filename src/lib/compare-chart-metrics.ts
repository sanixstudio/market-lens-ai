/**
 * Helpers for paired market comparison visuals: each metric is scaled to the
 * larger value in the pair so relative strength is obvious.
 */

import { formatScore, formatUsdWeekly } from "@/lib/formatters";
import type { CompareMarketsResponse } from "@/lib/schemas/ai-insight";

export type CompareMetricRow = {
  id: string;
  label: string;
  /** Extra context for tooltips / screen readers */
  description: string;
  values: [number | null, number | null];
  display: [string, string];
};

type ComparisonSlice = CompareMarketsResponse["comparison"][number];

function maxPair(a: number | null, b: number | null): number {
  const nums = [a, b].filter((x): x is number => x != null && !Number.isNaN(x));
  return nums.length ? Math.max(...nums) : 0;
}

/** Width % for the bar fill; 0 when unknown or max is 0. */
export function barPercent(value: number | null | undefined, max: number): number {
  if (value == null || Number.isNaN(value) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/**
 * Builds labeled rows for two regions: pay, volume, scores.
 * @param comparison — API order [baseline, compare-with]
 */
export function buildCompareChartRows(comparison: ComparisonSlice[]): CompareMetricRow[] {
  if (comparison.length !== 2) return [];
  const [left, right] = comparison;

  const rows: CompareMetricRow[] = [
    {
      id: "medianPay",
      label: "Median comp",
      description: "Weekly pay from listings with salary (higher = longer bar).",
      values: [left.medianPay, right.medianPay],
      display: [formatUsdWeekly(left.medianPay), formatUsdWeekly(right.medianPay)],
    },
    {
      id: "activeJobs",
      label: "Open roles",
      description: "Active listings count for this specialty in the region.",
      values: [left.activeJobs, right.activeJobs],
      display: [String(left.activeJobs), String(right.activeJobs)],
    },
    {
      id: "opportunityScore",
      label: "Opportunity",
      description: "Blended score from pay, demand, freshness, and competition preference.",
      values: [left.opportunityScore, right.opportunityScore],
      display: [formatScore(left.opportunityScore), formatScore(right.opportunityScore)],
    },
    {
      id: "confidenceScore",
      label: "Data confidence",
      description: "How reliable the underlying sample is for this market.",
      values: [left.confidenceScore, right.confidenceScore],
      display: [formatScore(left.confidenceScore), formatScore(right.confidenceScore)],
    },
    {
      id: "freshnessScore",
      label: "Posting freshness",
      description: "Share of listings posted in the last 7 days.",
      values: [left.freshnessScore, right.freshnessScore],
      display: [formatScore(left.freshnessScore), formatScore(right.freshnessScore)],
    },
  ];

  if (left.competitionScore != null || right.competitionScore != null) {
    rows.push({
      id: "competitionScore",
      label: "Saturation",
      description:
        "Listing density vs peers; higher means more competition for attention, not strictly better or worse.",
      values: [left.competitionScore, right.competitionScore],
      display: [
        left.competitionScore != null ? formatScore(left.competitionScore) : "—",
        right.competitionScore != null ? formatScore(right.competitionScore) : "—",
      ],
    });
  }

  return rows;
}

/** Max value per row for bar scaling (pairwise). */
export function rowMax(row: CompareMetricRow): number {
  return maxPair(row.values[0], row.values[1]);
}
