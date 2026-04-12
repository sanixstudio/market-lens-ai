"use client";

import type { ReactNode } from "react";
import { SignInButton, useAuth, UserButton } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { InfoTip } from "@/components/ui/info-tip";
import { Separator } from "@/components/ui/separator";

type Props = {
  /** View tools first: e.g. saved markets, copy link. */
  primaryActions?: ReactNode;
  /** App chrome before account: e.g. theme toggle. */
  utilityActions?: ReactNode;
};

function ToolbarRule() {
  return (
    <Separator
      orientation="vertical"
      className="hidden h-6 shrink-0 sm:mx-0.5 sm:block"
      aria-hidden
    />
  );
}

function HeaderAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <span className="inline-block h-9 w-20 shrink-0 rounded-lg bg-muted/40" aria-hidden />;
  }

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <SignInButton mode="modal">
      <button
        type="button"
        className="h-9 rounded-lg border border-border/60 bg-background px-3 text-xs font-medium text-foreground shadow-sm ring-1 ring-black/[0.03] transition-colors hover:bg-muted/80 sm:h-10 sm:text-sm dark:border-border/50 dark:ring-white/[0.05]"
      >
        Sign in
      </button>
    </SignInButton>
  );
}

/**
 * Top app bar: brand (left); toolbar on the right in order
 * **Saved → Copy link** | **theme** | **account** (with rules between groups).
 */
export function AppHeader({ primaryActions, utilityActions }: Props) {
  const hasPrimary = primaryActions != null;
  const hasUtility = utilityActions != null;
  const showRuleBeforeUtility = hasPrimary && hasUtility;
  const showRuleBeforeAccount = hasPrimary || hasUtility;

  return (
    <header className="chrome-glass shrink-0">
      <div className="mx-auto flex min-h-14 w-full max-w-[1760px] items-center gap-4 px-4 py-3 sm:min-h-[3.75rem] sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/18 via-primary/10 to-primary/5 text-primary shadow-premium ring-1 ring-primary/12 dark:from-primary/28 dark:via-primary/15 dark:to-primary/8 dark:ring-primary/25 sm:size-11"
            aria-hidden
          >
            {/* <Sparkles className="size-5 sm:size-[1.35rem]" strokeWidth={1.5} /> */}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                <span className="text-gradient-brand">MarketLens</span>
              </h1>
              <span className="rounded-md border border-primary/20 bg-gradient-to-b from-primary/10 to-primary/6 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary shadow-sm dark:border-primary/30 dark:from-primary/18 dark:to-primary/10">
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
            <p className="mt-0.5 hidden text-xs font-medium tracking-wide text-muted-foreground/90 sm:block">
              Labor market intelligence for technology roles
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:flex-nowrap sm:items-center sm:gap-0">
          {hasPrimary ? (
            <div className="flex flex-wrap items-center justify-end gap-2">{primaryActions}</div>
          ) : null}
          {showRuleBeforeUtility ? <ToolbarRule /> : null}
          {hasUtility ? (
            <div className="flex flex-wrap items-center justify-end gap-2 sm:px-0.5">{utilityActions}</div>
          ) : null}
          {showRuleBeforeAccount ? <ToolbarRule /> : null}
          <div className="flex items-center sm:pl-0.5">
            <HeaderAuth />
          </div>
        </div>
      </div>
    </header>
  );
}
