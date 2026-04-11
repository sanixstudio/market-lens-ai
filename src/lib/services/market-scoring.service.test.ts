import { describe, expect, it } from "vitest";
import {
  computeOpportunityScore,
  isHiddenOpportunity,
  payScoreFromPeerMedian,
  preferenceMatchScore,
  topFactorsForMarket,
  type RawMarketMetrics,
} from "./market-scoring.service";

function baseMetrics(over: Partial<RawMarketMetrics> = {}): RawMarketMetrics {
  return {
    activeJobs: 10,
    freshJobs7d: 3,
    avgPay: 2500,
    medianPay: 2500,
    payP90: 2800,
    payVolatility: 0.1,
    competitionScore: 0.4,
    demandScore: 0.7,
    freshnessScore: 0.6,
    confidenceScore: 0.8,
    ...over,
  };
}

describe("preferenceMatchScore", () => {
  it("favors low competition when preference is low", () => {
    expect(preferenceMatchScore(0.2, "low")).toBeGreaterThan(
      preferenceMatchScore(0.8, "low")
    );
  });
  it("returns 0.5 when competition is unknown", () => {
    expect(preferenceMatchScore(null, "balanced")).toBe(0.5);
  });
});

describe("payScoreFromPeerMedian", () => {
  it("caps at 1", () => {
    expect(payScoreFromPeerMedian(3000, 2500)).toBe(1);
  });
  it("uses fallback when pay missing", () => {
    expect(payScoreFromPeerMedian(null, 2500)).toBe(0.35);
  });
});

describe("computeOpportunityScore", () => {
  it("stays within 0..1", () => {
    const m = baseMetrics();
    const s = computeOpportunityScore(0.8, m, "balanced");
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

describe("topFactorsForMarket", () => {
  it("returns three labels", () => {
    const t = topFactorsForMarket({
      payScore: 0.9,
      demandScore: 0.5,
      freshnessScore: 0.4,
      competitionScore: 0.3,
      confidenceScore: 0.7,
      preference: "low",
    });
    expect(t).toHaveLength(3);
  });
});

describe("isHiddenOpportunity", () => {
  it("detects underrated market pattern", () => {
    expect(
      isHiddenOpportunity({
        opportunityScore: 0.72,
        medianPay: 3100,
        peerMedianPay: 3650,
        confidenceScore: 0.75,
        competitionScore: 0.35,
      })
    ).toBe(true);
  });
  it("rejects low confidence", () => {
    expect(
      isHiddenOpportunity({
        opportunityScore: 0.8,
        medianPay: 2900,
        peerMedianPay: 3650,
        confidenceScore: 0.3,
        competitionScore: 0.2,
      })
    ).toBe(false);
  });
});
