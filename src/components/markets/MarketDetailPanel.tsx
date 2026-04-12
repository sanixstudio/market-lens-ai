"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatScore, formatTechPay } from "@/lib/formatters";
import type { MarketDetailResponse } from "@/lib/schemas/market";
import type { ExplainMarketResponse } from "@/lib/schemas/ai-insight";
import { InfoTip } from "@/components/ui/info-tip";
import { heatPillClass, opportunityHeatBand } from "@/lib/opportunity-heat";
import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { MarketExplanationCard } from "./MarketExplanationCard";

type Props = {
  regionId: string | null;
  specialty: string;
  queryId: string | null;
  onCompare: () => void;
  /** Clerk-backed saved list (signed-in users only). */
  watchlisted: boolean;
  watchlistBusy?: boolean;
  onToggleWatchlist: () => void | Promise<void>;
  /** Tighter layout inside a scroll region (e.g. Details tab). */
  embedded?: boolean;
};

async function postFeedback(body: {
  queryId?: string;
  regionId?: string;
  eventType: "ai_helpful" | "ai_not_helpful" | "market_saved";
}) {
  await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Selected region: metrics, actions, AI narrative, and sample job rows.
 */
export function MarketDetailPanel({
  regionId,
  specialty,
  queryId,
  onCompare,
  watchlisted,
  watchlistBusy = false,
  onToggleWatchlist,
  embedded = false,
}: Props) {
  const detailQuery = useQuery({
    queryKey: ["market-detail", regionId, specialty],
    queryFn: async () => {
      const res = await fetch(
        `/api/markets/${encodeURIComponent(regionId!)}?specialty=${encodeURIComponent(specialty)}`
      );
      if (!res.ok) throw new Error("Failed to load detail");
      return res.json() as Promise<MarketDetailResponse>;
    },
    enabled: !!regionId,
  });

  const explainQuery = useQuery({
    queryKey: ["market-explain", queryId, regionId, specialty],
    queryFn: async () => {
      const res = await fetch("/api/markets/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryId,
          regionId,
          specialty,
        }),
      });
      if (!res.ok) throw new Error("Failed to load explanation");
      return res.json() as Promise<ExplainMarketResponse>;
    },
    enabled: !!regionId && !!queryId,
  });

  const stackGap = embedded ? "gap-2" : "gap-3 lg:gap-4";
  /** Card primitive already applies border + shadow; tighten corner radius for flagship shells. */
  const cardShell = "rounded-xl";

  if (!regionId) {
    return (
      <Card
        className={cn(
          "border-dashed border-border/55 bg-muted/20 shadow-sm dark:border-border/50 dark:bg-muted/10",
          "rounded-xl"
        )}
      >
        <CardHeader className="space-y-4 pb-6 pt-8 text-center sm:px-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/60 dark:bg-card dark:ring-border/50">
            <MapPin className="size-7 text-muted-foreground" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5">
              <CardTitle className="text-base font-semibold">Market details</CardTitle>
              <InfoTip label="Why Details is empty" side="bottom" align="center" className="size-7">
                Details applies to a whole{" "}
                <span className="font-medium text-background">market</span> (metro or remote region),
                not one job. Select a dot on the map or a row under Markets, then switch back here for
                pay, activity, samples, and AI when configured.
              </InfoTip>
            </div>
            <CardDescription className="mx-auto max-w-[18rem] text-sm leading-relaxed">
              Choose a region on the map or from the Markets tab to see pay, demand, and listings.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <Card className={cn(cardShell)}>
        <CardHeader className="space-y-0 py-3">
          <CardTitle className="text-sm font-semibold">Loading…</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <Card className={cn(cardShell, "border-destructive/35")}>
        <CardHeader className="space-y-0 py-3">
          <CardTitle className="text-sm font-semibold text-destructive">
            Could not load market
          </CardTitle>
          <CardDescription className="text-xs">Try again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const d = detailQuery.data;
  const opportunityHeat = opportunityHeatBand(d.metrics.opportunityScore);
  const lowConfidence = d.metrics.confidenceScore < 0.45;
  const hasRemotiveSamples = d.sampleJobs.some((j) =>
    j.listingUrl?.includes("remotive.com")
  );

  const contentPad = embedded ? "space-y-3 pt-3" : "space-y-4 pt-4";
  const headerPad = embedded ? "pb-2.5 pt-3" : "pb-3.5";

  return (
    <div className={cn("flex flex-col", stackGap)}>
      <Card className={cn(cardShell)}>
        <CardHeader
          className={cn(
            "space-y-2 border-b border-border/50 bg-muted/25 dark:border-border/45 dark:bg-muted/15",
            headerPad
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Selected market
              </p>
              <CardTitle className="mt-1 text-lg font-semibold leading-tight tracking-tight">
                {d.regionName}
              </CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span>{d.specialty}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    heatPillClass[opportunityHeat]
                  )}
                >
                  Score {formatScore(d.metrics.opportunityScore)}
                </span>
              </CardDescription>
            </div>
            <ConfidenceBadge score={d.metrics.confidenceScore} />
          </div>
          {lowConfidence ? (
            <p className="rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-950 dark:text-amber-100">
              Thin data—treat metrics as directional.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className={cn("text-sm", contentPad)}>
          <div
            className={cn(
              "grid grid-cols-2 gap-3 rounded-xl border border-border/45 bg-muted/30 p-3.5 sm:grid-cols-3 dark:border-border/40 dark:bg-muted/20",
              embedded && "gap-2.5 p-3"
            )}
          >
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Median
              </p>
              <p className="mt-0.5 font-semibold tabular-nums">
                {formatTechPay(d.metrics.medianPay)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Average
              </p>
              <p className="mt-0.5 font-semibold tabular-nums">
                {formatTechPay(d.metrics.avgPay)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                P90
              </p>
              <p className="mt-0.5 font-semibold tabular-nums">
                {formatTechPay(d.metrics.payP90)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Active roles
              </p>
              <p className="mt-0.5 font-semibold tabular-nums">{d.metrics.activeJobs}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Fresh (7d)
              </p>
              <p className="mt-0.5 font-semibold tabular-nums">{d.metrics.freshJobs7d}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Saturation
              </p>
              <p className="mt-0.5 font-semibold tabular-nums">
                {d.metrics.competitionScore != null
                  ? formatScore(d.metrics.competitionScore)
                  : "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              size="default"
              variant="default"
              className="font-semibold shadow-sm"
              onClick={onCompare}
            >
              Compare
            </Button>
            <Button
              type="button"
              size="default"
              variant={watchlisted ? "secondary" : "outline"}
              className="font-medium"
              disabled={watchlistBusy}
              onClick={() => void onToggleWatchlist()}
            >
              {watchlisted ? "Saved" : "Save for later"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <MarketExplanationCard
        embedded={embedded}
        explanation={explainQuery.data?.explanation}
        isLoading={explainQuery.isLoading}
        cached={explainQuery.data?.cached}
        onFeedback={
          queryId
            ? (helpful) => {
                void postFeedback({
                  queryId,
                  regionId,
                  eventType: helpful ? "ai_helpful" : "ai_not_helpful",
                });
              }
            : undefined
        }
      />

      <Card className={cn(cardShell)}>
        <CardHeader className="space-y-0 border-b border-border/50 bg-muted/20 py-3 dark:border-border/45 dark:bg-muted/10 sm:py-3.5">
          <CardTitle className="text-sm font-semibold tracking-tight">Sample listings</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 text-sm sm:pt-3">
          {d.sampleJobs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No sample rows for this slice.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {d.sampleJobs.map((j) => (
                <li key={j.id} className="py-3 first:pt-0">
                  <p className="font-medium leading-snug">{j.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[j.facilityName, j.city, j.state].filter(Boolean).join(" · ") || "—"} ·{" "}
                    {formatTechPay(j.grossWeeklyPay)}
                  </p>
                  {j.listingUrl ? (
                    <a
                      href={j.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      View listing
                      <ExternalLink className="size-3 shrink-0" aria-hidden />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {hasRemotiveSamples ? (
            <p className="mt-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
              Some roles:{" "}
              <a
                href="https://remotive.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Remotive
              </a>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
