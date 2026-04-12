"use client";

import { ChevronDown, Loader2, Search } from "lucide-react";
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
import { InfoTip } from "@/components/ui/info-tip";
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
    <div className="filter-well shrink-0">
      <div className="mx-auto max-w-[1760px] px-4 py-3.5 sm:px-6 sm:py-4">
        {/* <p className="mb-2 hidden font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">
          Labor market query
        </p> */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <p className="text-xs font-medium text-muted-foreground sm:hidden">
            Search markets
          </p>
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2 sm:gap-3">
          <div className="flex shrink-0 items-center pb-1 sm:pb-1.5">
            <InfoTip label="How search works" side="bottom" align="start">
              Results are <span className="font-medium text-background">labor markets</span> (metros
              or remote regions), not single job listings. Adjust role, pay floor, and states, then
              run Search. Choose a market on the map or in the list and open the Details tab for pay,
              demand, sample roles, and optional AI summary.
            </InfoTip>
          </div>
          <div className="w-[min(100%,12rem)] shrink-0 sm:w-48">
            <Label htmlFor="specialty" className="label-product mb-1.5 block">
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
                className="h-10 w-full border-border/60 bg-background text-sm shadow-sm dark:bg-card"
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

          <div className="w-[5.5rem] shrink-0 sm:w-32">
            <Label htmlFor="minPay" className="label-product mb-1.5 block">
              Min $/yr
            </Label>
            <Input
              id="minPay"
              type="number"
              min={0}
              step={5000}
              placeholder="Any"
              title="Minimum annual salary (USD)"
              className="h-10 border-border/60 bg-background px-3 text-sm shadow-sm dark:bg-card"
              value={values.minPay}
              onChange={(e) => onChange({ ...values, minPay: e.target.value })}
            />
          </div>

          <div className="min-w-[8rem] flex-1 sm:max-w-[11rem]">
            <Label htmlFor="states" className="label-product mb-1.5 block">
              States <span className="font-normal normal-case tracking-normal opacity-70">(opt.)</span>
            </Label>
            <Input
              id="states"
              placeholder="CA, TX, NY"
              title="Comma-separated state codes"
              className="h-10 border-border/60 bg-background px-3 text-sm shadow-sm dark:bg-card"
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
                "h-10 gap-1.5 px-3.5 text-sm font-medium",
                advancedOpen && "border-primary/35 bg-primary/8 shadow-sm dark:bg-primary/12"
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
                className="absolute right-0 top-full z-[120] mt-2 flex w-[min(100vw-1.5rem,19rem)] flex-col gap-3.5 rounded-xl border border-border/50 bg-popover p-4 shadow-premium ring-1 ring-black/[0.04] dark:border-border/45 dark:bg-popover dark:ring-white/[0.06]"
                role="region"
                aria-label="Advanced filters"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="freshness" className="label-product">
                    Max listing age (days)
                  </Label>
                  <Input
                    id="freshness"
                    type="number"
                    min={1}
                    max={90}
                    placeholder="Any"
                    className="text-sm"
                    value={values.freshnessDays}
                    onChange={(e) => onChange({ ...values, freshnessDays: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="label-product">Rank by</Label>
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
                    <SelectTrigger className="text-sm" size="sm">
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
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:pl-2">
            <Button
              type="button"
              size="default"
              className="h-10 min-w-[7.5rem] gap-2 px-5 font-semibold shadow-md ring-1 ring-primary/15 transition-[box-shadow,transform] hover:shadow-lg hover:ring-primary/25 active:translate-y-px dark:ring-primary/25"
              onClick={onSubmit}
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Search className="size-4 opacity-90" aria-hidden />
              )}
              {isSearching ? "Searching" : "Search"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="default"
              className="h-10 px-3 text-sm text-muted-foreground hover:text-foreground"
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
