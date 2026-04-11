"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
 * Side-by-side comparison for two regions (Section 2D).
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Compare markets</SheetTitle>
          <SheetDescription>
            Pick a second region to compare pay, volume, freshness proxy, saturation
            proxy, and opportunity score.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-2">
          <Label>Primary</Label>
          <p className="text-sm text-muted-foreground">
            {markets.find((m) => m.regionId === primaryRegionId)?.regionName ??
              "None selected"}
          </p>
        </div>
        <div className="space-y-2">
          <Label>Compare with</Label>
          <Select
            value={otherId ?? ""}
            onValueChange={(v) => {
              setOtherId(v ? v : null);
            }}
          >
            <SelectTrigger>
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
          disabled={!primaryRegionId || !otherId || compareMutation.isPending}
          onClick={runCompare}
        >
          {compareMutation.isPending ? "Comparing…" : "Run comparison"}
        </Button>
        {compareMutation.isError && (
          <p className="text-sm text-destructive">Could not compare markets.</p>
        )}
        {result && (
          <div className="space-y-4 text-sm">
            <p className="leading-relaxed">{result.summary}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.comparison.map((c) => (
                <div
                  key={c.regionId}
                  className="rounded-lg border border-border p-3 space-y-1"
                >
                  <p className="font-semibold">{c.regionName}</p>
                  <p>Median comp: {formatTechPay(c.medianPay)}</p>
                  <p>Open roles: {c.activeJobs}</p>
                  <p>Freshness proxy: {formatScore(c.freshnessScore)}</p>
                  <p>Saturation proxy: {formatScore(c.competitionScore ?? 0)}</p>
                  <p>Opportunity: {formatScore(c.opportunityScore)}</p>
                  <p>Confidence: {formatScore(c.confidenceScore)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
