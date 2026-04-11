"use client";

import type { ReactNode } from "react";
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
  /** `panel` = no outer card, fills parent height (for tabbed layout). */
  variant?: "card" | "panel";
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

function ListBody({
  markets,
  hiddenOpportunities,
  renderCard,
}: {
  markets: MarketItem[];
  hiddenOpportunities: MarketItem[];
  renderCard: (m: MarketItem, opts?: { hidden?: boolean }) => ReactNode;
}) {
  return (
    <div className="space-y-4 p-2 sm:p-3">
      <div className="flex flex-col gap-2">{markets.map((m) => renderCard(m))}</div>
      {hiddenOpportunities.length > 0 ? (
        <div className="border-t border-border/50 pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Also consider
          </p>
          <div className="flex flex-col gap-2">
            {hiddenOpportunities.map((m) => renderCard(m, { hidden: true }))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Ranked markets list; use `variant="panel"` inside a fixed-height tab or split pane.
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
  variant = "card",
}: Props) {
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
        "w-full rounded-lg border border-border/70 bg-card text-left shadow-sm transition-all duration-200",
        "hover:border-primary/30 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selectedId === m.regionId &&
          "border-primary/50 bg-primary/[0.07] ring-1 ring-primary/20 dark:bg-primary/10"
      )}
    >
      <div className="p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading text-sm font-semibold leading-snug text-foreground">
            {m.regionName}
          </p>
          <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-primary dark:bg-primary/20">
            {formatScore(m.opportunityScore)}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <ConfidenceBadge score={m.confidenceScore} />
          {opts?.hidden ? (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-950 dark:text-amber-100">
              Alt pick
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {formatTechPay(m.medianPay)} median · {m.activeJobs} roles
        </p>
        <ul className="mt-1.5 space-y-0.5 border-t border-border/40 pt-1.5 text-[11px] text-muted-foreground">
          {m.topFactors.slice(0, 2).map((f) => (
            <li key={f} className="truncate">
              {f}
            </li>
          ))}
        </ul>
      </div>
    </button>
  );

  if (isLoading) {
    if (variant === "panel") {
      return (
        <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
          <div className="flex shrink-0 items-center border-b border-border/50 px-2 py-2">
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex flex-1 flex-col gap-2 p-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      );
    }
    return (
      <Card
        className={cn("flex flex-col overflow-hidden rounded-2xl shadow-premium", className)}
      >
        <CardHeader className="shrink-0 border-b border-border/50 py-2.5">
          <Skeleton className="h-3 w-36" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (markets.length === 0) {
    if (variant === "panel") {
      return (
        <div
          className={cn(
            "flex h-full min-h-0 flex-col items-center justify-center p-4 text-center text-sm text-muted-foreground",
            className
          )}
        >
          No markets match. Loosen filters and search again.
        </div>
      );
    }
    return (
      <Card className={cn("rounded-2xl shadow-premium", className)}>
        <CardHeader>
          <CardTitle className="text-base">No results</CardTitle>
          <CardDescription>Adjust filters and run search again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (variant === "panel") {
    return (
      <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
        <div className="shrink-0 border-b border-border/50 bg-muted/15 px-2 py-2 text-[11px] font-medium text-muted-foreground dark:bg-muted/10">
          {specialty} · {markets.length} market{markets.length === 1 ? "" : "s"}
        </div>
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <ListBody
            markets={markets}
            hiddenOpportunities={hiddenOpportunities}
            renderCard={renderCard}
          />
        </ScrollArea>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "flex min-h-[220px] flex-col overflow-hidden rounded-2xl shadow-premium lg:min-h-0 lg:flex-1",
        className
      )}
    >
      <CardHeader className="shrink-0 space-y-0 border-b border-border/50 bg-muted/15 py-2.5 dark:bg-muted/10">
        <CardTitle className="text-sm font-semibold">Rankings</CardTitle>
        <CardDescription className="text-[11px]">
          {specialty} · {markets.length} region{markets.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <ScrollArea className="h-0 min-h-[200px] flex-1">
          <ListBody
            markets={markets}
            hiddenOpportunities={hiddenOpportunities}
            renderCard={renderCard}
          />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
