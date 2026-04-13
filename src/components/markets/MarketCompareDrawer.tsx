"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CompareMarketsCharts } from "./CompareMarketsCharts";
import { formatScore, formatTechPay } from "@/lib/formatters";
import type { SearchMarketsResponse } from "@/lib/schemas/market";
import type { CompareMarketsResponse } from "@/lib/schemas/ai-insight";

type MarketItem = SearchMarketsResponse["markets"][number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialty: string;
  markets: MarketItem[];
  primaryRegionId: string | null;
  queryId: string | null;
};

async function postCompareStarted(queryId: string | undefined) {
  await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      queryId,
      eventType: "compare_started",
    }),
  });
}

function buildOutcomeRecommendation(comparison: CompareMarketsResponse["comparison"]): string | null {
  if (comparison.length < 2) return null;
  const [a, b] = comparison;

  const roleDiff = a.activeJobs - b.activeJobs;
  const payDiff = (a.medianPay ?? 0) - (b.medianPay ?? 0);
  const confidenceDiff = a.confidenceScore - b.confidenceScore;

  const roleLeader = roleDiff >= 0 ? a.regionName : b.regionName;
  const payLeader = payDiff >= 0 ? a.regionName : b.regionName;
  const confidenceLeader = confidenceDiff >= 0 ? a.regionName : b.regionName;

  return `Pick ${roleLeader} for more immediate hiring volume, pick ${payLeader} for stronger compensation upside, and lean ${confidenceLeader} if you value signal reliability most.`;
}

/**
 * Sheet: pick a second region and view side-by-side metrics + summary.
 */
export function MarketCompareDrawer({
  open,
  onOpenChange,
  specialty,
  markets,
  primaryRegionId,
  queryId,
}: Props) {
  const [otherId, setOtherId] = useState<string | null>(null);

  const compareMutation = useMutation({
    mutationFn: async (pair: [string, string]) => {
      const res = await fetch("/api/markets/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionIds: pair,
          specialty,
        }),
      });
      if (!res.ok) throw new Error("Compare failed");
      return res.json() as Promise<CompareMarketsResponse>;
    },
  });

  const runCompare = () => {
    const fallbackId = markets.find((m) => m.regionId !== primaryRegionId)?.regionId ?? null;
    const candidateId = otherId ?? fallbackId;
    if (!primaryRegionId || !candidateId) return;
    void postCompareStarted(queryId ?? undefined);
    compareMutation.mutate([primaryRegionId, candidateId]);
  };

  const result = compareMutation.data;
  const primaryName =
    markets.find((m) => m.regionId === primaryRegionId)?.regionName ?? null;
  const otherMarketOptions = markets.filter((m) => m.regionId !== primaryRegionId);
  const effectiveOtherId = otherId ?? otherMarketOptions[0]?.regionId ?? null;
  const recommendation = result ? buildOutcomeRecommendation(result.comparison) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto border-l border-border/40 bg-popover p-0 shadow-xl sm:max-w-md sm:rounded-l-lg dark:border-border/40 dark:bg-card">
        <div className="accent-line w-full shrink-0" aria-hidden />
        <div className="border-b border-border/50 bg-linear-to-r from-muted/25 to-transparent px-6 py-5 dark:from-muted/15">
          <SheetHeader className="space-y-1.5 p-0 text-left">
            <SheetTitle className="font-heading text-lg font-semibold tracking-tight">
              Compare markets
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {specialty} · pick another region from this search.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="space-y-2">
            <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Baseline
            </Label>
            <p className="rounded-lg border border-border/45 bg-muted/40 px-3 py-2.5 text-sm font-medium dark:border-border/40 dark:bg-muted/30">
              {primaryName ?? "Select a market in the list first"}
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="compare-with"
              className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              Compare with
            </Label>
            {otherMarketOptions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/50 bg-muted/25 px-3 py-2.5 text-xs text-muted-foreground dark:border-border/40 dark:bg-muted/15">
                {markets.length === 0
                  ? "Run a search first so there are markets to compare."
                  : primaryRegionId
                    ? "No other markets in this result set. Broaden filters and search again."
                    : "Select a baseline market, or add more regions with a broader search."}
              </p>
            ) : (
              <Select
                value={effectiveOtherId ?? ""}
                onValueChange={(v) => {
                  setOtherId(v ? v : null);
                }}
              >
                <SelectTrigger
                  id="compare-with"
                  className="h-9 w-full min-w-0 rounded-lg border-border/50 bg-background dark:border-border/45 dark:bg-input/30"
                >
                  <SelectValue placeholder="Choose a market" />
                </SelectTrigger>
                <SelectContent>
                  {otherMarketOptions.map((m) => (
                    <SelectItem key={m.regionId} value={m.regionId}>
                      {m.regionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button
            type="button"
            className="w-full rounded-lg sm:w-auto"
            disabled={!primaryRegionId || !effectiveOtherId || compareMutation.isPending}
            onClick={runCompare}
          >
            {compareMutation.isPending ? "Comparing…" : "Run comparison"}
          </Button>

          {compareMutation.isError ? (
            <p className="text-sm text-destructive" role="alert">
              Could not compare markets. Try again.
            </p>
          ) : null}

          {result ? (
            <div className="space-y-4 border-t border-border/60 pt-4">
              {recommendation ? (
                <div className="rounded-xl border border-primary/25 bg-primary/8 px-3 py-2.5 text-xs dark:border-primary/30 dark:bg-primary/12">
                  <p className="font-semibold tracking-wide text-primary">Outcome</p>
                  <p className="mt-1 text-foreground/90">{recommendation}</p>
                </div>
              ) : null}
              <p className="text-sm leading-relaxed text-foreground">{result.summary}</p>
              <CompareMarketsCharts comparison={result.comparison} />
              <div className="grid gap-3 sm:grid-cols-2">
                {result.comparison.map((c) => (
                  <Card key={c.regionId} className="overflow-hidden shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-muted/15 py-2.5 dark:bg-muted/10">
                      <CardTitle className="text-sm font-semibold">{c.regionName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 pt-3 text-xs">
                      <p>
                        <span className="text-muted-foreground">Median comp</span>{" "}
                        <span className="font-medium tabular-nums">
                          {formatTechPay(c.medianPay)}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Open roles</span>{" "}
                        <span className="font-medium tabular-nums">{c.activeJobs}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Freshness</span>{" "}
                        <span className="font-medium">{formatScore(c.freshnessScore)}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Saturation</span>{" "}
                        <span className="font-medium">
                          {formatScore(c.competitionScore ?? 0)}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Opportunity</span>{" "}
                        <span className="font-medium">{formatScore(c.opportunityScore)}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Confidence</span>{" "}
                        <span className="font-medium">{formatScore(c.confidenceScore)}</span>
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
