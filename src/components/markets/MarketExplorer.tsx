"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchMarketsResponse } from "@/lib/schemas/market";
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
      <Skeleton className="h-full min-h-[280px] w-full rounded-xl bg-muted/50" />
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

/**
 * Full-page explorer: premium chrome, map workspace, ranked list, and detail stack.
 */
export function MarketExplorer() {
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [searchKey, setSearchKey] = useState<string | null>(() =>
    buildSearchParams(defaultFilters).toString()
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const runSearch = useCallback(() => {
    setSearchKey(buildSearchParams(filters).toString());
  }, [filters]);

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
    <div className="mesh-page flex min-h-dvh flex-col">
      <div className="chrome-glass sticky top-0 z-40">
        <div className="accent-line w-full" aria-hidden />
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/15 dark:bg-primary/15 dark:ring-primary/25">
              <Sparkles className="size-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                <span className="text-gradient-brand">MarketLens</span>{" "}
                <span className="text-foreground">AI</span>
              </h1>
              <p className="mt-0.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Rank labor markets for your role, compare pay and demand signals, and read
                AI commentary grounded in the same data—not a black box.
              </p>
            </div>
          </div>
        </div>
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

      <main className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col gap-4 px-4 py-5 lg:gap-6 lg:py-6">
        {searchQuery.isError ? (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm shadow-sm backdrop-blur-sm"
          >
            <p className="font-heading font-semibold text-destructive">Search failed</p>
            <p className="mt-2 leading-relaxed text-destructive/90">
              {(searchQuery.error as Error).message}. Check that{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                DATABASE_URL
              </code>{" "}
              is set and the database is migrated and seeded.
            </p>
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:min-h-[calc(100dvh-12rem)] lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)] lg:grid-rows-1 lg:items-stretch lg:gap-6">
          <Card className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl shadow-premium lg:min-h-0 lg:h-full">
            <CardHeader className="shrink-0 space-y-1 border-b border-border/50 bg-muted/20 py-3.5 dark:bg-muted/10">
              <CardTitle className="text-sm font-semibold tracking-tight">
                Market map
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Centroids sized by region; marker color encodes opportunity score for your
                current search. Click to sync the detail panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative min-h-[280px] flex-1 bg-muted/10 p-0 lg:min-h-0">
              <OpportunityMap
                markets={mapMarkets}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </CardContent>
          </Card>

          <div className="flex min-h-0 flex-col gap-5 lg:h-full lg:min-h-0">
            <RankedMarketsPanel
              isLoading={!data && searchQuery.isFetching}
              markets={markets}
              hiddenOpportunities={hidden}
              selectedId={selectedId}
              onSelect={(m) => setSelectedId(m.regionId)}
              queryId={queryId}
              specialty={filters.specialty}
              className="lg:min-h-0 lg:flex-[3]"
            />
            <div className="min-h-0 lg:flex-[2] lg:overflow-y-auto lg:pt-0.5">
              <MarketDetailPanel
                regionId={selectedId}
                specialty={filters.specialty}
                queryId={queryId}
                onCompare={() => setCompareOpen(true)}
                onSave={() => {
                  /* feedback handled inside panel */
                }}
              />
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
