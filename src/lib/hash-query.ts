import { createHash } from "node:crypto";
import type { SearchMarketsQuery } from "@/lib/schemas/market";

/**
 * Stable hash for AI cache keys from search parameters + region + prompt version.
 */
export function hashExplainCacheKey(input: {
  specialty: string;
  minPay?: number;
  states?: string[];
  freshnessDays?: number;
  competitionPreference: string;
  regionId: string;
  promptVersion: string;
  model: string;
}): string {
  const payload = JSON.stringify(input);
  return createHash("sha256").update(payload).digest("hex");
}

export function hashQueryParams(q: SearchMarketsQuery): string {
  const payload = JSON.stringify({
    specialty: q.specialty,
    minPay: q.minPay,
    states: q.states,
    freshnessDays: q.freshnessDays,
    competitionPreference: q.competitionPreference,
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 24);
}
