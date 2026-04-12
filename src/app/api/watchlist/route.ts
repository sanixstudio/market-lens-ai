import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  addWatchlistItemForClerkUser,
  listWatchlistForClerkUser,
  removeWatchlistItemForClerkUser,
} from "@/lib/repositories/watchlist.repository";
import {
  isRelationUndefined,
  isWatchlistSchemaDrift,
} from "@/lib/postgres-error";
import { watchlistPostSchema } from "@/lib/schemas/watchlist";

export const runtime = "nodejs";

const WATCHLIST_MIGRATE_HINT =
  "Apply the latest migrations from the project root: npm run db:migrate (requires migration 0003_watchlist_clerk_user for Clerk-backed saves).";

function watchlistFailureResponse(error: unknown) {
  if (isRelationUndefined(error)) {
    return NextResponse.json(
      {
        error: `Watchlist table is missing. ${WATCHLIST_MIGRATE_HINT}`,
      },
      { status: 503 }
    );
  }
  if (isWatchlistSchemaDrift(error)) {
    return NextResponse.json(
      {
        error: `Watchlist database schema is out of date (missing clerk_user_id or anon_key is still required). ${WATCHLIST_MIGRATE_HINT}`,
      },
      { status: 503 }
    );
  }
  const message = error instanceof Error ? error.message : "Watchlist failed";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({
        items: [] satisfies { regionId: string; regionName: string; createdAt: string }[],
      });
    }
    const rows = await listWatchlistForClerkUser(db(), userId);
    return NextResponse.json({
      items: rows.map((r) => ({
        regionId: r.regionId,
        regionName: r.regionName,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return watchlistFailureResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to save markets." }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const parsed = watchlistPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    await addWatchlistItemForClerkUser(db(), {
      id: randomUUID(),
      clerkUserId: userId,
      regionId: parsed.data.regionId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return watchlistFailureResponse(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to manage saved markets." }, { status: 401 });
    }
    const regionId = new URL(request.url).searchParams.get("regionId")?.trim();
    if (!regionId) {
      return NextResponse.json({ error: "regionId query required" }, { status: 400 });
    }
    await removeWatchlistItemForClerkUser(db(), userId, regionId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return watchlistFailureResponse(e);
  }
}
