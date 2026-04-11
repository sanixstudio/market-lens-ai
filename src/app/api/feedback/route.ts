import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedbackEventRequestSchema } from "@/lib/schemas/market";
import { insertFeedbackEvent } from "@/lib/repositories/markets.repository";
import { logStructured } from "@/lib/services/telemetry.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = feedbackEventRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const id = randomUUID();
    await insertFeedbackEvent(db(), {
      id,
      queryId: parsed.data.queryId ?? null,
      regionId: parsed.data.regionId ?? null,
      eventType: parsed.data.eventType,
      metadata: parsed.data.metadata ?? null,
    });
    logStructured("info", "feedback.received", {
      eventType: parsed.data.eventType,
      queryId: parsed.data.queryId,
      regionId: parsed.data.regionId,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Feedback failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
