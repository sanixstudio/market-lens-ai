import { and, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";
import { isOnConflictTargetMissing } from "@/lib/postgres-error";

type Db = PostgresJsDatabase<typeof schema>;

function isPostgresUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "23505"
  );
}

export async function listWatchlistForAnon(db: Db, anonKey: string) {
  return db
    .select({
      regionId: schema.watchlistItems.regionId,
      regionName: schema.marketRegions.regionName,
      createdAt: schema.watchlistItems.createdAt,
    })
    .from(schema.watchlistItems)
    .innerJoin(
      schema.marketRegions,
      eq(schema.watchlistItems.regionId, schema.marketRegions.id)
    )
    .where(eq(schema.watchlistItems.anonKey, anonKey))
    .orderBy(desc(schema.watchlistItems.createdAt));
}

export async function addWatchlistItem(
  db: Db,
  input: { id: string; anonKey: string; regionId: string }
): Promise<void> {
  try {
    await db
      .insert(schema.watchlistItems)
      .values({
        id: input.id,
        anonKey: input.anonKey,
        regionId: input.regionId,
      })
      .onConflictDoNothing({
        target: [schema.watchlistItems.anonKey, schema.watchlistItems.regionId],
      });
    return;
  } catch (e: unknown) {
    if (!isOnConflictTargetMissing(e)) {
      throw e;
    }
  }

  const [existing] = await db
    .select({ id: schema.watchlistItems.id })
    .from(schema.watchlistItems)
    .where(
      and(
        eq(schema.watchlistItems.anonKey, input.anonKey),
        eq(schema.watchlistItems.regionId, input.regionId)
      )
    )
    .limit(1);

  if (existing) {
    return;
  }

  try {
    await db.insert(schema.watchlistItems).values({
      id: input.id,
      anonKey: input.anonKey,
      regionId: input.regionId,
    });
  } catch (e: unknown) {
    if (isPostgresUniqueViolation(e)) {
      return;
    }
    throw e;
  }
}

export async function removeWatchlistItem(
  db: Db,
  anonKey: string,
  regionId: string
): Promise<void> {
  await db
    .delete(schema.watchlistItems)
    .where(
      and(
        eq(schema.watchlistItems.anonKey, anonKey),
        eq(schema.watchlistItems.regionId, regionId)
      )
    );
}
