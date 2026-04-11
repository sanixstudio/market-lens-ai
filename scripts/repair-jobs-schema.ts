/**
 * Idempotently adds `jobs.listing_url`, dedupes duplicate `source_id` rows, and creates
 * the unique index on `source_id`. Use when `npm run db:migrate` exits non-zero — often
 * because duplicate `source_id` values prevent `CREATE UNIQUE INDEX` from succeeding.
 *
 * Usage: `npm run db:repair-jobs`
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import postgres from "postgres";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}
const databaseUrl: string = connectionString;

async function main() {
  const sql = postgres(databaseUrl);

  const dupes = await sql`
    SELECT source_id, COUNT(*)::int AS c
    FROM jobs
    GROUP BY source_id
    HAVING COUNT(*) > 1
  `;
  if (dupes.length > 0) {
    console.warn(
      `Removing duplicate job rows for ${dupes.length} source_id value(s) (keeping one row each).`
    );
    await sql`
      DELETE FROM jobs AS a
      USING jobs AS b
      WHERE a.source_id = b.source_id AND a.ctid > b.ctid
    `;
  }

  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS listing_url text`;

  const hasIdx = await sql`
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'jobs_source_id_unique'
    LIMIT 1
  `;
  if (hasIdx.length === 0) {
    await sql`CREATE UNIQUE INDEX jobs_source_id_unique ON jobs USING btree (source_id)`;
  }

  await sql.end({ timeout: 5 });
  console.log(
    JSON.stringify({
      ok: true,
      listingUrlColumn: true,
      uniqueSourceIdIndex: true,
      duplicateGroupsRemoved: dupes.length,
    })
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
