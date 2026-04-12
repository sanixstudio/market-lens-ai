/**
 * Seeds market regions and synthetic tech job rows for local development / demos.
 *
 * Usage: `DATABASE_URL=... npm run db:seed`
 *
 * Volume control (no guessing in code — explicit operator knob):
 * - `SEED_SCALE` — positive integer multiplier on baseline listing counts (default: `6`).
 *   Caps at 40 to avoid accidental huge inserts. Example: `SEED_SCALE=3 npm run db:seed`
 *
 * The script clears jobs/regions and related rows, then inserts deterministic data so
 * rankings, freshness, and pay spreads look realistic enough for UI review.
 */
import { createHash } from "node:crypto";
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding");
}
const databaseUrl: string = connectionString;

/** Max rows per insert batch (avoids oversized parameter lists). */
const INSERT_CHUNK = 300;

function parseSeedScale(): number {
  const raw = process.env.SEED_SCALE?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 6;
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(
      "SEED_SCALE must be a positive integer (e.g. SEED_SCALE=6). Omit for default 6."
    );
  }
  if (n > 40) {
    throw new Error("SEED_SCALE max is 40. Lower it or extend the cap deliberately in seed.ts.");
  }
  return n;
}

function normHash(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

const REGIONS: (typeof schema.marketRegions.$inferInsert)[] = [
  {
    id: "reg_phoenix_az",
    regionType: "metro",
    regionName: "Phoenix, AZ",
    state: "AZ",
    centroidLat: 33.4484,
    centroidLng: -112.074,
    geohash: "9tbq",
  },
  {
    id: "reg_los_angeles_ca",
    regionType: "metro",
    regionName: "Los Angeles, CA",
    state: "CA",
    centroidLat: 34.0522,
    centroidLng: -118.2437,
    geohash: "9q5ctr",
  },
  {
    id: "reg_san_diego_ca",
    regionType: "metro",
    regionName: "San Diego, CA",
    state: "CA",
    centroidLat: 32.7157,
    centroidLng: -117.1611,
    geohash: "9mud",
  },
  {
    id: "reg_denver_co",
    regionType: "metro",
    regionName: "Denver, CO",
    state: "CO",
    centroidLat: 39.7392,
    centroidLng: -104.9903,
    geohash: "9xj5",
  },
  {
    id: "reg_dallas_tx",
    regionType: "metro",
    regionName: "Dallas, TX",
    state: "TX",
    centroidLat: 32.7767,
    centroidLng: -96.797,
    geohash: "9vff",
  },
  {
    id: "reg_seattle_wa",
    regionType: "metro",
    regionName: "Seattle, WA",
    state: "WA",
    centroidLat: 47.6062,
    centroidLng: -122.3321,
    geohash: "c22yz",
  },
  {
    id: "reg_las_vegas_nv",
    regionType: "metro",
    regionName: "Las Vegas, NV",
    state: "NV",
    centroidLat: 36.1699,
    centroidLng: -115.1398,
    geohash: "9qqju",
  },
  {
    id: "reg_remote_us",
    regionType: "remote",
    regionName: "Remote (United States)",
    state: null,
    centroidLat: 39.8283,
    centroidLng: -98.5795,
    geohash: null,
  },
  {
    id: "reg_remote_global",
    regionType: "remote",
    regionName: "Remote (Worldwide)",
    state: null,
    centroidLat: 15,
    centroidLng: 0,
    geohash: null,
  },
];

type JobInsert = typeof schema.jobs.$inferInsert;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const SWE_TITLES = [
  "Staff Software Engineer",
  "Senior Backend Engineer",
  "Senior Full Stack Engineer",
  "Software Engineer II",
  "Principal Engineer",
] as const;

const DATA_TITLES = [
  "Senior Data Engineer",
  "ML Engineer",
  "Staff Analytics Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
] as const;

const DEVOPS_TITLES = [
  "Senior Site Reliability Engineer",
  "Platform Engineer",
  "DevOps Engineer",
  "Kubernetes Engineer",
  "Infrastructure Engineer",
] as const;

const COMPANIES = [
  "Nimbus Labs",
  "Riverstack",
  "Meridian Systems",
  "Cedar Compute",
  "Orbital Data Co",
  "Harbor API",
  "Summit Platforms",
  "Northwind Apps",
  "Brightline Tech",
  "Kestrel Security",
] as const;

function makeJob(input: {
  id: string;
  sourceId: string;
  title: string;
  specialty: string;
  regionId: string;
  city: string | null;
  state: string | null;
  lat: number;
  lng: number;
  pay: number;
  postedDaysAgo: number;
  company: string;
  discipline: string;
}): JobInsert {
  return {
    id: input.id,
    sourceId: input.sourceId,
    listingUrl: null,
    title: input.title,
    specialty: input.specialty,
    discipline: input.discipline,
    facilityName: input.company,
    city: input.city,
    state: input.state,
    lat: input.lat,
    lng: input.lng,
    grossWeeklyPay: input.pay,
    startDate: null,
    postedAt: daysAgo(input.postedDaysAgo),
    isActive: true,
    normalizedHash: normHash([
      input.sourceId,
      input.specialty,
      String(input.pay),
      input.regionId,
    ]),
    dataQualityScore: 0.88,
    regionId: input.regionId,
  };
}

/** Anchor weekly pays (~annual ÷ 52) used to synthesize larger slices per metro. */
const sweWeeklyByRegion: Record<string, number[]> = {
  reg_los_angeles_ca: [4250, 4180, 4100, 4020, 3880],
  reg_san_diego_ca: [3920, 3780, 3650, 3580],
  reg_phoenix_az: [3250, 3180, 3050, 2980, 2920],
  reg_denver_co: [3480, 3380, 3280, 3150],
  reg_dallas_tx: [3180, 3080, 2980, 2920, 2850],
  reg_seattle_wa: [4380, 4300, 4180, 4050],
  reg_las_vegas_nv: [3050, 2950, 2880, 2820],
};

/** Data & ML: baseline weekly pay and template count (scaled by SEED_SCALE). */
const dataMlTemplate: Record<string, { baseWeekly: number; baseCount: number }> = {
  reg_los_angeles_ca: { baseWeekly: 3720, baseCount: 9 },
  reg_seattle_wa: { baseWeekly: 3850, baseCount: 8 },
  reg_san_diego_ca: { baseWeekly: 3500, baseCount: 6 },
  reg_denver_co: { baseWeekly: 3320, baseCount: 7 },
  reg_phoenix_az: { baseWeekly: 3080, baseCount: 8 },
  reg_dallas_tx: { baseWeekly: 3180, baseCount: 7 },
  reg_las_vegas_nv: { baseWeekly: 2920, baseCount: 5 },
};

const devopsTemplate: Record<string, { baseWeekly: number; baseCount: number }> = {
  reg_los_angeles_ca: { baseWeekly: 3650, baseCount: 6 },
  reg_seattle_wa: { baseWeekly: 3950, baseCount: 7 },
  reg_dallas_tx: { baseWeekly: 3250, baseCount: 8 },
  reg_denver_co: { baseWeekly: 3400, baseCount: 6 },
  reg_phoenix_az: { baseWeekly: 3150, baseCount: 5 },
  reg_san_diego_ca: { baseWeekly: 3550, baseCount: 5 },
  reg_las_vegas_nv: { baseWeekly: 3000, baseCount: 4 },
};

function clampWeeklyUsd(n: number): number {
  return Math.max(1800, Math.min(8500, Math.round(n)));
}

/** Deterministic pay jitter from anchor array + slot index. */
function swePayForSlot(pays: number[], slot: number): number {
  const base = pays[slot % pays.length]!;
  const layer = Math.floor(slot / pays.length);
  return clampWeeklyUsd(base + layer * 55 - (slot % 3) * 40);
}

function buildJobs(seedScale: number): JobInsert[] {
  const jobs: JobInsert[] = [];
  let seq = 0;

  const add = (j: Omit<Parameters<typeof makeJob>[0], "id">) => {
    seq += 1;
    jobs.push(
      makeJob({
        ...j,
        id: `job_seed_${seq}`,
      })
    );
  };

  const sweSlotsPerMetro = Math.max(12, 10 * seedScale);

  for (const [regionId, pays] of Object.entries(sweWeeklyByRegion)) {
    const region = REGIONS.find((r) => r.id === regionId)!;
    for (let i = 0; i < sweSlotsPerMetro; i++) {
      add({
        sourceId: `seed:swe:${regionId}:${i}`,
        title: SWE_TITLES[i % SWE_TITLES.length]!,
        specialty: "Software Engineer",
        regionId,
        city: region.regionName.split(",")[0]!,
        state: region.state!,
        lat: region.centroidLat + (i % 7) * 0.018 - 0.05,
        lng: region.centroidLng + (i % 5) * 0.022 - 0.04,
        pay: swePayForSlot(pays, i),
        postedDaysAgo: 1 + (i % 14),
        company: COMPANIES[i % COMPANIES.length]!,
        discipline: "Engineering",
      });
    }
  }

  for (const [regionId, cfg] of Object.entries(dataMlTemplate)) {
    const region = REGIONS.find((r) => r.id === regionId)!;
    const count = Math.max(cfg.baseCount, cfg.baseCount * seedScale);
    for (let i = 0; i < count; i++) {
      add({
        sourceId: `seed:data:${regionId}:${i}`,
        title: DATA_TITLES[i % DATA_TITLES.length]!,
        specialty: "Data & ML",
        regionId,
        city: region.regionName.split(",")[0]!,
        state: region.state!,
        lat: region.centroidLat - (i % 6) * 0.014 + 0.02,
        lng: region.centroidLng + (i % 5) * 0.011,
        pay: clampWeeklyUsd(cfg.baseWeekly + (i % 6) * 95 - (i % 4) * 30),
        postedDaysAgo: 1 + (i % 12),
        company: COMPANIES[(i + 3) % COMPANIES.length]!,
        discipline: "Data",
      });
    }
  }

  for (const [regionId, cfg] of Object.entries(devopsTemplate)) {
    const region = REGIONS.find((r) => r.id === regionId)!;
    const count = Math.max(cfg.baseCount, cfg.baseCount * seedScale);
    for (let i = 0; i < count; i++) {
      add({
        sourceId: `seed:devops:${regionId}:${i}`,
        title: DEVOPS_TITLES[i % DEVOPS_TITLES.length]!,
        specialty: "DevOps / SRE",
        regionId,
        city: region.regionName.split(",")[0]!,
        state: region.state!,
        lat: region.centroidLat + (i % 5) * 0.012,
        lng: region.centroidLng - (i % 6) * 0.013,
        pay: clampWeeklyUsd(cfg.baseWeekly + (i % 4) * 110 - (i % 3) * 50),
        postedDaysAgo: 1 + (i % 11),
        company: COMPANIES[(i + 5) % COMPANIES.length]!,
        discipline: "Platform",
      });
    }
  }

  const remoteUs = REGIONS.find((r) => r.id === "reg_remote_us")!;
  const remoteGlobal = REGIONS.find((r) => r.id === "reg_remote_global")!;
  const remoteSwe = 8 * seedScale;
  const remoteData = 6 * seedScale;
  const remoteDevops = 5 * seedScale;

  for (let i = 0; i < remoteSwe; i++) {
    add({
      sourceId: `seed:swe:reg_remote_us:${i}`,
      title: SWE_TITLES[i % SWE_TITLES.length]!,
      specialty: "Software Engineer",
      regionId: "reg_remote_us",
      city: null,
      state: null,
      lat: remoteUs.centroidLat,
      lng: remoteUs.centroidLng + i * 0.01,
      pay: clampWeeklyUsd(3600 + (i % 8) * 120),
      postedDaysAgo: 1 + (i % 10),
      company: COMPANIES[i % COMPANIES.length]!,
      discipline: "Engineering",
    });
  }
  for (let i = 0; i < remoteData; i++) {
    add({
      sourceId: `seed:data:reg_remote_us:${i}`,
      title: DATA_TITLES[i % DATA_TITLES.length]!,
      specialty: "Data & ML",
      regionId: "reg_remote_us",
      city: null,
      state: null,
      lat: remoteUs.centroidLat - 0.02,
      lng: remoteUs.centroidLng + i * 0.012,
      pay: clampWeeklyUsd(3400 + (i % 7) * 100),
      postedDaysAgo: 2 + (i % 9),
      company: COMPANIES[(i + 2) % COMPANIES.length]!,
      discipline: "Data",
    });
  }
  for (let i = 0; i < remoteDevops; i++) {
    add({
      sourceId: `seed:devops:reg_remote_us:${i}`,
      title: DEVOPS_TITLES[i % DEVOPS_TITLES.length]!,
      specialty: "DevOps / SRE",
      regionId: "reg_remote_us",
      city: null,
      state: null,
      lat: remoteUs.centroidLat + 0.03,
      lng: remoteUs.centroidLng - i * 0.01,
      pay: clampWeeklyUsd(3550 + (i % 6) * 130),
      postedDaysAgo: 1 + (i % 8),
      company: COMPANIES[(i + 4) % COMPANIES.length]!,
      discipline: "Platform",
    });
  }

  const gSwe = Math.max(4, Math.floor(4 * seedScale));
  const gData = Math.max(3, Math.floor(3 * seedScale));
  const gDev = Math.max(3, Math.floor(3 * seedScale));
  for (let i = 0; i < gSwe; i++) {
    add({
      sourceId: `seed:swe:reg_remote_global:${i}`,
      title: SWE_TITLES[(i + 1) % SWE_TITLES.length]!,
      specialty: "Software Engineer",
      regionId: "reg_remote_global",
      city: null,
      state: null,
      lat: remoteGlobal.centroidLat,
      lng: remoteGlobal.centroidLng + i * 0.15,
      pay: clampWeeklyUsd(3200 + (i % 6) * 140),
      postedDaysAgo: 2 + (i % 12),
      company: COMPANIES[(i + 7) % COMPANIES.length]!,
      discipline: "Engineering",
    });
  }
  for (let i = 0; i < gData; i++) {
    add({
      sourceId: `seed:data:reg_remote_global:${i}`,
      title: DATA_TITLES[(i + 2) % DATA_TITLES.length]!,
      specialty: "Data & ML",
      regionId: "reg_remote_global",
      city: null,
      state: null,
      lat: remoteGlobal.centroidLat + 2,
      lng: remoteGlobal.centroidLng + i * 0.2,
      pay: clampWeeklyUsd(3100 + (i % 5) * 90),
      postedDaysAgo: 3 + (i % 10),
      company: COMPANIES[(i + 1) % COMPANIES.length]!,
      discipline: "Data",
    });
  }
  for (let i = 0; i < gDev; i++) {
    add({
      sourceId: `seed:devops:reg_remote_global:${i}`,
      title: DEVOPS_TITLES[(i + 1) % DEVOPS_TITLES.length]!,
      specialty: "DevOps / SRE",
      regionId: "reg_remote_global",
      city: null,
      state: null,
      lat: remoteGlobal.centroidLat - 2,
      lng: remoteGlobal.centroidLng + i * 0.18,
      pay: clampWeeklyUsd(3300 + (i % 5) * 100),
      postedDaysAgo: 1 + (i % 9),
      company: COMPANIES[(i + 6) % COMPANIES.length]!,
      discipline: "Platform",
    });
  }

  return jobs;
}

async function main() {
  const seedScale = parseSeedScale();
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Clearing tables…");
  await db.delete(schema.feedbackEvents);
  await db.delete(schema.aiInsightsCache);
  await db.delete(schema.userQueries);
  await db.delete(schema.marketMetrics);
  await db.delete(schema.jobs);
  await db.delete(schema.marketRegions);

  console.log("Inserting regions…");
  await db.insert(schema.marketRegions).values(REGIONS);

  const jobRows = buildJobs(seedScale);
  console.log(
    `Inserting ${jobRows.length} synthetic job rows (SEED_SCALE=${seedScale}) in chunks of ${INSERT_CHUNK}…`
  );
  for (let i = 0; i < jobRows.length; i += INSERT_CHUNK) {
    const chunk = jobRows.slice(i, i + INSERT_CHUNK);
    await db.insert(schema.jobs).values(chunk);
  }

  await client.end({ timeout: 5 });
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
