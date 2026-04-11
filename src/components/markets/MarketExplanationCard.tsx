"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AIExplanation } from "@/lib/schemas/ai-insight";
import { cn } from "@/lib/utils";

type Props = {
  explanation: AIExplanation | undefined;
  isLoading: boolean;
  cached?: boolean;
  onFeedback?: (helpful: boolean) => void;
  embedded?: boolean;
};

/**
 * AI narrative grounded in on-page metrics; ranking stays deterministic.
 */
export function MarketExplanationCard({
  explanation,
  isLoading,
  cached,
  onFeedback,
  embedded = false,
}: Props) {
  const cardRadius = embedded ? "rounded-xl" : "rounded-2xl";

  if (isLoading) {
    return (
      <Card className={cn("shadow-premium", cardRadius)}>
        <CardHeader className="space-y-0 border-b border-border/50 bg-muted/10 py-2.5 dark:bg-muted/5">
          <CardTitle className="text-sm font-semibold">AI insight</CardTitle>
        </CardHeader>
        <CardContent className="py-3 text-xs text-muted-foreground">Generating…</CardContent>
      </Card>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <Card className={cn("shadow-premium", cardRadius)}>
      <CardHeader className="space-y-0 border-b border-border/50 bg-muted/10 py-2.5 dark:bg-muted/5 sm:py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">AI insight</CardTitle>
          {cached != null ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {cached ? "Cached" : "Fresh"}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("text-sm", embedded ? "space-y-3 pt-3" : "space-y-4 pt-4")}>
        <p className="leading-relaxed text-foreground">{explanation.summary}</p>
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Strengths
          </h4>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
            {explanation.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tradeoffs
          </h4>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
            {explanation.tradeoffs.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <Separator />
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Best for
          </h4>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
            {explanation.bestFor.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Watchouts
          </h4>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
            {explanation.watchouts.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">{explanation.confidenceNote}</p>
        {onFeedback ? (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-xl"
              onClick={() => onFeedback(true)}
            >
              Helpful
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => onFeedback(false)}
            >
              Not helpful
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
