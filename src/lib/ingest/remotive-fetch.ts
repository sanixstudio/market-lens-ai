import { remotiveApiResponseSchema } from "./remotive.types";

const DEFAULT_BASE = "https://remotive.com/api/remote-jobs";

export type FetchRemotiveOptions = {
  /** Category slug, e.g. `software-dev`. */
  category?: string;
  /** Max rows (API default: all). Keep modest to respect rate limits. */
  limit?: number;
  baseUrl?: string;
};

/**
 * Fetches normalized remote job rows from Remotive's documented JSON API.
 * Remotive asks for at most ~4 requests/day; do not poll in a tight loop.
 */
export async function fetchRemotiveJobs(
  options: FetchRemotiveOptions = {}
): Promise<ReturnType<typeof remotiveApiResponseSchema.parse>["jobs"]> {
  const { category = "software-dev", limit, baseUrl = DEFAULT_BASE } = options;
  const url = new URL(baseUrl);
  if (category) url.searchParams.set("category", category);
  if (limit != null) url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "MarketLens-AI/0.1 (ingest; contact via repo)",
    },
  });

  if (!res.ok) {
    throw new Error(`Remotive API HTTP ${res.status}: ${res.statusText}`);
  }

  const json: unknown = await res.json();
  const parsed = remotiveApiResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Remotive API response shape unexpected: ${parsed.error.message}`);
  }
  return parsed.data.jobs;
}
