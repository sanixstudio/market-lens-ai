/**
 * Configurable weights for deterministic opportunity scoring (interview-friendly).
 * opportunityScore =
 *   payScore * W.pay +
 *   demandScore * W.demand +
 *   freshnessScore * W.freshness +
 *   preferenceMatchScore * W.preference +
 *   confidenceScore * W.confidence -
 *   competitionPenalty * W.competitionPenalty
 */
export const SCORING_WEIGHTS = {
  pay: 0.35,
  demand: 0.25,
  freshness: 0.2,
  preference: 0.1,
  confidence: 0.1,
  competitionPenalty: 0.2,
} as const;

export type ScoringWeights = typeof SCORING_WEIGHTS;
