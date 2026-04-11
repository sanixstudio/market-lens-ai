import { createHash } from "node:crypto";

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
