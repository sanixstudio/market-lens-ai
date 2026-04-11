"use client";

import { Sparkles } from "lucide-react";

/**
 * Top app bar: product identity only (filters live below).
 */
export function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border/40 bg-card px-4 sm:h-14 sm:px-6 dark:border-border/40">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10 dark:bg-primary/15"
          aria-hidden
        >
          <Sparkles className="size-[1.125rem] sm:size-5" strokeWidth={1.65} />
        </div>
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-baseline gap-x-2 gap-y-0 font-heading text-[1.0625rem] font-semibold tracking-tight sm:text-lg">
            <span className="text-gradient-brand">MarketLens</span>
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-primary dark:bg-primary/20 dark:text-primary">
              AI
            </span>
          </h1>
        </div>
      </div>
    </header>
  );
}
