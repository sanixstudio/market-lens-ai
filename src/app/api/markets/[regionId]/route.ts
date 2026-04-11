import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMarketDetail } from "@/lib/services/market-detail.service";
import { competitionPreferenceSchema } from "@/lib/schemas/market";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ regionId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { regionId } = await context.params;
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");
    if (!specialty) {
      return NextResponse.json(
        { error: "Missing specialty query parameter" },
        { status: 400 }
      );
    }
    const prefRaw = searchParams.get("competitionPreference");
    const pref = prefRaw
      ? competitionPreferenceSchema.safeParse(prefRaw)
      : { success: true as const, data: "balanced" as const };
    if (!pref.success) {
      return NextResponse.json({ error: "Invalid competitionPreference" }, { status: 400 });
    }
    const detail = await getMarketDetail(
      db(),
      decodeURIComponent(regionId),
      specialty,
      pref.data
    );
    if (!detail) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load market";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
