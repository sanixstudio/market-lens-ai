"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatScore, formatTechPay } from "@/lib/formatters";
import type { MarketDetailResponse } from "@/lib/schemas/market";
import type { ExplainMarketResponse } from "@/lib/schemas/ai-insight";
import { ExternalLink } from "lucide-react";
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
 * Selected zone metrics, sample jobs, compare/save actions, and async AI explanation.
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
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Zone details</CardTitle>
          <CardDescription>
            Select a market from the map or list to inspect pay, volume, samples, and
            grounded AI commentary.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loading market…</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-destructive">Could not load market</CardTitle>
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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">{d.regionName}</CardTitle>
            <ConfidenceBadge score={d.metrics.confidenceScore} />
          </div>
          <CardDescription>
            {d.specialty} · Opportunity {formatScore(d.metrics.opportunityScore)}
            {lowConfidence && (
              <span className="mt-2 block rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-950 dark:text-amber-100">
                Limited data: interpret metrics cautiously; sample size or pay reporting
                may be thin.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-xs text-muted-foreground">
            Compensation shown as weekly equivalent (FTE annual ÷ 52) when sourced from
            salary fields.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground">Median comp</p>
              <p className="font-medium">{formatTechPay(d.metrics.medianPay)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg comp</p>
              <p className="font-medium">{formatTechPay(d.metrics.avgPay)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">P90 comp</p>
              <p className="font-medium">{formatTechPay(d.metrics.payP90)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active / fresh (7d)</p>
              <p className="font-medium">
                {d.metrics.activeJobs} / {d.metrics.freshJobs7d}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Saturation proxy</p>
              <p className="font-medium">
                {d.metrics.competitionScore != null
                  ? formatScore(d.metrics.competitionScore)
                  : "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={onCompare}>
              Compare markets
            </Button>
            <Button
              type="button"
              variant="outline"
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
              Save market
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent roles (sample)</CardTitle>
          <CardDescription>Open listings in this zone for the selected track</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {d.sampleJobs.length === 0 ? (
            <p className="text-muted-foreground">No sample rows returned.</p>
          ) : (
            d.sampleJobs.map((j) => (
              <div key={j.id}>
                <p className="font-medium">{j.title}</p>
                <p className="text-muted-foreground">
                  {[j.facilityName, j.city, j.state].filter(Boolean).join(" · ") ||
                    "—"}{" "}
                  · {formatTechPay(j.grossWeeklyPay)}
                </p>
                {j.listingUrl ? (
                  <a
                    href={j.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View listing
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>
                ) : null}
                <Separator className="mt-2" />
              </div>
            ))
          )}
          {hasRemotiveSamples ? (
            <p className="text-xs text-muted-foreground">
              Sample roles include listings from{" "}
              <a
                href="https://remotive.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Remotive
              </a>
              ; apply on their site.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
