"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
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
import { ConfidenceBadge } from "./ConfidenceBadge";
import { MarketExplanationCard } from "./MarketExplanationCard";

type Props = {
  regionId: string | null;
  specialty: string;
  queryId: string | null;
  onCompare: () => void;
  onSave: () => void;
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
  onSave,
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

  if (!regionId) {
    return (
      <Card className="rounded-2xl border-dashed border-primary/20 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold tracking-tight">Selection</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Choose a market from the map or the ranked list to see pay breakdowns, sample
            roles, and an AI summary grounded in these metrics.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <Card className="rounded-2xl shadow-premium">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Loading…</CardTitle>
          <CardDescription className="text-xs">Fetching market detail</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <Card className="rounded-2xl border-destructive/35 shadow-premium">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-destructive">
            Could not load market
          </CardTitle>
          <CardDescription className="text-xs">Try selecting the region again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const d = detailQuery.data;
  const lowConfidence = d.metrics.confidenceScore < 0.45;
  const hasRemotiveSamples = d.sampleJobs.some((j) =>
    j.listingUrl?.includes("remotive.com")
  );

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <Card className="rounded-2xl shadow-premium">
        <CardHeader className="space-y-2 border-b border-border/50 bg-muted/10 pb-3.5 dark:bg-muted/5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold leading-tight">
                {d.regionName}
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                {d.specialty} · Opportunity score {formatScore(d.metrics.opportunityScore)}
              </CardDescription>
            </div>
            <ConfidenceBadge score={d.metrics.confidenceScore} />
          </div>
          {lowConfidence ? (
            <p className="rounded-md bg-amber-500/10 px-2.5 py-2 text-xs text-amber-950 dark:text-amber-100">
              Limited data for this bucket—use metrics as directional only.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm">
          <p className="text-xs text-muted-foreground">
            Compensation is weekly equivalent (FTE annual ÷ 52) when salary text was
            available on listings.
          </p>
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/50 bg-gradient-to-br from-muted/50 to-muted/25 p-3.5 sm:grid-cols-3 dark:from-muted/30 dark:to-muted/10">
            <div>
              <p className="text-xs text-muted-foreground">Median</p>
              <p className="mt-0.5 font-semibold tabular-nums">
                {formatTechPay(d.metrics.medianPay)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="mt-0.5 font-semibold tabular-nums">
                {formatTechPay(d.metrics.avgPay)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">P90</p>
              <p className="mt-0.5 font-semibold tabular-nums">
                {formatTechPay(d.metrics.payP90)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active roles</p>
              <p className="mt-0.5 font-semibold tabular-nums">{d.metrics.activeJobs}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fresh (7d)</p>
              <p className="mt-0.5 font-semibold tabular-nums">{d.metrics.freshJobs7d}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saturation proxy</p>
              <p className="mt-0.5 font-semibold tabular-nums">
                {d.metrics.competitionScore != null
                  ? formatScore(d.metrics.competitionScore)
                  : "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-xl"
              onClick={onCompare}
            >
              Compare with another market
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                onSave();
                if (queryId) {
                  void postFeedback({
                    queryId,
                    regionId,
                    eventType: "market_saved",
                  });
                }
              }}
            >
              Save for later
            </Button>
          </div>
        </CardContent>
      </Card>

      <MarketExplanationCard
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

      <Card className="rounded-2xl shadow-premium">
        <CardHeader className="border-b border-border/50 bg-muted/10 py-3.5 dark:bg-muted/5">
          <CardTitle className="text-sm font-semibold tracking-tight">Sample listings</CardTitle>
          <CardDescription className="text-xs">
            Recent roles in this region for {d.specialty}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3 text-sm">
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
            <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
              Some links via{" "}
              <a
                href="https://remotive.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Remotive
              </a>
              — apply on their site.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
