import OpenAI from "openai";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";
import { hashExplainCacheKey } from "@/lib/hash-query";
import { findValidAiCache, upsertAiCache } from "@/lib/repositories/ai-cache.repository";
import { getUserQueryById } from "@/lib/repositories/markets.repository";
import {
  type AIExplanation,
  type ExplainMarketResponse,
  aiExplanationSchema,
} from "@/lib/schemas/ai-insight";
import {
  EXPLAIN_MARKET_PROMPT_VERSION,
  EXPLAIN_MARKET_SYSTEM_PROMPT,
} from "@/lib/prompts/explain-market";
import { searchMarketsQuerySchema, type SearchMarketsQuery } from "@/lib/schemas/market";
import { getMarketDetail } from "./market-detail.service";
import { rankMarketsCore } from "./market-search.service";
import { logStructured } from "./telemetry.service";

const CACHE_TTL_MS = 18 * 60 * 60 * 1000;

function getModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

function rebuildSearchParamsFromUserQuery(
  row: typeof schema.userQueries.$inferSelect
): SearchMarketsQuery {
  return searchMarketsQuerySchema.parse({
    specialty: row.specialty,
    minPay: row.minPay ?? undefined,
    states: row.states?.join(",") ?? undefined,
    freshnessDays: row.freshnessDays ?? undefined,
    competitionPreference:
      (row.competitionPreference as SearchMarketsQuery["competitionPreference"]) ??
      "balanced",
    north: row.mapBounds?.north,
    south: row.mapBounds?.south,
    east: row.mapBounds?.east,
    west: row.mapBounds?.west,
  });
}

/**
 * Deterministic copy when the model is unavailable or output fails validation.
 */
export function templateExplanation(input: {
  regionName: string;
  specialty: string;
  metrics: {
    activeJobs: number;
    medianPay: number | null;
    opportunityScore: number;
    confidenceScore: number;
    competitionScore: number | null;
  };
}): AIExplanation {
  const pay =
    input.metrics.medianPay != null
      ? `median weekly-equivalent comp around $${input.metrics.medianPay} (~$${Math.round(input.metrics.medianPay * 52).toLocaleString("en-US")}/yr)`
      : "limited reported compensation data";
  const comp =
    input.metrics.competitionScore != null
      ? `estimated market saturation proxy ${(input.metrics.competitionScore * 100).toFixed(0)}% relative to peers`
      : "saturation proxy unavailable";
  return {
    summary: `${input.regionName} ranks with opportunity score ${(input.metrics.opportunityScore * 100).toFixed(0)}% for ${input.specialty}, with ${input.metrics.activeJobs} active listings and ${pay}.`,
    strengths: [
      `${input.metrics.activeJobs} open roles in this market for the selected track`,
      input.metrics.medianPay != null
        ? "Enough listings to estimate median compensation band"
        : "Market still visible despite partial salary reporting",
    ],
    tradeoffs: [
      "Role mix and comp bands can shift quickly as new reqs open",
      "Saturation proxy does not measure applicant volume—interpret cautiously",
    ],
    bestFor: [
      "Tech job seekers comparing metros on volume, comp, and activity first",
      "Anyone who validates level, stack, and comp on individual postings",
    ],
    watchouts: [
      input.metrics.confidenceScore < 0.5
        ? "Confidence is limited—sample size or pay completeness is thin"
        : "Short-term posting spikes can change rankings",
    ],
    confidenceNote: `Model fallback summary. Data confidence ~${(input.metrics.confidenceScore * 100).toFixed(0)}%. ${comp}.`,
  };
}

async function buildNearbyComparisons(
  db: PostgresJsDatabase<typeof schema>,
  params: SearchMarketsQuery,
  regionId: string,
  now: Date
): Promise<{ regionName: string; medianPay: number | null; competitionScore: number | null }[]> {
  const ranked = await rankMarketsCore(db, params, now);
  return ranked.markets
    .filter((m) => m.regionId !== regionId)
    .slice(0, 4)
    .map((m) => ({
      regionName: m.regionName,
      medianPay: m.medianPay,
      competitionScore: m.competitionScore,
    }));
}

/**
 * Returns cached or freshly generated structured explanation; never throws to callers.
 */
export async function explainMarket(
  db: PostgresJsDatabase<typeof schema>,
  input: { queryId: string; regionId: string; specialty: string },
  now = new Date()
): Promise<ExplainMarketResponse> {
  const t0 = performance.now();
  const model = getModel();
  const userRow = await getUserQueryById(db, input.queryId);
  const preference =
    (userRow?.competitionPreference as "low" | "balanced" | "high-opportunity") ??
    "balanced";

  const detail = await getMarketDetail(
    db,
    input.regionId,
    input.specialty,
    preference,
    now
  );
  if (!detail) {
    const explanation = templateExplanation({
      regionName: input.regionId,
      specialty: input.specialty,
      metrics: {
        activeJobs: 0,
        medianPay: null,
        opportunityScore: 0,
        confidenceScore: 0,
        competitionScore: null,
      },
    });
    return { cached: false, explanation };
  }

  const searchParams = userRow
    ? rebuildSearchParamsFromUserQuery(userRow)
    : searchMarketsQuerySchema.parse({
        specialty: input.specialty,
        competitionPreference: "balanced",
      });

  const queryHash = userRow ? userRow.id : `adhoc_${input.specialty}`;
  const cacheKey = hashExplainCacheKey({
    specialty: input.specialty,
    minPay: searchParams.minPay,
    states: searchParams.states?.split(",").map((s) => s.trim()).filter(Boolean),
    freshnessDays: searchParams.freshnessDays,
    competitionPreference: searchParams.competitionPreference,
    regionId: input.regionId,
    promptVersion: EXPLAIN_MARKET_PROMPT_VERSION,
    model,
  });

  const cached = await findValidAiCache(db, cacheKey, now);
  if (cached) {
    const parsed = aiExplanationSchema.safeParse(cached.responseJson);
    if (parsed.success) {
      logStructured("info", "markets.explain", {
        queryId: input.queryId,
        regionId: input.regionId,
        cacheHit: true,
        durationMs: Math.round(performance.now() - t0),
        promptVersion: EXPLAIN_MARKET_PROMPT_VERSION,
        model,
        validationOk: true,
        fallback: false,
      });
      return { cached: true, explanation: parsed.data };
    }
  }

  const nearbyComparisons = await buildNearbyComparisons(
    db,
    searchParams,
    input.regionId,
    now
  );

  const payload = {
    regionName: detail.regionName,
    specialty: input.specialty,
    metrics: {
      activeJobs: detail.metrics.activeJobs,
      medianPay: detail.metrics.medianPay,
      freshJobs7d: detail.metrics.freshJobs7d,
      demandScore: detail.metrics.activeJobs > 0
        ? Math.min(1, detail.metrics.freshJobs7d / detail.metrics.activeJobs)
        : 0,
      freshnessScore:
        detail.metrics.activeJobs > 0
          ? Math.min(1, detail.metrics.freshJobs7d / detail.metrics.activeJobs)
          : 0,
      competitionScore: detail.metrics.competitionScore,
      opportunityScore: detail.metrics.opportunityScore,
      confidenceScore: detail.metrics.confidenceScore,
    },
    nearbyComparisons,
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const explanation = templateExplanation({
      regionName: detail.regionName,
      specialty: input.specialty,
      metrics: {
        activeJobs: detail.metrics.activeJobs,
        medianPay: detail.metrics.medianPay,
        opportunityScore: detail.metrics.opportunityScore,
        confidenceScore: detail.metrics.confidenceScore,
        competitionScore: detail.metrics.competitionScore,
      },
    });
    logStructured("warn", "markets.explain", {
      queryId: input.queryId,
      regionId: input.regionId,
      cacheHit: false,
      durationMs: Math.round(performance.now() - t0),
      promptVersion: EXPLAIN_MARKET_PROMPT_VERSION,
      model,
      validationOk: true,
      fallback: true,
      reason: "no_api_key",
    });
    return { cached: false, explanation };
  }

  const openai = new OpenAI({ apiKey });
  let rawJson: unknown;
  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXPLAIN_MARKET_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? "{}";
    rawJson = JSON.parse(text) as unknown;
  } catch (e) {
    logStructured("warn", "markets.explain", {
      queryId: input.queryId,
      regionId: input.regionId,
      cacheHit: false,
      durationMs: Math.round(performance.now() - t0),
      promptVersion: EXPLAIN_MARKET_PROMPT_VERSION,
      model,
      validationOk: false,
      fallback: true,
      error: String(e),
    });
    return {
      cached: false,
      explanation: templateExplanation({
        regionName: detail.regionName,
        specialty: input.specialty,
        metrics: {
          activeJobs: detail.metrics.activeJobs,
          medianPay: detail.metrics.medianPay,
          opportunityScore: detail.metrics.opportunityScore,
          confidenceScore: detail.metrics.confidenceScore,
          competitionScore: detail.metrics.competitionScore,
        },
      }),
    };
  }

  const parsed = aiExplanationSchema.safeParse(rawJson);
  if (!parsed.success) {
    logStructured("warn", "markets.explain", {
      queryId: input.queryId,
      regionId: input.regionId,
      cacheHit: false,
      durationMs: Math.round(performance.now() - t0),
      promptVersion: EXPLAIN_MARKET_PROMPT_VERSION,
      model,
      validationOk: false,
      fallback: true,
      zodError: parsed.error.message,
    });
    return {
      cached: false,
      explanation: templateExplanation({
        regionName: detail.regionName,
        specialty: input.specialty,
        metrics: {
          activeJobs: detail.metrics.activeJobs,
          medianPay: detail.metrics.medianPay,
          opportunityScore: detail.metrics.opportunityScore,
          confidenceScore: detail.metrics.confidenceScore,
          competitionScore: detail.metrics.competitionScore,
        },
      }),
    };
  }

  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);
  await upsertAiCache(db, {
    id: crypto.randomUUID(),
    cacheKey,
    queryHash,
    regionId: input.regionId,
    specialty: input.specialty,
    promptVersion: EXPLAIN_MARKET_PROMPT_VERSION,
    model,
    responseJson: parsed.data,
    createdAt: now,
    expiresAt,
  });

  logStructured("info", "markets.explain", {
    queryId: input.queryId,
    regionId: input.regionId,
    cacheHit: false,
    durationMs: Math.round(performance.now() - t0),
    promptVersion: EXPLAIN_MARKET_PROMPT_VERSION,
    model,
    validationOk: true,
    fallback: false,
  });

  return { cached: false, explanation: parsed.data };
}
