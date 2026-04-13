"use client";

import type { ReactNode } from "react";
import {
  startTransition,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatScore, formatTechPay } from "@/lib/formatters";
import type { SearchMarketsResponse } from "@/lib/schemas/market";
import { heatPillClass, opportunityHeatBand } from "@/lib/opportunity-heat";
import { InfoTip } from "@/components/ui/info-tip";
import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "./ConfidenceBadge";

type MarketItem = SearchMarketsResponse["markets"][number];

const PAGE_SIZE = 25;

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
  renderCard: (m: MarketItem, opts?: { hidden?: boolean; rank?: number }) => ReactNode;
}) {
  return (
    <div className="space-y-4 px-3 pb-4 pt-1 sm:px-4">
      <div className="flex flex-col gap-2.5">
        {markets.map((m, idx) => renderCard(m, { rank: idx + 1 }))}
      </div>
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

function PaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (next: number) => void;
}) {
  const from = totalItems === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalItems);

  return (
    <div
      className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/40 bg-gradient-to-b from-muted/30 to-muted/15 px-3 py-2.5 dark:border-border/35 dark:from-muted/25 dark:to-muted/12 sm:px-4"
      role="navigation"
      aria-label="Market list pages"
    >
      <p className="text-[11px] tabular-nums text-muted-foreground sm:text-xs">
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>
        <span className="mx-1">of</span>
        {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-8 border-border/60 shadow-sm sm:size-9"
          disabled={page <= 0}
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <span className="min-w-[4.5rem] text-center text-[11px] font-medium tabular-nums text-muted-foreground sm:text-xs">
          {page + 1} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-8 border-border/60 shadow-sm sm:size-9"
          disabled={page >= totalPages - 1}
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
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
  const [page, setPage] = useState(0);
  const listScrollContainerRef = useRef<HTMLDivElement>(null);

  const marketsSignature = useMemo(
    () => markets.map((m) => m.regionId).join(),
    [markets]
  );

  const totalPages = Math.max(1, Math.ceil(markets.length / PAGE_SIZE));

  const pageMarkets = useMemo(() => {
    const start = page * PAGE_SIZE;
    return markets.slice(start, start + PAGE_SIZE);
  }, [markets, page]);

  useEffect(() => {
    startTransition(() => {
      const maxPage = Math.max(0, Math.ceil(markets.length / PAGE_SIZE) - 1);
      if (selectedId) {
        const idx = markets.findIndex((m) => m.regionId === selectedId);
        if (idx >= 0) {
          setPage(Math.min(Math.floor(idx / PAGE_SIZE), maxPage));
          return;
        }
      }
      setPage(0);
    });
  }, [marketsSignature, selectedId, markets]);

  useLayoutEffect(() => {
    const root = listScrollContainerRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLElement>("[data-slot='scroll-area-viewport']");
    if (viewport) {
      viewport.scrollTop = 0;
    }
  }, [page]);

  const renderCard = (m: MarketItem, opts?: { hidden?: boolean; rank?: number }) => {
    const heat = opportunityHeatBand(m.opportunityScore);
    const bestFor = m.topFactors[0] ?? "Balanced market fundamentals";
    return (
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
        "group w-full rounded-2xl border border-border/50 bg-card text-left shadow-sm ring-1 ring-black/[0.02] transition-[border-color,background-color,box-shadow,transform] duration-200 dark:ring-white/[0.03]",
        "hover:-translate-y-px hover:border-border/85 hover:bg-muted/30 hover:shadow-premium dark:border-border/42 dark:hover:bg-muted/25",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        selectedId === m.regionId &&
          "border-primary/50 bg-gradient-to-br from-primary/[0.09] to-primary/[0.04] shadow-md ring-1 ring-primary/20 dark:border-primary/55 dark:from-primary/[0.14] dark:to-primary/[0.06] dark:ring-primary/25"
      )}
    >
      <div className="p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {opts?.rank ? (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  #{opts.rank}
                </span>
              ) : null}
              <p className="truncate font-heading text-[0.9375rem] font-semibold leading-snug text-foreground">
                {m.regionName}
              </p>
            </div>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              Best for: <span className="text-foreground/85">{bestFor}</span>
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
              heatPillClass[heat]
            )}
          >
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
  };

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
            "flex h-full min-h-0 flex-col items-center justify-center gap-2 p-6 text-center",
            className
          )}
        >
          <p className="font-heading text-sm font-semibold tracking-tight text-foreground">No markets match</p>
          <p className="max-w-[17rem] text-xs leading-relaxed text-muted-foreground">
            Broaden role or geography, or clear state filters—then run <span className="font-medium text-foreground/80">Search</span> again.
          </p>
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
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-gradient-to-r from-muted/40 via-muted/25 to-transparent px-4 py-2.5 dark:border-border/35 dark:from-muted/30 dark:via-muted/18">
          <p className="min-w-0 flex-1 text-xs font-medium text-muted-foreground">
            <span className="font-medium text-foreground">{specialty}</span>
            <span className="mx-1.5 text-muted-foreground/35">·</span>
            {markets.length} market{markets.length === 1 ? "" : "s"}
          </p>
          <InfoTip label="Using the market list" side="bottom" align="end" className="shrink-0">
            Tap a row to select that market and jump to the{" "}
            <span className="font-medium text-background">Details</span> tab for pay bands, demand
            signals, sample roles, and AI commentary when enabled.
          </InfoTip>
        </div>
        <div
          ref={listScrollContainerRef}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ScrollArea className="min-h-0 flex-1 overflow-hidden">
            <ListBody
              markets={pageMarkets}
              hiddenOpportunities={hiddenOpportunities}
              renderCard={renderCard}
            />
          </ScrollArea>
        </div>
        {markets.length > PAGE_SIZE ? (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={markets.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
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
        <div ref={listScrollContainerRef} className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="h-0 min-h-[200px] flex-1">
            <ListBody
              markets={pageMarkets}
              hiddenOpportunities={hiddenOpportunities}
              renderCard={renderCard}
            />
          </ScrollArea>
        </div>
        {markets.length > PAGE_SIZE ? (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={markets.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
