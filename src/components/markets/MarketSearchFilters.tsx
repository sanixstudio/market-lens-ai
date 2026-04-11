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
 * Top-bar filters for tech role track, salary floor, states, freshness, and competition preference.
 */
export function MarketSearchFilters({
  values,
  onChange,
  onSubmit,
  onReset,
  isSearching,
}: Props) {
  return (
    <header className="flex flex-col gap-4 border-b border-border bg-card/50 p-4 md:flex-row md:flex-wrap md:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="specialty">Role / track</Label>
        <Select
          value={values.specialty}
          onValueChange={(specialty) => {
            if (specialty) onChange({ ...values, specialty });
          }}
        >
          <SelectTrigger id="specialty" className="w-[220px]">
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
      <div className="space-y-1.5">
        <Label htmlFor="minPay">Min annual salary ($)</Label>
        <Input
          id="minPay"
          type="number"
          min={0}
          step={5000}
          placeholder="e.g. 150000"
          className="w-[160px]"
          value={values.minPay}
          onChange={(e) => onChange({ ...values, minPay: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Converted to weekly (÷52) for filtering listings.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="states">States (comma codes)</Label>
        <Input
          id="states"
          placeholder="CA,AZ,TX"
          className="w-[180px]"
          value={values.states}
          onChange={(e) => onChange({ ...values, states: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="freshness">Freshness (days)</Label>
        <Input
          id="freshness"
          type="number"
          min={1}
          max={90}
          placeholder="optional"
          className="w-[120px]"
          value={values.freshnessDays}
          onChange={(e) => onChange({ ...values, freshnessDays: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Competition preference</Label>
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
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Favor lower saturation</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="high-opportunity">Favor active markets</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={onSubmit} disabled={isSearching}>
          {isSearching ? "Searching…" : "Search markets"}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>
    </header>
  );
}
