import { and, eq, gt } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";

export async function findValidAiCache(
  db: PostgresJsDatabase<typeof schema>,
  cacheKey: string,
  now: Date
) {
  const [row] = await db
    .select()
    .from(schema.aiInsightsCache)
    .where(
      and(
        eq(schema.aiInsightsCache.cacheKey, cacheKey),
        gt(schema.aiInsightsCache.expiresAt, now)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function upsertAiCache(
  db: PostgresJsDatabase<typeof schema>,
  row: typeof schema.aiInsightsCache.$inferInsert
) {
  await db
    .insert(schema.aiInsightsCache)
    .values(row)
    .onConflictDoUpdate({
      target: schema.aiInsightsCache.cacheKey,
      set: {
        responseJson: row.responseJson,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
        queryHash: row.queryHash,
        promptVersion: row.promptVersion,
        model: row.model,
      },
    });
}
