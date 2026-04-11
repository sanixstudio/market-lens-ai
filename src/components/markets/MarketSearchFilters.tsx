"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CompetitionPreference } from "@/lib/schemas/market";

export type FilterValues = {
  specialty: string;
  minPay: string;
  states: string;
  freshnessDays: string;
  competitionPreference: CompetitionPreference;
};

const ROLE_TRACKS = [
  "Software Engineer",
  "Data & ML",
  "DevOps / SRE",
] as const;

type Props = {
  values: FilterValues;
  onChange: (next: FilterValues) => void;
  onSubmit: () => void;
  onReset: () => void;
  isSearching: boolean;
};

/**
 * Single primary row + optional advanced (freshness, ranking weight).
 */
export function MarketSearchFilters({
  values,
  onChange,
  onSubmit,
  onReset,
  isSearching,
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const advancedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!advancedOpen) return;
    const close = (e: MouseEvent) => {
      if (advancedRef.current?.contains(e.target as Node)) return;
      setAdvancedOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [advancedOpen]);

  return (
    <div className="shrink-0 border-b border-border/50 bg-muted/25 dark:bg-muted/15">
      <div className="mx-auto max-w-[1600px] px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-end gap-2 sm:gap-2.5">
          <div className="w-[min(100%,11rem)] shrink-0 sm:w-44">
            <Label htmlFor="specialty" className="sr-only">
              Role
            </Label>
            <Select
              value={values.specialty}
              onValueChange={(specialty) => {
                if (specialty) onChange({ ...values, specialty });
              }}
            >
              <SelectTrigger
                id="specialty"
                className="h-8 w-full rounded-lg border-border/70 bg-card text-xs sm:h-9 sm:text-sm"
              >
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_TRACKS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-24 shrink-0 sm:w-28">
            <Label htmlFor="minPay" className="sr-only">
              Min annual salary
            </Label>
            <Input
              id="minPay"
              type="number"
              min={0}
              step={5000}
              placeholder="Min $/yr"
              title="Minimum annual salary (USD)"
              className="h-8 rounded-lg border-border/70 bg-card px-2 text-xs sm:h-9 sm:px-2.5 sm:text-sm"
              value={values.minPay}
              onChange={(e) => onChange({ ...values, minPay: e.target.value })}
            />
          </div>

          <div className="min-w-24 flex-1 sm:max-w-40">
            <Label htmlFor="states" className="sr-only">
              States
            </Label>
            <Input
              id="states"
              placeholder="States e.g. CA,TX"
              title="Comma-separated state codes"
              className="h-8 rounded-lg border-border/70 bg-card px-2 text-xs sm:h-9 sm:text-sm"
              value={values.states}
              onChange={(e) => onChange({ ...values, states: e.target.value })}
            />
          </div>

          <div className="relative" ref={advancedRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-expanded={advancedOpen}
              className={cn(
                "h-8 gap-1 rounded-lg px-2.5 text-xs sm:h-9",
                advancedOpen && "border-primary/40 bg-primary/5"
              )}
              onClick={() => setAdvancedOpen((o) => !o)}
            >
              More
              <ChevronDown
                className={cn("size-3.5 transition-transform", advancedOpen && "rotate-180")}
                aria-hidden
              />
            </Button>
            {advancedOpen ? (
              <div
                className="absolute right-0 top-full z-30 mt-1 flex w-[min(100vw-1.5rem,18rem)] flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-3 shadow-lg dark:shadow-black/40"
                role="region"
                aria-label="Advanced filters"
              >
                <div className="space-y-1">
                  <Label htmlFor="freshness" className="text-[11px] text-muted-foreground">
                    Max listing age (days)
                  </Label>
                  <Input
                    id="freshness"
                    type="number"
                    min={1}
                    max={90}
                    placeholder="Any"
                    className="h-8 rounded-lg text-sm"
                    value={values.freshnessDays}
                    onChange={(e) => onChange({ ...values, freshnessDays: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Rank by</Label>
                  <Select
                    value={values.competitionPreference}
                    onValueChange={(competitionPreference) => {
                      if (!competitionPreference) return;
                      onChange({
                        ...values,
                        competitionPreference: competitionPreference as CompetitionPreference,
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Less saturated markets</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="high-opportunity">More active markets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-lg px-4 sm:h-9"
              onClick={onSubmit}
              disabled={isSearching}
            >
              {isSearching ? "…" : "Search"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground sm:h-9"
              onClick={onReset}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
