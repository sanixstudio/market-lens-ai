import { describe, expect, it } from "vitest";
import {
  OPPORTUNITY_HEAT_HIGH_MIN,
  OPPORTUNITY_HEAT_MID_MIN,
  opportunityHeatBand,
} from "./opportunity-heat";

describe("opportunityHeatBand", () => {
  it("classifies thresholds inclusively", () => {
    expect(opportunityHeatBand(OPPORTUNITY_HEAT_HIGH_MIN)).toBe("high");
    expect(opportunityHeatBand(0.99)).toBe("high");
    expect(opportunityHeatBand(OPPORTUNITY_HEAT_MID_MIN)).toBe("mid");
    expect(opportunityHeatBand(0.71)).toBe("mid");
    expect(opportunityHeatBand(0.54)).toBe("low");
    expect(opportunityHeatBand(0)).toBe("low");
  });
});
