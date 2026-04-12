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
import { InfoTip } from "@/components/ui/info-tip";
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
        "w-full rounded-lg border border-border/40 bg-card text-left shadow-sm transition-colors",
        "hover:border-border hover:bg-muted/30 dark:border-border/35 dark:hover:bg-muted/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        selectedId === m.regionId &&
          "border-primary/40 bg-primary/[0.06] dark:border-primary/45 dark:bg-primary/10"
      )}
    >
      <div className="p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading text-sm font-semibold leading-snug text-foreground">
            {m.regionName}
          </p>
          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] font-medium tabular-nums text-foreground dark:bg-muted/80">
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
        className={cn("flex flex-col overflow-hidden rounded-lg border border-border/40 shadow-sm dark:border-border/35", className)}
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
      <Card className={cn("shadow-sm", className)}>
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
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-muted/30 px-3 py-2 dark:border-border/35">
          <p className="min-w-0 flex-1 text-[11px] font-medium text-muted-foreground">
            {specialty} · {markets.length} market{markets.length === 1 ? "" : "s"}
          </p>
          <InfoTip label="Using the market list" side="bottom" align="end" className="shrink-0">
            Tap a row to select that market and jump to the{" "}
            <span className="font-medium text-background">Details</span> tab for pay bands, demand
            signals, sample roles, and AI commentary when enabled.
          </InfoTip>
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
        "flex min-h-[220px] flex-col overflow-hidden rounded-lg border border-border/40 shadow-sm lg:min-h-0 lg:flex-1 dark:border-border/35",
        className
      )}
    >
      <CardHeader className="shrink-0 flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-muted/15 py-2.5 dark:bg-muted/10">
        <div className="min-w-0 space-y-0.5">
          <CardTitle className="text-sm font-semibold">Markets</CardTitle>
          <CardDescription className="text-[11px] leading-snug">
            {specialty} · {markets.length} market{markets.length === 1 ? "" : "s"}
          </CardDescription>
        </div>
        <InfoTip label="Using the market list" side="left" align="start" className="shrink-0">
          Ranked <span className="font-medium text-background">labor markets</span> for your search.
          Select one to load the Details tab with metrics, listings, and optional AI insight.
        </InfoTip>
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
