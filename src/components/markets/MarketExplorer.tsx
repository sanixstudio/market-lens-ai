"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import type { SearchMarketsResponse } from "@/lib/schemas/market";
import type { FilterValues } from "./MarketSearchFilters";
import { MarketSearchFilters } from "./MarketSearchFilters";
import { MarketDetailPanel } from "./MarketDetailPanel";
import { MarketCompareDrawer } from "./MarketCompareDrawer";
import { RankedMarketsPanel } from "./RankedMarketsPanel";
import { Skeleton } from "@/components/ui/skeleton";

const OpportunityMap = dynamic(
  () =>
    import("./OpportunityMap").then((m) => ({ default: m.OpportunityMap })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full min-h-[320px] w-full rounded-lg" />,
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
 * Filters, Mapbox map, ranked panel, detail, compare, and async AI explanations.
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
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border bg-background px-4 py-3">
        <h1 className="text-xl font-semibold tracking-tight">MarketLens AI</h1>
        <p className="text-sm text-muted-foreground">
          Tech job market intelligence by metro — deterministic ranking, AI explains the
          tradeoffs.
        </p>
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
      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <div className="flex min-h-[420px] flex-col gap-4">
          <div className="min-h-[320px] flex-1">
            {searchQuery.isError && (
              <p className="mb-2 text-sm text-destructive">
                {(searchQuery.error as Error).message}. Is{" "}
                <code className="rounded bg-muted px-1">DATABASE_URL</code> set and the
                DB seeded?
              </p>
            )}
            <OpportunityMap
              markets={mapMarkets}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <RankedMarketsPanel
            isLoading={!data && searchQuery.isFetching}
            markets={markets}
            hiddenOpportunities={hidden}
            selectedId={selectedId}
            onSelect={(m) => setSelectedId(m.regionId)}
            queryId={queryId}
            specialty={filters.specialty}
          />
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
