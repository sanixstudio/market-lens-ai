"use client";

import { Sparkles } from "lucide-react";

/**
 * Top app bar: product identity only (filters live below).
 */
export function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border/60 bg-card/80 px-4 backdrop-blur-md sm:h-14 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/15 sm:size-9 dark:bg-primary/18"
          aria-hidden
        >
          <Sparkles className="size-4 sm:size-4.5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h1 className="font-heading text-base font-semibold tracking-tight sm:text-lg">
            <span className="text-gradient-brand">MarketLens</span>{" "}
            <span className="text-foreground">AI</span>
          </h1>
        </div>
      </div>
    </header>
  );
}
