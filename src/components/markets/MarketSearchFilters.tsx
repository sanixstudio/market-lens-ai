"use client";

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
 * Compact filter toolbar: role, pay floor, geography, freshness, scoring preference.
 */
export function MarketSearchFilters({
  values,
  onChange,
  onSubmit,
  onReset,
  isSearching,
}: Props) {
  return (
    <header className="border-t border-border/50 bg-gradient-to-b from-muted/50 to-muted/25 dark:from-muted/20 dark:to-muted/10">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:py-5">
        <div className="mb-4 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-sm font-semibold tracking-tight text-foreground">
              Search criteria
            </h2>
            <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-muted-foreground">
              Tune role, pay floor, geography, and how rankings weight saturation vs
              activity. Salary filter uses annual USD (we match weekly pay on listings).
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-x-4 lg:gap-y-3">
          <div className="space-y-1.5 lg:col-span-3">
            <Label htmlFor="specialty" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Role / track
            </Label>
            <Select
              value={values.specialty}
              onValueChange={(specialty) => {
                if (specialty) onChange({ ...values, specialty });
              }}
            >
              <SelectTrigger
                id="specialty"
                className="h-9 w-full rounded-xl border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <SelectValue placeholder="Role / track" />
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

          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="minPay" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Min annual salary ($)
            </Label>
            <Input
              id="minPay"
              type="number"
              min={0}
              step={5000}
              placeholder="e.g. 150000"
              className="h-9 rounded-xl border-border/80 bg-card shadow-sm transition-shadow focus-visible:shadow-md"
              value={values.minPay}
              onChange={(e) => onChange({ ...values, minPay: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="states" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              States (comma codes)
            </Label>
            <Input
              id="states"
              placeholder="CA, AZ, TX"
              className="h-9 rounded-xl border-border/80 bg-card shadow-sm transition-shadow focus-visible:shadow-md"
              value={values.states}
              onChange={(e) => onChange({ ...values, states: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="freshness" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Freshness (days, max)
            </Label>
            <Input
              id="freshness"
              type="number"
              min={1}
              max={90}
              placeholder="Optional"
              className="h-9 rounded-xl border-border/80 bg-card shadow-sm transition-shadow focus-visible:shadow-md"
              value={values.freshnessDays}
              onChange={(e) => onChange({ ...values, freshnessDays: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 lg:col-span-3">
            <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Ranking preference
            </Label>
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
              <SelectTrigger className="h-9 w-full rounded-xl border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Favor lower saturation</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="high-opportunity">Favor active markets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 sm:col-span-2 lg:col-span-12 lg:justify-end">
            <Button
              type="button"
              size="lg"
              onClick={onSubmit}
              disabled={isSearching}
              className="min-w-36 rounded-xl"
            >
              {isSearching ? "Searching…" : "Run search"}
            </Button>
            <Button type="button" variant="outline" onClick={onReset} className="rounded-xl">
              Reset filters
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
