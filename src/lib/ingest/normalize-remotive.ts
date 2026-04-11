import { createHash } from "node:crypto";
import type { RemotiveJob } from "./remotive.types";

/** Stable prefix for rows loaded from Remotive (used for sync / deactivation). */
export const REMOTIVE_SOURCE_PREFIX = "remotive:";

export type NormalizedRemotiveJob = {
  id: string;
  sourceId: string;
  listingUrl: string;
  title: string;
  specialty: string;
  discipline: string | null;
  facilityName: string;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  grossWeeklyPay: number | null;
  postedAt: Date | null;
  normalizedHash: string;
  dataQualityScore: number;
  regionId: string;
};

/**
 * Maps Remotive `candidate_required_location` into our market region rows.
 * US-focused remote listings go to `reg_remote_us`; everything else to `reg_remote_global`.
 */
export function resolveRemoteRegionId(location: string | null | undefined): string {
  const raw = location?.trim() ?? "";
  if (!raw) return "reg_remote_global";
  const l = raw.toLowerCase();

  if (
    l.includes("united states") ||
    l.includes("u.s.") ||
    l.includes("usa") ||
    /\bus only\b/.test(l) ||
    /\bus time\b/.test(l) ||
    /\bus timezone\b/.test(l) ||
    /\bamerican\b/.test(l)
  ) {
    return "reg_remote_us";
  }

  if (l.includes("north america") && !l.includes("canada only")) {
    return "reg_remote_us";
  }

  if ((l.includes("canada") && l.includes("us")) || l.includes("canada + us")) {
    return "reg_remote_us";
  }

  if (l === "us" || /^us[\s,]/i.test(raw) || /[\s,]us$/i.test(raw)) {
    return "reg_remote_us";
  }

  return "reg_remote_global";
}

/**
 * Infers app specialty labels from title (aligned with `MarketSearchFilters` ROLE_TRACKS).
 */
export function inferSpecialtyFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (
    /\b(data scientist|machine learning|ml engineer|mle\b|ai engineer|deep learning|nlp\b|llm\b|data engineer|analytics engineer)\b/.test(
      t
    )
  ) {
    return "Data & ML";
  }
  if (
    /\b(devops|sre\b|site reliability|platform engineer|kubernetes|terraform|cloud engineer|infrastructure engineer)\b/.test(
      t
    )
  ) {
    return "DevOps / SRE";
  }
  return "Software Engineer";
}

/**
 * Parses free-text salary strings (usually annual USD on Remotive) into weekly gross pay.
 */
export function parseSalaryToWeeklyUsd(salary: string | null | undefined): number | null {
  if (!salary?.trim()) return null;
  const s = salary.replace(/,/g, " ");
  const values: number[] = [];
  const tokenRe = /(\d+(?:\.\d+)?)\s*([kK])?/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(s)) !== null) {
    let v = parseFloat(m[1]!);
    if (Number.isNaN(v)) continue;
    if (m[2]) v *= 1000;
    if (v > 0 && v < 800) v *= 1000;
    if (v >= 25_000 && v <= 2_000_000) values.push(v);
  }
  if (values.length === 0) return null;
  const annual = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(annual / 52);
}

function normHash(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

function dataQualityScore(input: {
  grossWeeklyPay: number | null;
  postedAt: Date | null;
  hasListingUrl: boolean;
}): number {
  let score = 0.55;
  if (input.grossWeeklyPay != null) score += 0.2;
  if (input.postedAt) score += 0.12;
  if (input.hasListingUrl) score += 0.13;
  return Math.min(0.94, Math.round(score * 100) / 100);
}

/**
 * Converts a validated Remotive API job into a row ready for `jobs` upsert.
 */
export function normalizeRemotiveJob(job: RemotiveJob): NormalizedRemotiveJob {
  const sourceId = `${REMOTIVE_SOURCE_PREFIX}${job.id}`;
  const specialty = inferSpecialtyFromTitle(job.title);
  const grossWeeklyPay = parseSalaryToWeeklyUsd(job.salary ?? undefined);
  let postedAt: Date | null = null;
  if (job.publication_date?.trim()) {
    const d = new Date(job.publication_date);
    postedAt = Number.isNaN(d.getTime()) ? null : d;
  }
  const regionId = resolveRemoteRegionId(job.candidate_required_location);
  const listingUrl = job.url.trim();

  const normalizedHash = normHash([
    sourceId,
    job.title.trim().toLowerCase(),
    job.company_name.trim().toLowerCase(),
    specialty,
    String(grossWeeklyPay ?? ""),
    regionId,
  ]);

  return {
    id: `job_${sourceId.replace(/:/g, "_")}`,
    sourceId,
    listingUrl,
    title: job.title.trim(),
    specialty,
    discipline: job.category?.trim() || null,
    facilityName: job.company_name.trim(),
    city: null,
    state: null,
    lat: null,
    lng: null,
    grossWeeklyPay,
    postedAt,
    normalizedHash,
    dataQualityScore: dataQualityScore({
      grossWeeklyPay,
      postedAt,
      hasListingUrl: listingUrl.length > 0,
    }),
    regionId,
  };
}
