"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { InfoTip } from "@/components/ui/info-tip";

type Props = {
  /** Toolbar actions (e.g. saved list, copy link). */
  actions?: ReactNode;
};

/**
 * Top app bar: brand, positioning line, contextual help.
 */
export function AppHeader({ actions }: Props) {
  return (
    <header className="chrome-glass shrink-0">
      <div className="mx-auto flex min-h-14 w-full max-w-[1760px] items-center gap-4 px-4 py-3 sm:min-h-[3.75rem] sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-sm ring-1 ring-primary/10 dark:from-primary/25 dark:to-primary/10 dark:ring-primary/20 sm:size-11"
            aria-hidden
          >
            <Sparkles className="size-5 sm:size-[1.35rem]" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                <span className="text-gradient-brand">MarketLens</span>
              </h1>
              <span className="rounded-md border border-primary/15 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary dark:border-primary/25 dark:bg-primary/15">
                AI
              </span>
              <InfoTip
                label="What MarketLens does"
                side="bottom"
                align="start"
                className="size-7 shrink-0 sm:size-8"
              >
                MarketLens ranks{" "}
                <span className="font-medium text-background">labor markets</span> (metros and
                remote regions) for tech roles—not individual job posts. Search with filters, pick a
                market on the map or list, then open Details for pay, demand, samples, and optional
                AI context.
              </InfoTip>
            </div>
            <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
              Labor market intelligence for technology roles
            </p>
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
