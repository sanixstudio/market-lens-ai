"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatScore, formatTechPay } from "@/lib/formatters";
import type { SearchMarketsResponse } from "@/lib/schemas/market";
import { cn } from "@/lib/utils";
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
  className?: string;
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
 * Scrollable ranked list and hidden-opportunity section.
 */
export function RankedMarketsPanel({
  isLoading,
  markets,
  hiddenOpportunities,
  selectedId,
  onSelect,
  queryId,
  specialty,
  className,
}: Props) {
  if (isLoading) {
    return (
      <Card
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl shadow-premium",
          className
        )}
      >
        <CardHeader className="shrink-0 border-b border-border/50 bg-muted/15 py-3.5 dark:bg-muted/10">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="mt-2 h-3 w-56 rounded-md" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (markets.length === 0) {
    return (
      <Card className={cn("rounded-2xl shadow-premium", className)}>
        <CardHeader>
          <CardTitle className="text-base">No results</CardTitle>
          <CardDescription>
            Nothing matched these filters. Try a lower salary floor, different states, or
            another role track.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const renderCard = (m: MarketItem, opts?: { hidden?: boolean }) => (
    <button
      key={opts?.hidden ? `hidden-${m.regionId}` : m.regionId}
      type="button"
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
      className={cn(
        "w-full rounded-xl border border-border/70 bg-card text-left shadow-sm transition-all duration-200",
        "hover:border-primary/25 hover:shadow-md hover:-translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selectedId === m.regionId &&
          "border-primary/50 bg-primary/[0.07] shadow-md ring-1 ring-primary/25 dark:bg-primary/10"
      )}
    >
      <div className="p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading font-semibold leading-snug text-foreground">
            {m.regionName}
          </p>
          <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium tabular-nums text-primary dark:bg-primary/20">
            {formatScore(m.opportunityScore)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ConfidenceBadge score={m.confidenceScore} />
          {opts?.hidden ? (
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-950 dark:text-amber-100">
              Hidden gem
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Median {formatTechPay(m.medianPay)} · {m.activeJobs} active roles
        </p>
        <ul className="mt-2 space-y-0.5 border-t border-border/50 pt-2 text-xs text-muted-foreground">
          {m.topFactors.slice(0, 3).map((f) => (
            <li key={f} className="flex gap-1.5">
              <span className="text-primary" aria-hidden>
                ·
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );

  return (
    <Card
      className={cn(
        "flex min-h-[220px] flex-col overflow-hidden rounded-2xl shadow-premium lg:min-h-0 lg:flex-1",
        className
      )}
    >
      <CardHeader className="shrink-0 space-y-1 border-b border-border/50 bg-muted/15 py-3.5 dark:bg-muted/10">
        <CardTitle className="text-sm font-semibold tracking-tight">Ranked markets</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          {specialty} · {markets.length} region{markets.length === 1 ? "" : "s"} · Click
          to inspect details
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <ScrollArea className="h-0 min-h-[260px] flex-1">
          <div className="space-y-5 p-3 sm:p-4">
            <section aria-label="Top markets">
              <div className="flex flex-col gap-2.5">{markets.map((m) => renderCard(m))}</div>
            </section>
            {hiddenOpportunities.length > 0 ? (
              <section aria-label="Hidden opportunities" className="border-t border-border/60 pt-4">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Hidden opportunities
                </h3>
                <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
                  High opportunity score vs peers, often with lower median pay on
                  paper—worth a second look.
                </p>
                <div className="flex flex-col gap-2.5">
                  {hiddenOpportunities.map((m) => renderCard(m, { hidden: true }))}
                </div>
              </section>
            ) : null}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
