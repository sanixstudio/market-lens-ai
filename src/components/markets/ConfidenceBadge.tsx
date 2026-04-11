"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Data-confidence pill: color aligns with signal strength for the market slice.
 */
export function ConfidenceBadge({ score }: { score: number }) {
  const level = score >= 0.65 ? "high" : score >= 0.45 ? "medium" : "low";
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        level === "high" &&
          "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100",
        level === "medium" &&
          "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:border-amber-400/35 dark:bg-amber-500/15 dark:text-amber-100",
        level === "low" &&
          "border-border bg-muted/50 text-muted-foreground dark:bg-muted/30"
      )}
    >
      {level} · {Math.round(score * 100)}%
    </Badge>
  );
}
