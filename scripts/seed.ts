/**
 * Seeds market regions and synthetic tech job rows for local development.
 *
 * Usage: `DATABASE_URL=... npm run db:seed`
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

function makeJob(input: {
  id: string;
  sourceId: string;
  title: string;
  specialty: string;
  regionId: string;
  city: string;
  state: string;
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

/** Weekly-equivalent pay (~annual ÷ 52) by metro for Software Engineer listings */
const sweWeeklyByRegion: Record<string, number[]> = {
  reg_los_angeles_ca: [4250, 4180, 4100, 4020, 3880],
  reg_san_diego_ca: [3920, 3780, 3650, 3580],
  reg_phoenix_az: [3250, 3180, 3050, 2980, 2920],
  reg_denver_co: [3480, 3380, 3280, 3150],
  reg_dallas_tx: [3180, 3080, 2980, 2920, 2850],
  reg_seattle_wa: [4380, 4300, 4180, 4050],
  reg_las_vegas_nv: [3050, 2950, 2880, 2820],
};

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
];

function buildJobs(): JobInsert[] {
  const jobs: JobInsert[] = [];
  let n = 0;
  const add = (j: Omit<Parameters<typeof makeJob>[0], "id">) => {
    n += 1;
    jobs.push(
      makeJob({
        ...j,
        id: `job_${n}`,
      })
    );
  };

  for (const [regionId, pays] of Object.entries(sweWeeklyByRegion)) {
    const region = REGIONS.find((r) => r.id === regionId)!;
    pays.forEach((pay, i) => {
      add({
        sourceId: `${regionId}_swe_${i}`,
        title: SWE_TITLES[i % SWE_TITLES.length]!,
        specialty: "Software Engineer",
        regionId,
        city: region.regionName.split(",")[0]!,
        state: region.state!,
        lat: region.centroidLat + i * 0.02,
        lng: region.centroidLng + i * 0.02,
        pay,
        postedDaysAgo: i % 4 === 0 ? 2 : 4 + i,
        company: COMPANIES[i % COMPANIES.length]!,
        discipline: "Engineering",
      });
    });
  }

  const dataMl: Record<string, { baseWeekly: number; count: number }> = {
    reg_los_angeles_ca: { baseWeekly: 3720, count: 9 },
    reg_seattle_wa: { baseWeekly: 3850, count: 8 },
    reg_san_diego_ca: { baseWeekly: 3500, count: 6 },
    reg_denver_co: { baseWeekly: 3320, count: 7 },
    reg_phoenix_az: { baseWeekly: 3080, count: 8 },
    reg_dallas_tx: { baseWeekly: 3180, count: 7 },
    reg_las_vegas_nv: { baseWeekly: 2920, count: 5 },
  };

  for (const [regionId, cfg] of Object.entries(dataMl)) {
    const region = REGIONS.find((r) => r.id === regionId)!;
    for (let i = 0; i < cfg.count; i++) {
      add({
        sourceId: `${regionId}_data_${i}`,
        title: DATA_TITLES[i % DATA_TITLES.length]!,
        specialty: "Data & ML",
        regionId,
        city: region.regionName.split(",")[0]!,
        state: region.state!,
        lat: region.centroidLat - i * 0.014,
        lng: region.centroidLng + i * 0.011,
        pay: cfg.baseWeekly + (i % 4) * 85,
        postedDaysAgo: 1 + (i % 9),
        company: COMPANIES[(i + 3) % COMPANIES.length]!,
        discipline: "Data",
      });
    }
  }

  const devops: Record<string, { baseWeekly: number; count: number }> = {
    reg_los_angeles_ca: { baseWeekly: 3650, count: 6 },
    reg_seattle_wa: { baseWeekly: 3950, count: 7 },
    reg_dallas_tx: { baseWeekly: 3250, count: 8 },
    reg_denver_co: { baseWeekly: 3400, count: 6 },
    reg_phoenix_az: { baseWeekly: 3150, count: 5 },
    reg_san_diego_ca: { baseWeekly: 3550, count: 5 },
    reg_las_vegas_nv: { baseWeekly: 3000, count: 4 },
  };

  for (const [regionId, cfg] of Object.entries(devops)) {
    const region = REGIONS.find((r) => r.id === regionId)!;
    for (let i = 0; i < cfg.count; i++) {
      add({
        sourceId: `${regionId}_devops_${i}`,
        title: DEVOPS_TITLES[i % DEVOPS_TITLES.length]!,
        specialty: "DevOps / SRE",
        regionId,
        city: region.regionName.split(",")[0]!,
        state: region.state!,
        lat: region.centroidLat + i * 0.012,
        lng: region.centroidLng - i * 0.013,
        pay: cfg.baseWeekly + (i % 3) * 120,
        postedDaysAgo: 2 + (i % 8),
        company: COMPANIES[(i + 5) % COMPANIES.length]!,
        discipline: "Platform",
      });
    }
  }

  return jobs;
}

async function main() {
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

  const jobRows = buildJobs();
  console.log(`Inserting ${jobRows.length} tech job rows…`);
  await db.insert(schema.jobs).values(jobRows);

  await client.end({ timeout: 5 });
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
