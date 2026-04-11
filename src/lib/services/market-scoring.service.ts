import type { CompetitionPreference } from "@/lib/schemas/market";
import { SCORING_WEIGHTS } from "@/lib/scoring-weights";

export type RawMarketMetrics = {
  activeJobs: number;
  freshJobs7d: number;
  avgPay: number | null;
  medianPay: number | null;
  payP90: number | null;
  payVolatility: number | null;
  /** 0–1 saturation proxy: higher = more listings relative to peer set */
  competitionScore: number | null;
  /** 0–1 */
  demandScore: number;
  /** 0–1 */
  freshnessScore: number;
  /** 0–1 */
  confidenceScore: number;
};

const W = SCORING_WEIGHTS;

/**
 * How well the market aligns with the user's competition preference (0–1).
 */
export function preferenceMatchScore(
  competition: number | null,
  preference: CompetitionPreference
): number {
  if (competition == null || Number.isNaN(competition)) {
    return 0.5;
  }
  const c = Math.min(1, Math.max(0, competition));
  switch (preference) {
    case "low":
      return 1 - c;
    case "high-opportunity":
      return c;
    case "balanced":
    default:
      return 1 - Math.abs(c - 0.5) * 2;
  }
}

/**
 * Computes deterministic opportunity score from normalized sub-scores.
 */
export function computeOpportunityScore(
  payScore: number,
  metrics: RawMarketMetrics,
  preference: CompetitionPreference
): number {
  const pref = preferenceMatchScore(metrics.competitionScore, preference);
  const competitionPenalty =
    metrics.competitionScore == null || Number.isNaN(metrics.competitionScore)
      ? 0.5
      : Math.min(1, Math.max(0, metrics.competitionScore));

  const raw =
    payScore * W.pay +
    metrics.demandScore * W.demand +
    metrics.freshnessScore * W.freshness +
    pref * W.preference +
    metrics.confidenceScore * W.confidence -
    competitionPenalty * W.competitionPenalty;

  return Math.min(1, Math.max(0, raw));
}

/**
 * Normalizes pay vs peer max median (0–1). Uses medianPay when present.
 */
export function payScoreFromPeerMedian(
  medianPay: number | null,
  maxMedianPay: number
): number {
  if (medianPay == null || maxMedianPay <= 0) {
    return 0.35;
  }
  return Math.min(1, medianPay / maxMedianPay);
}

/**
 * Derives human-readable top factors for cards (deterministic).
 */
export function topFactorsForMarket(input: {
  payScore: number;
  demandScore: number;
  freshnessScore: number;
  competitionScore: number | null;
  confidenceScore: number;
  preference: CompetitionPreference;
}): string[] {
  const factors: { label: string; score: number }[] = [
    { label: "Strong pay vs peers", score: input.payScore },
    { label: "Healthy listing volume", score: input.demandScore },
    { label: "Recent posting activity", score: input.freshnessScore },
    { label: "Data confidence", score: input.confidenceScore },
  ];
  if (input.competitionScore != null) {
    if (input.preference === "low" && input.competitionScore < 0.45) {
      factors.push({
        label: "Lower estimated competition vs peers",
        score: 1 - input.competitionScore,
      });
    } else if (input.preference === "high-opportunity" && input.competitionScore > 0.55) {
      factors.push({
        label: "High market activity (saturation proxy)",
        score: input.competitionScore,
      });
    } else {
      factors.push({
        label: "Estimated market saturation",
        score: 1 - Math.abs(input.competitionScore - 0.5) * 2,
      });
    }
  }
  factors.sort((a, b) => b.score - a.score);
  return factors.slice(0, 3).map((f) => f.label);
}

/**
 * Flags “hidden” opportunities: solid opportunity score but median pay below peer median.
 */
export function isHiddenOpportunity(input: {
  opportunityScore: number;
  medianPay: number | null;
  peerMedianPay: number;
  confidenceScore: number;
  competitionScore: number | null;
}): boolean {
  if (input.confidenceScore < 0.45) return false;
  if (input.medianPay == null || input.peerMedianPay <= 0) return false;
  if (input.opportunityScore < 0.55) return false;
  const payRatio = input.medianPay / input.peerMedianPay;
  if (payRatio >= 0.92) return false;
  const comp = input.competitionScore;
  if (comp != null && comp > 0.65) return false;
  return true;
}
