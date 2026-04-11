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
    if (!primaryRegionId || !otherId) return;
    void postCompareStarted(queryId ?? undefined);
    compareMutation.mutate([primaryRegionId, otherId]);
  };

  const result = compareMutation.data;
  const primaryName =
    markets.find((m) => m.regionId === primaryRegionId)?.regionName ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto border-l border-border/60 bg-background/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <div className="accent-line w-full shrink-0" aria-hidden />
        <div className="border-b border-border/50 bg-muted/15 px-6 py-5 dark:bg-muted/10">
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
            <p className="rounded-xl border border-border/60 bg-linear-to-br from-muted/60 to-muted/25 px-3.5 py-2.5 text-sm font-medium shadow-sm dark:from-muted/40 dark:to-muted/15">
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
            <Select
              value={otherId ?? ""}
              onValueChange={(v) => {
                setOtherId(v ? v : null);
              }}
            >
              <SelectTrigger
                id="compare-with"
                className="h-9 rounded-xl border-border/80 bg-card shadow-sm"
              >
                <SelectValue placeholder="Choose a market" />
              </SelectTrigger>
              <SelectContent>
                {markets
                  .filter((m) => m.regionId !== primaryRegionId)
                  .map((m) => (
                    <SelectItem key={m.regionId} value={m.regionId}>
                      {m.regionName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            className="w-full rounded-xl sm:w-auto"
            disabled={!primaryRegionId || !otherId || compareMutation.isPending}
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
              <p className="text-sm leading-relaxed text-foreground">{result.summary}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.comparison.map((c) => (
                  <Card key={c.regionId} className="rounded-xl shadow-md">
                    <CardHeader className="border-b border-border/50 bg-muted/10 py-2.5 dark:bg-muted/5">
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
