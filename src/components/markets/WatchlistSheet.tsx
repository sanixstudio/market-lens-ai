"use client";

import { Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WatchlistRow } from "@/hooks/use-watchlist";

type Props = {
  items: WatchlistRow[];
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenMarket: (regionId: string) => void;
  onRemove: (regionId: string) => void | Promise<void>;
};

/** Opens the saved-markets drawer (controlled). Pair with `WatchlistOpenButton`. */
export function WatchlistSheet({
  items,
  isLoading,
  open,
  onOpenChange,
  onOpenMarket,
  onRemove,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[min(100vw-1rem,22rem)] flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/50 px-4 py-4 text-left">
          <SheetTitle className="font-heading text-base">Saved markets</SheetTitle>
          <p className="text-xs font-normal text-muted-foreground">
            Tied to your signed-in account. Sign in from the header to save or view this list.
          </p>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-3">
            {isLoading ? (
              <p className="px-1 py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-1 py-8 text-center text-sm leading-relaxed text-muted-foreground">
                Save a market from the Details tab. Copy link shares your filters and selected
                region.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((row) => (
                  <li
                    key={row.regionId}
                    className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 p-2 dark:border-border/45 dark:bg-muted/10"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                      onClick={() => {
                        onOpenMarket(row.regionId);
                        onOpenChange(false);
                      }}
                    >
                      {row.regionName}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${row.regionName}`}
                      onClick={() => onRemove(row.regionId)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function WatchlistOpenButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 gap-1.5 border-border/60 px-3 text-xs font-medium shadow-sm sm:h-10 sm:text-sm"
      aria-label={`Saved markets${count ? `, ${count} items` : ""}`}
      onClick={onClick}
    >
      <Bookmark className="size-3.5 sm:size-4" strokeWidth={2} aria-hidden />
      <span>Saved</span>
      {count > 0 ? (
        <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary dark:bg-primary/20">
          {count}
        </span>
      ) : null}
    </Button>
  );
}
