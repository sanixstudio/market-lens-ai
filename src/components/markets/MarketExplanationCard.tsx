"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AIExplanation } from "@/lib/schemas/ai-insight";

type Props = {
  explanation: AIExplanation | undefined;
  isLoading: boolean;
  cached?: boolean;
  onFeedback?: (helpful: boolean) => void;
};

/**
 * Grounded AI explanation panel with optional helpful / not helpful actions.
 */
export function MarketExplanationCard({
  explanation,
  isLoading,
  cached,
  onFeedback,
}: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI insight</CardTitle>
          <CardDescription>Generating explanation…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Structured rankings are already shown; narrative loads separately.</p>
        </CardContent>
      </Card>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">AI insight</CardTitle>
          {cached != null && (
            <span className="text-xs text-muted-foreground">
              {cached ? "Cached" : "Fresh"}
            </span>
          )}
        </div>
        <CardDescription>
          Grounded in the metrics on this page—ranking stays deterministic; the model
          only narrates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="leading-relaxed">{explanation.summary}</p>
        <div>
          <h4 className="mb-1 font-medium">Strengths</h4>
          <ul className="list-inside list-disc text-muted-foreground">
            {explanation.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-1 font-medium">Tradeoffs</h4>
          <ul className="list-inside list-disc text-muted-foreground">
            {explanation.tradeoffs.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <Separator />
        <div>
          <h4 className="mb-1 font-medium">Best for</h4>
          <ul className="list-inside list-disc text-muted-foreground">
            {explanation.bestFor.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-1 font-medium">Watchouts</h4>
          <ul className="list-inside list-disc text-muted-foreground">
            {explanation.watchouts.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">{explanation.confidenceNote}</p>
        {onFeedback && (
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
              onClick={() => onFeedback(true)}
            >
              Helpful
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
              onClick={() => onFeedback(false)}
            >
              Not helpful
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
