"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchMarketsResponse } from "@/lib/schemas/market";
import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import type { FilterValues } from "./MarketSearchFilters";
import { MarketSearchFilters } from "./MarketSearchFilters";
import { MarketDetailPanel } from "./MarketDetailPanel";
import { MarketCompareDrawer } from "./MarketCompareDrawer";
import { RankedMarketsPanel } from "./RankedMarketsPanel";

const OpportunityMap = dynamic(
  () =>
    import("./OpportunityMap").then((m) => ({ default: m.OpportunityMap })),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-full min-h-0 w-full rounded-none bg-muted/40" />
    ),
  }
);

const defaultFilters: FilterValues = {
  specialty: "Software Engineer",
  minPay: "",
  states: "",
  freshnessDays: "",
  competitionPreference: "balanced",
};

function buildSearchParams(f: FilterValues): URLSearchParams {
  const p = new URLSearchParams();
  p.set("specialty", f.specialty);
  if (f.minPay.trim()) {
    const annual = Number(f.minPay.trim());
    if (!Number.isNaN(annual) && annual > 0) {
      p.set("minPay", String(Math.floor(annual / 52)));
    }
  }
  if (f.states.trim()) p.set("states", f.states.trim());
  if (f.freshnessDays.trim()) p.set("freshnessDays", f.freshnessDays.trim());
  p.set("competitionPreference", f.competitionPreference);
  return p;
}

type RightTab = "rankings" | "details";

/**
 * Viewport-locked explorer: map + tabbed list/detail column.
 */
export function MarketExplorer() {
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [searchKey, setSearchKey] = useState<string | null>(() =>
    buildSearchParams(defaultFilters).toString()
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("rankings");

  const runSearch = useCallback(() => {
    setSearchKey(buildSearchParams(filters).toString());
  }, [filters]);

  const selectRegion = useCallback((regionId: string) => {
    setSelectedId(regionId);
    setRightTab("details");
  }, []);

  const searchQuery = useQuery({
    queryKey: ["markets-search", searchKey],
    queryFn: async () => {
      const res = await fetch(`/api/markets/search?${searchKey}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Search failed");
      }
      return res.json() as Promise<SearchMarketsResponse>;
    },
    enabled: !!searchKey,
  });

  const data = searchQuery.data;
  const markets = useMemo(() => data?.markets ?? [], [data?.markets]);
  const hidden = data?.hiddenOpportunities ?? [];
  const queryId = data?.queryId ?? null;

  const selectedMarket = useMemo(
    () => markets.find((m) => m.regionId === selectedId) ?? null,
    [markets, selectedId]
  );

  const mapMarkets = useMemo(
    () =>
      markets.map((m) => ({
        regionId: m.regionId,
        regionName: m.regionName,
        centroid: m.centroid,
        opportunityScore: m.opportunityScore,
      })),
    [markets]
  );

  return (
    <div className="mesh-page flex h-dvh max-h-dvh flex-col overflow-hidden">
      {/*
        Chrome must stack above `main`: the "More" filter popover extends over the map.
        Without z-index, later DOM siblings (main) paint on top and hide dropdowns.
      */}
      <div className="relative z-[100] isolate shrink-0">
        <AppHeader />
        <MarketSearchFilters
          values={filters}
          onChange={setFilters}
          onSubmit={runSearch}
          onReset={() => {
            setFilters(defaultFilters);
            setSearchKey(buildSearchParams(defaultFilters).toString());
          }}
          isSearching={searchQuery.isFetching}
        />
      </div>

      <main
        className="relative z-0 mx-auto flex min-h-0 w-full max-w-[1760px] flex-1 flex-col gap-3 overflow-hidden px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4 lg:gap-4"
        aria-describedby="explorer-flow-summary"
      >
        <p id="explorer-flow-summary" className="sr-only">
          Results are labor markets such as metros or remote regions. The map shows one marker per
          market. Use the Markets list or map to select a region, then open the Details tab for
          metrics and listings.
        </p>
        {searchQuery.isError ? (
          <div
            role="alert"
            className="shrink-0 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3.5 text-sm shadow-sm"
          >
            <p className="font-heading text-sm font-semibold text-destructive">Search failed</p>
            <p className="mt-1.5 text-destructive/90">
              {(searchQuery.error as Error).message}. Set{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                DATABASE_URL
              </code>{" "}
              and run migrations + seed.
            </p>
          </div>
        ) : null}

        <div
          className={cn(
            "grid min-h-0 flex-1 gap-3 overflow-hidden sm:gap-4",
            "grid-cols-1 grid-rows-[minmax(220px,34vh)_minmax(0,1fr)]",
            "lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:grid-rows-1 lg:items-stretch"
          )}
        >
          <Card className="panel-elevated shadow-premium flex min-h-0 flex-col overflow-hidden p-0">
            <CardHeader className="shrink-0 flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border/50 bg-muted/30 px-4 py-3 dark:border-border/40 dark:bg-muted/25">
              <div className="min-w-0 space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Map
                </p>
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                  United States
                </CardTitle>
              </div>
              <InfoTip label="How to read the map" side="left" align="end" className="shrink-0">
                Each dot is one <span className="font-medium text-background">labor market</span>{" "}
                (metro or remote bucket). Marker color is an{" "}
                <span className="font-medium text-background">info heat</span> scale (blue → cyan) for
                relative opportunity with your filters—not volume and not a red/amber alert.
              </InfoTip>
            </CardHeader>
            <CardContent className="relative z-0 min-h-0 flex-1 bg-muted/25 p-0 dark:bg-muted/15">
              <OpportunityMap
                markets={mapMarkets}
                selectedId={selectedId}
                onSelect={selectRegion}
              />
            </CardContent>
          </Card>

          <div className="panel-elevated shadow-premium flex min-h-0 flex-col overflow-hidden p-0">
            <div className="shrink-0 space-y-3 border-b border-border/50 px-4 pb-4 pt-4 dark:border-border/40">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Insight
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">Rankings & detail</p>
              </div>
              <div
                className="segmented"
                role="tablist"
                aria-label="Markets list and details"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightTab === "rankings"}
                  data-state={rightTab === "rankings" ? "active" : "inactive"}
                  className="segmented-trigger"
                  onClick={() => setRightTab("rankings")}
                >
                  Markets
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightTab === "details"}
                  data-state={rightTab === "details" ? "active" : "inactive"}
                  className="segmented-trigger"
                  onClick={() => setRightTab("details")}
                >
                  Details
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              {rightTab === "rankings" ? (
                <RankedMarketsPanel
                  variant="panel"
                  className="absolute inset-0"
                  isLoading={!data && searchQuery.isFetching}
                  markets={markets}
                  hiddenOpportunities={hidden}
                  selectedId={selectedId}
                  onSelect={(m) => selectRegion(m.regionId)}
                  queryId={queryId}
                  specialty={filters.specialty}
                />
              ) : (
                <ScrollArea className="absolute inset-0 h-full">
                  <div className="p-3 sm:p-4">
                    <MarketDetailPanel
                      regionId={selectedId}
                      specialty={filters.specialty}
                      queryId={queryId}
                      onCompare={() => setCompareOpen(true)}
                      onSave={() => {
                        /* feedback handled inside panel */
                      }}
                      embedded
                    />
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      </main>

      <MarketCompareDrawer
        open={compareOpen}
        onOpenChange={setCompareOpen}
        specialty={filters.specialty}
        markets={markets}
        primaryRegionId={selectedMarket?.regionId ?? selectedId}
        queryId={queryId}
      />
    </div>
  );
}
