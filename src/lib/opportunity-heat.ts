/**
 * Opportunity score → heat band for map markers and list styling.
 * Uses an informational blue→cyan ramp (not red/amber “alert” semantics).
 */
export const OPPORTUNITY_HEAT_HIGH_MIN = 0.72;
export const OPPORTUNITY_HEAT_MID_MIN = 0.55;

export type OpportunityHeatBand = "high" | "mid" | "low";

export function opportunityHeatBand(score: number): OpportunityHeatBand {
  if (score >= OPPORTUNITY_HEAT_HIGH_MIN) return "high";
  if (score >= OPPORTUNITY_HEAT_MID_MIN) return "mid";
  return "low";
}

/** CSS module classes defined in `globals.css` (@layer utilities). */
export const heatMarkerClass: Record<OpportunityHeatBand, string> = {
  high: "heat-marker--high",
  mid: "heat-marker--mid",
  low: "heat-marker--low",
};

export const heatPillClass: Record<OpportunityHeatBand, string> = {
  high: "heat-pill--high",
  mid: "heat-pill--mid",
  low: "heat-pill--low",
};
