import { describe, expect, it } from "vitest";
import { buildExploreSearchParams, parseExploreUrl } from "./explore-url";

function paramsFromString(q: string) {
  return new URLSearchParams(q);
}

describe("explore-url", () => {
  it("round-trips defaults", () => {
    const initial = parseExploreUrl(paramsFromString(""));
    expect(initial.filters.specialty).toBe("Software Engineer");
    expect(initial.regionId).toBeNull();
    expect(initial.tab).toBe("markets");

    const again = parseExploreUrl(buildExploreSearchParams(initial));
    expect(again.filters.specialty).toBe(initial.filters.specialty);
    expect(again.regionId).toBe(initial.regionId);
  });

  it("parses region and details tab", () => {
    const s = parseExploreUrl(
      paramsFromString(
        "specialty=Data+%26+ML&minPay=180000&states=TX&region=reg_austin_tx&tab=details"
      )
    );
    expect(s.filters.specialty).toBe("Data & ML");
    expect(s.filters.minPay).toBe("180000");
    expect(s.filters.states).toBe("TX");
    expect(s.regionId).toBe("reg_austin_tx");
    expect(s.tab).toBe("details");
  });

  it("builds minimal URL for balanced competition", () => {
    const p = buildExploreSearchParams({
      filters: {
        specialty: "Software Engineer",
        minPay: "",
        states: "",
        freshnessDays: "",
        competitionPreference: "balanced",
      },
      regionId: null,
      tab: "markets",
    });
    expect(p.toString()).toBe("specialty=Software+Engineer");
  });
});
