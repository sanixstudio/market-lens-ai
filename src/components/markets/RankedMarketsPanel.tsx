"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatScore, formatTechPay } from "@/lib/formatters";
import type { SearchMarketsResponse } from "@/lib/schemas/market";
import { ConfidenceBadge } from "./ConfidenceBadge";

type MarketItem = SearchMarketsResponse["markets"][number];

type Props = {
  isLoading: boolean;
  markets: MarketItem[];
  hiddenOpportunities: MarketItem[];
  selectedId: string | null;
  onSelect: (m: MarketItem) => void;
  queryId: string | null;
  specialty: string;
};

async function postFeedback(body: {
  queryId?: string;
  regionId?: string;
  eventType: "recommendation_clicked";
}) {
  await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Ranked list plus hidden opportunities section (Section 2B).
 */
export function RankedMarketsPanel({
  isLoading,
  markets,
  hiddenOpportunities,
  selectedId,
  onSelect,
  queryId,
  specialty,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">No markets match these filters</p>
        <p className="mt-2">
          Try lowering the minimum salary, adding states, or switching role. Rankings
          are deterministic from current listings only.
        </p>
      </div>
    );
  }

  const renderCard = (m: MarketItem, opts?: { hidden?: boolean }) => (
    <Card
      key={`${m.regionId}-${opts?.hidden ? "h" : "m"}`}
      className={`cursor-pointer transition-colors hover:bg-muted/40 ${
        selectedId === m.regionId ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => {
        onSelect(m);
        if (queryId) {
          void postFeedback({
            queryId,
            regionId: m.regionId,
            eventType: "recommendation_clicked",
          });
        }
      }}
    >
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">{m.regionName}</CardTitle>
          <span className="text-xs font-mono text-muted-foreground">
            {formatScore(m.opportunityScore)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceBadge score={m.confidenceScore} />
          {opts?.hidden && (
            <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-900 dark:text-amber-100">
              Hidden opportunity
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Median comp {formatTechPay(m.medianPay)} · {m.activeJobs} open roles
        </p>
        <ul className="list-inside list-disc">
          {m.topFactors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] pr-3">
      <div className="space-y-6 pb-8">
        <section>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Strong markets · {specialty}
          </h3>
          <div className="flex flex-col gap-3">{markets.map((m) => renderCard(m))}</div>
        </section>
        {hiddenOpportunities.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Hidden opportunities
            </h3>
            <p className="mb-2 text-xs text-muted-foreground">
              Strong opportunity score with relatively lower median pay vs peers—often
              less obvious picks.
            </p>
            <div className="flex flex-col gap-3">
              {hiddenOpportunities.map((m) => renderCard(m, { hidden: true }))}
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
