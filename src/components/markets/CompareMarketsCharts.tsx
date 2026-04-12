"use client";

import type { CompareMarketsResponse } from "@/lib/schemas/ai-insight";
import { barPercent, buildCompareChartRows, rowMax } from "@/lib/compare-chart-metrics";
import { cn } from "@/lib/utils";

type Props = {
  comparison: CompareMarketsResponse["comparison"];
};

const BAR_COLORS = ["bg-chart-1", "bg-chart-2"] as const;

/**
 * Paired horizontal bars: each metric is scaled to the larger value in this
 * two-market compare so differences pop without a charting library.
 */
export function CompareMarketsCharts({ comparison }: Props) {
  if (comparison.length !== 2) return null;

  const [a, b] = comparison;
  const rows = buildCompareChartRows(comparison);

  return (
    <section
      className="rounded-xl border border-border/50 bg-muted/20 p-4 dark:border-border/40 dark:bg-muted/10"
      aria-label="Comparison chart"
    >
      <h3 className="font-heading text-sm font-semibold text-foreground">At a glance</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        Each row uses the <span className="font-medium text-foreground/90">stronger market on that metric</span>{" "}
        as 100% width so you can scan tradeoffs quickly. This is relative to this pair only—not all metros.
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-b border-border/40 pb-3 text-[11px] dark:border-border/30">
        <span className="flex min-w-0 max-w-[48%] items-center gap-2 sm:max-w-none">
          <span className={cn("size-2.5 shrink-0 rounded-sm", BAR_COLORS[0])} aria-hidden />
          <span className="truncate font-medium text-foreground" title={a.regionName}>
            {a.regionName}
          </span>
          <span className="shrink-0 text-muted-foreground">(baseline)</span>
        </span>
        <span className="flex min-w-0 max-w-[48%] items-center gap-2 sm:max-w-none">
          <span className={cn("size-2.5 shrink-0 rounded-sm", BAR_COLORS[1])} aria-hidden />
          <span className="truncate font-medium text-foreground" title={b.regionName}>
            {b.regionName}
          </span>
        </span>
      </div>

      <ul className="mt-3 space-y-3.5">
        {rows.map((row) => {
          const max = rowMax(row);
          return (
            <li key={row.id}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {row.label}
                </span>
              </div>
              <p className="sr-only">{row.description}</p>
              <div className="mt-1.5 space-y-1.5">
                {[0, 1].map((i) => {
                  const v = row.values[i];
                  const pct = barPercent(v, max);
                  const name = i === 0 ? a.regionName : b.regionName;
                  return (
                    <div key={i} className="flex items-center gap-2 sm:gap-3">
                      <div
                        className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/80 dark:bg-muted/50"
                        role="presentation"
                      >
                        <div
                          className={cn(
                            "h-full rounded-full transition-[width] duration-500 ease-out",
                            BAR_COLORS[i]
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span
                        className="w-[5.5rem] shrink-0 text-right text-xs tabular-nums text-foreground sm:w-32"
                        title={`${name}: ${row.display[i]}`}
                      >
                        {row.display[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
