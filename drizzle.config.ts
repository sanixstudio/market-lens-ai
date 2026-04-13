/**
 * Migrations: `npm run db:migrate` replays SQL from ./drizzle in order. If the DB
 * already has those tables but `drizzle.__drizzle_migrations` is empty/out of sync
 * (e.g. schema was created with `db:push`), migrate can fail with “already exists”.
 * Then use `npm run db:push` to align the live schema with schema.ts (adds watchlist, etc.).
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const drizzleConfig = {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
};

export default drizzleConfig;
