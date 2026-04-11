import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compareMarketsRequestSchema } from "@/lib/schemas/market";
import { compareMarkets } from "@/lib/services/market-comparison.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = compareMarketsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = await compareMarkets(
      db(),
      parsed.data.regionIds,
      parsed.data.specialty,
      parsed.data.competitionPreference ?? "balanced"
    );
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Compare failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
