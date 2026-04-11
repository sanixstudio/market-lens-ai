import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

/**
 * Server-only Postgres client. Throws if DATABASE_URL is missing so misconfig fails fast.
 */
export function getDb() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(connectionString, { max: 10 });
  return drizzle(client, { schema });
}

let singleton: ReturnType<typeof drizzle<typeof schema>> | null = null;

/** Reuses a single connection pool per server runtime (Next.js dev / server). */
export function db() {
  if (!singleton) {
    singleton = getDb();
  }
  return singleton;
}

export { schema };
