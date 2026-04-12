import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ANON_HEADER } from "@/lib/anon-session";
import {
  addWatchlistItem,
  listWatchlistForAnon,
  removeWatchlistItem,
} from "@/lib/repositories/watchlist.repository";
import { isRelationUndefined } from "@/lib/postgres-error";
import { anonKeySchema, watchlistPostSchema } from "@/lib/schemas/watchlist";

export const runtime = "nodejs";

function watchlistFailureResponse(error: unknown) {
  if (isRelationUndefined(error)) {
    return NextResponse.json(
      {
        error:
          "Watchlist table is missing. Apply migrations: npm run db:migrate (or drizzle-kit migrate).",
      },
      { status: 503 }
    );
  }
  const message = error instanceof Error ? error.message : "Watchlist failed";
  return NextResponse.json({ error: message }, { status: 500 });
}

function getAnonKey(request: Request): string | null {
  const raw = request.headers.get(ANON_HEADER)?.trim();
  if (!raw) return null;
  const parsed = anonKeySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function GET(request: Request) {
  try {
    const anonKey = getAnonKey(request);
    if (!anonKey) {
      return NextResponse.json({ items: [] satisfies { regionId: string; regionName: string; createdAt: string }[] });
    }
    const rows = await listWatchlistForAnon(db(), anonKey);
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
    const anonKey = getAnonKey(request);
    if (!anonKey) {
      return NextResponse.json(
        { error: `Missing or invalid ${ANON_HEADER} header` },
        { status: 400 }
      );
    }
    const body = await request.json().catch(() => null);
    const parsed = watchlistPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    await addWatchlistItem(db(), {
      id: randomUUID(),
      anonKey,
      regionId: parsed.data.regionId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return watchlistFailureResponse(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const anonKey = getAnonKey(request);
    if (!anonKey) {
      return NextResponse.json(
        { error: `Missing or invalid ${ANON_HEADER} header` },
        { status: 400 }
      );
    }
    const regionId = new URL(request.url).searchParams.get("regionId")?.trim();
    if (!regionId) {
      return NextResponse.json({ error: "regionId query required" }, { status: 400 });
    }
    await removeWatchlistItem(db(), anonKey, regionId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return watchlistFailureResponse(e);
  }
}
