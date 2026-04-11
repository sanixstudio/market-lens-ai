import { and, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";

export async function listActiveJobsBySpecialty(
  db: PostgresJsDatabase<typeof schema>,
  specialty: string
) {
  return db
    .select()
    .from(schema.jobs)
    .where(
      and(eq(schema.jobs.specialty, specialty), eq(schema.jobs.isActive, true))
    );
}

export async function listActiveJobsByRegionAndSpecialty(
  db: PostgresJsDatabase<typeof schema>,
  regionId: string,
  specialty: string,
  sampleLimit = 12
) {
  return db
    .select()
    .from(schema.jobs)
    .where(
      and(
        eq(schema.jobs.regionId, regionId),
        eq(schema.jobs.specialty, specialty),
        eq(schema.jobs.isActive, true)
      )
    )
    .orderBy(sql`random()`)
    .limit(sampleLimit);
}

export async function listRegionIdsForSpecialty(
  db: PostgresJsDatabase<typeof schema>,
  specialty: string
): Promise<string[]> {
  const rows = await db
    .selectDistinct({ regionId: schema.jobs.regionId })
    .from(schema.jobs)
    .where(
      and(eq(schema.jobs.specialty, specialty), eq(schema.jobs.isActive, true))
    );
  return rows.map((r) => r.regionId);
}
