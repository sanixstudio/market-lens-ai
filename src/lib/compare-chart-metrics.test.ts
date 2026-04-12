import { describe, expect, it } from "vitest";
import { barPercent, buildCompareChartRows, rowMax } from "./compare-chart-metrics";
import type { CompareMarketsResponse } from "./schemas/ai-insight";

const pair = (
  overrides: Partial<CompareMarketsResponse["comparison"][number]> = {}
): CompareMarketsResponse["comparison"] => [
  {
    regionId: "r1",
    regionName: "Metro A",
    activeJobs: 100,
    medianPay: 3000,
    freshnessScore: 0.4,
    competitionScore: 0.5,
    opportunityScore: 0.7,
    confidenceScore: 0.8,
    ...overrides,
  },
  {
    regionId: "r2",
    regionName: "Metro B",
    activeJobs: 200,
    medianPay: 4000,
    freshnessScore: 0.6,
    competitionScore: 0.3,
    opportunityScore: 0.65,
    confidenceScore: 0.75,
  },
];

describe("barPercent", () => {
  it("returns 0 for null or non-positive max", () => {
    expect(barPercent(5, 0)).toBe(0);
    expect(barPercent(null, 10)).toBe(0);
    expect(barPercent(undefined, 10)).toBe(0);
  });

  it("scales to max within the pair", () => {
    expect(barPercent(100, 200)).toBe(50);
    expect(barPercent(200, 200)).toBe(100);
  });

  it("caps at 100", () => {
    expect(barPercent(150, 100)).toBe(100);
  });
});

describe("buildCompareChartRows", () => {
  it("returns empty for wrong length", () => {
    expect(buildCompareChartRows([])).toEqual([]);
    expect(buildCompareChartRows([pair()[0]!])).toEqual([]);
  });

  it("includes saturation row when either side has competition", () => {
    const rows = buildCompareChartRows(pair());
    expect(rows.some((r) => r.id === "competitionScore")).toBe(true);
  });

  it("omits saturation when both competition scores are null", () => {
    const [left, right] = pair({ competitionScore: null });
    const bothNull: CompareMarketsResponse["comparison"] = [
      { ...left, competitionScore: null },
      { ...right, competitionScore: null },
    ];
    const rows = buildCompareChartRows(bothNull);
    expect(rows.some((r) => r.id === "competitionScore")).toBe(false);
  });
});

describe("rowMax", () => {
  it("uses the larger non-null value", () => {
    const rows = buildCompareChartRows(pair());
    const pay = rows.find((r) => r.id === "medianPay")!;
    expect(rowMax(pay)).toBe(4000);
  });
});
