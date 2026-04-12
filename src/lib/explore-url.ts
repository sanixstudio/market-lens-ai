import type { ReadonlyURLSearchParams } from "next/navigation";
import type { CompetitionPreference } from "@/lib/schemas/market";
import { competitionPreferenceSchema } from "@/lib/schemas/market";

const ROLE_TRACKS = ["Software Engineer", "Data & ML", "DevOps / SRE"] as const;

export type ExploreTab = "markets" | "details";

export type ExploreUrlState = {
  filters: {
    specialty: string;
    minPay: string;
    states: string;
    freshnessDays: string;
    competitionPreference: CompetitionPreference;
  };
  regionId: string | null;
  tab: ExploreTab;
};

const DEFAULT_SPECIALTY = "Software Engineer";

function parseCompetition(raw: string | null): CompetitionPreference {
  const p = competitionPreferenceSchema.safeParse(raw ?? undefined);
  return p.success ? p.data : "balanced";
}

/**
 * Hydrate explorer state from URL (shareable deep links).
 */
export function parseExploreUrl(searchParams: ReadonlyURLSearchParams): ExploreUrlState {
  const specialtyRaw = searchParams.get("specialty")?.trim() || "";
  const specialty = ROLE_TRACKS.includes(specialtyRaw as (typeof ROLE_TRACKS)[number])
    ? specialtyRaw
    : specialtyRaw.length > 0
      ? specialtyRaw
      : DEFAULT_SPECIALTY;

  const minPay = searchParams.get("minPay")?.trim() ?? "";
  const states = searchParams.get("states")?.trim() ?? "";
  const freshnessDays = searchParams.get("freshnessDays")?.trim() ?? "";
  const competitionPreference = parseCompetition(searchParams.get("competitionPreference"));

  const regionId = searchParams.get("region")?.trim() || null;
  const tabRaw = searchParams.get("tab")?.toLowerCase();
  const tab: ExploreTab = tabRaw === "details" ? "details" : "markets";

  return {
    filters: {
      specialty,
      minPay,
      states,
      freshnessDays,
      competitionPreference,
    },
    regionId,
    tab,
  };
}

/**
 * Build shareable query string from explorer UI state.
 * Omits empty optional fields. `minPay` is annual USD (matches filter input).
 */
export function buildExploreSearchParams(state: ExploreUrlState): URLSearchParams {
  const p = new URLSearchParams();
  p.set("specialty", state.filters.specialty);
  if (state.filters.minPay.trim()) {
    p.set("minPay", state.filters.minPay.trim());
  }
  if (state.filters.states.trim()) {
    p.set("states", state.filters.states.trim());
  }
  if (state.filters.freshnessDays.trim()) {
    p.set("freshnessDays", state.filters.freshnessDays.trim());
  }
  if (state.filters.competitionPreference !== "balanced") {
    p.set("competitionPreference", state.filters.competitionPreference);
  }
  if (state.regionId) {
    p.set("region", state.regionId);
  }
  if (state.tab === "details") {
    p.set("tab", "details");
  }
  return p;
}
