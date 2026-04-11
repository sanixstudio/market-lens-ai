/**
 * Ingests software-dev remote jobs from Remotive's public API into `jobs`.
 *
 * Terms: attribute Remotive and link listings (we store `listing_url`). Do not hit
 * the API more than a few times per day — run via cron, not a tight loop.
 *
 * Usage: `DATABASE_URL=... npm run ingest:remotive`
 *
 * Optional env: `REMOTIVE_CATEGORY` (default `software-dev`), `REMOTIVE_LIMIT` (integer).
 *
 * Requires applied migrations (including `listing_url` on `jobs`): `npm run db:migrate`.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { and, notInArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { fetchRemotiveJobs } from "../src/lib/ingest/remotive-fetch";
import {
  REMOTIVE_SOURCE_PREFIX,
  normalizeRemotiveJob,
} from "../src/lib/ingest/normalize-remotive";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}
const databaseUrl: string = connectionString;

const REMOTE_REGIONS: (typeof schema.marketRegions.$inferInsert)[] = [
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

async function main() {
  const category = process.env.REMOTIVE_CATEGORY ?? "software-dev";
  const limitRaw = process.env.REMOTIVE_LIMIT;
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 200;
  if (Number.isNaN(limit) || limit < 1) {
    throw new Error("REMOTIVE_LIMIT must be a positive integer when set");
  }

  const client = postgres(databaseUrl);

  const listingCol = await client`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'listing_url'
    LIMIT 1
  `;
  if (listingCol.length === 0) {
    await client.end({ timeout: 2 });
    throw new Error(
      "Database is missing column jobs.listing_url. Run `npm run db:migrate`. If migrate fails (exit 1), run `npm run db:repair-jobs` then migrate again."
    );
  }

  const db = drizzle(client, { schema });

  const rawJobs = await fetchRemotiveJobs({ category, limit });
  const normalized = rawJobs.map(normalizeRemotiveJob);
  const activeSourceIds = normalized.map((j) => j.sourceId);

  await db.insert(schema.marketRegions).values(REMOTE_REGIONS).onConflictDoNothing();

  await db.transaction(async (tx) => {
    const deactivateWhere =
      activeSourceIds.length > 0
        ? and(
            sql`${schema.jobs.sourceId} LIKE ${`${REMOTIVE_SOURCE_PREFIX}%`}`,
            notInArray(schema.jobs.sourceId, activeSourceIds)
          )
        : sql`${schema.jobs.sourceId} LIKE ${`${REMOTIVE_SOURCE_PREFIX}%`}`;

    await tx
      .update(schema.jobs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(deactivateWhere);

    const now = new Date();
    for (const row of normalized) {
      await tx
        .insert(schema.jobs)
        .values({
          id: row.id,
          sourceId: row.sourceId,
          listingUrl: row.listingUrl,
          title: row.title,
          specialty: row.specialty,
          discipline: row.discipline,
          facilityName: row.facilityName,
          city: row.city,
          state: row.state,
          lat: row.lat,
          lng: row.lng,
          grossWeeklyPay: row.grossWeeklyPay,
          startDate: null,
          postedAt: row.postedAt,
          isActive: true,
          normalizedHash: row.normalizedHash,
          dataQualityScore: row.dataQualityScore,
          regionId: row.regionId,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.jobs.sourceId,
          set: {
            listingUrl: row.listingUrl,
            title: row.title,
            specialty: row.specialty,
            discipline: row.discipline,
            facilityName: row.facilityName,
            city: row.city,
            state: row.state,
            lat: row.lat,
            lng: row.lng,
            grossWeeklyPay: row.grossWeeklyPay,
            postedAt: row.postedAt,
            isActive: true,
            normalizedHash: row.normalizedHash,
            dataQualityScore: row.dataQualityScore,
            regionId: row.regionId,
            updatedAt: now,
          },
        });
    }
  });

  await client.end({ timeout: 5 });
  console.log(
    JSON.stringify({
      ok: true,
      source: "remotive",
      category,
      fetched: rawJobs.length,
      upserted: normalized.length,
    })
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
