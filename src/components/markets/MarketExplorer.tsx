"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
      <Skeleton className="h-full min-h-0 w-full rounded-none bg-muted/50" />
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

      <main className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-2 overflow-hidden px-3 pb-2 pt-2 sm:px-4 sm:pb-3 sm:pt-2 lg:gap-3">
        {searchQuery.isError ? (
          <div
            role="alert"
            className="shrink-0 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm shadow-sm"
          >
            <p className="font-heading font-semibold text-destructive">Search failed</p>
            <p className="mt-1 text-destructive/90">
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
            "grid min-h-0 flex-1 gap-2 overflow-hidden sm:gap-3",
            "grid-cols-1 grid-rows-[minmax(200px,32vh)_minmax(0,1fr)]",
            "lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] lg:grid-rows-1 lg:items-stretch"
          )}
        >
          <Card className="flex min-h-0 flex-col overflow-hidden rounded-xl border-border/60 shadow-premium lg:rounded-2xl p-0">
            <CardContent className="relative min-h-0 flex-1 bg-muted/10 p-0">
              <OpportunityMap
                markets={mapMarkets}
                selectedId={selectedId}
                onSelect={selectRegion}
              />
            </CardContent>
          </Card>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-premium lg:rounded-2xl">
            <div
              className="flex shrink-0 gap-0.5 border-b border-border/50 bg-muted/20 p-1 dark:bg-muted/10"
              role="tablist"
              aria-label="Results"
            >
              <button
                type="button"
                role="tab"
                aria-selected={rightTab === "rankings"}
                className={cn(
                  "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
                  rightTab === "rankings"
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setRightTab("rankings")}
              >
                Rankings
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={rightTab === "details"}
                className={cn(
                  "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
                  rightTab === "details"
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setRightTab("details")}
              >
                Details
              </button>
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
                  <div className="p-2 sm:p-3">
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
