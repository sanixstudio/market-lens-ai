import { describe, expect, it } from "vitest";
import {
  US_METRO_REGIONS,
  dataMlTemplateForRegion,
  devopsTemplateForRegion,
  hashRegionId,
  payTierForState,
  sweWeeklyAnchorsForRegion,
} from "./us-metro-regions";

describe("US_METRO_REGIONS", () => {
  it("has unique ids and stable metro invariants", () => {
    const ids = US_METRO_REGIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of US_METRO_REGIONS) {
      expect(r.regionType).toBe("metro");
      expect(r.state).toMatch(/^[A-Z]{2}$/);
      expect(r.centroidLat).toBeGreaterThanOrEqual(18);
      expect(r.centroidLat).toBeLessThanOrEqual(72);
      expect(r.centroidLng).toBeGreaterThanOrEqual(-170);
      expect(r.centroidLng).toBeLessThanOrEqual(-64);
    }
  });
});

describe("hashRegionId", () => {
  it("is deterministic", () => {
    expect(hashRegionId("reg_austin_tx")).toBe(hashRegionId("reg_austin_tx"));
    expect(hashRegionId("reg_austin_tx")).not.toBe(hashRegionId("reg_dallas_tx"));
  });
});

describe("payTierForState", () => {
  it("classifies known labor markets", () => {
    expect(payTierForState("CA")).toBe("premium");
    expect(payTierForState("DC")).toBe("strong");
    expect(payTierForState("TX")).toBe("mid");
    expect(payTierForState("WY")).toBe("standard");
    expect(payTierForState(null)).toBe("standard");
  });
});

describe("synthetic pay helpers", () => {
  it("produces clamp-friendly anchors and templates", () => {
    const anchors = sweWeeklyAnchorsForRegion("reg_san_francisco_ca", "CA");
    expect(anchors.length).toBeGreaterThanOrEqual(4);
    expect(Math.min(...anchors)).toBeGreaterThan(2000);
    expect(Math.max(...anchors)).toBeLessThan(9000);

    const d = dataMlTemplateForRegion("reg_memphis_tn", "TN");
    expect(d.baseWeekly).toBeGreaterThan(2000);
    expect(d.baseCount).toBeGreaterThanOrEqual(5);
    expect(d.baseCount).toBeLessThanOrEqual(9);

    const o = devopsTemplateForRegion("reg_seattle_wa", "WA");
    expect(o.baseWeekly).toBeGreaterThan(2000);
    expect(o.baseCount).toBeGreaterThanOrEqual(4);
    expect(o.baseCount).toBeLessThanOrEqual(8);
  });
});
