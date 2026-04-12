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

/** Saved markets for the signed-in Clerk user. */
export async function listWatchlistForClerkUser(db: Db, clerkUserId: string) {
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
    .where(eq(schema.watchlistItems.clerkUserId, clerkUserId))
    .orderBy(desc(schema.watchlistItems.createdAt));
}

export async function addWatchlistItemForClerkUser(
  db: Db,
  input: { id: string; clerkUserId: string; regionId: string }
): Promise<void> {
  try {
    await db
      .insert(schema.watchlistItems)
      .values({
        id: input.id,
        clerkUserId: input.clerkUserId,
        anonKey: null,
        regionId: input.regionId,
      })
      .onConflictDoNothing({
        target: [schema.watchlistItems.clerkUserId, schema.watchlistItems.regionId],
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
        eq(schema.watchlistItems.clerkUserId, input.clerkUserId),
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
      clerkUserId: input.clerkUserId,
      anonKey: null,
      regionId: input.regionId,
    });
  } catch (e: unknown) {
    if (isPostgresUniqueViolation(e)) {
      return;
    }
    throw e;
  }
}

export async function removeWatchlistItemForClerkUser(
  db: Db,
  clerkUserId: string,
  regionId: string
): Promise<void> {
  await db
    .delete(schema.watchlistItems)
    .where(
      and(
        eq(schema.watchlistItems.clerkUserId, clerkUserId),
        eq(schema.watchlistItems.regionId, regionId)
      )
    );
}
