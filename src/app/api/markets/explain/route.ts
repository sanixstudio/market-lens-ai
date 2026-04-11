import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { explainMarketRequestSchema } from "@/lib/schemas/market";
import { explainMarket } from "@/lib/services/market-explanation.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = explainMarketRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = await explainMarket(db(), parsed.data);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Explain failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
