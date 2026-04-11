import { eq, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";

export async function getRegionsByIds(
  db: PostgresJsDatabase<typeof schema>,
  ids: string[]
) {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(schema.marketRegions)
    .where(inArray(schema.marketRegions.id, ids));
}

export async function getRegionById(
  db: PostgresJsDatabase<typeof schema>,
  regionId: string
) {
  const [row] = await db
    .select()
    .from(schema.marketRegions)
    .where(eq(schema.marketRegions.id, regionId))
    .limit(1);
  return row ?? null;
}

export async function insertUserQuery(
  db: PostgresJsDatabase<typeof schema>,
  row: typeof schema.userQueries.$inferInsert
) {
  await db.insert(schema.userQueries).values(row);
}

export async function getUserQueryById(
  db: PostgresJsDatabase<typeof schema>,
  id: string
) {
  const [row] = await db
    .select()
    .from(schema.userQueries)
    .where(eq(schema.userQueries.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertFeedbackEvent(
  db: PostgresJsDatabase<typeof schema>,
  row: typeof schema.feedbackEvents.$inferInsert
) {
  await db.insert(schema.feedbackEvents).values(row);
}
