"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  clearPendingWatchlistRegion,
  peekPendingWatchlistRegion,
} from "@/lib/pending-watchlist-save";

export type WatchlistRow = {
  regionId: string;
  regionName: string;
  createdAt: string;
};

async function fetchWatchlist(): Promise<WatchlistRow[]> {
  const res = await fetch("/api/watchlist");
  if (!res.ok) throw new Error("Failed to load watchlist");
  const data = (await res.json()) as { items: WatchlistRow[] };
  return data.items ?? [];
}

async function postWatchlist(regionId: string): Promise<void> {
  const res = await fetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ regionId }),
  });
  if (res.status === 401) {
    throw new Error("SIGN_IN_REQUIRED");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Save failed");
  }
}

async function deleteWatchlist(regionId: string): Promise<void> {
  const res = await fetch(`/api/watchlist?regionId=${encodeURIComponent(regionId)}`, {
    method: "DELETE",
  });
  if (res.status === 401) {
    throw new Error("SIGN_IN_REQUIRED");
  }
  if (!res.ok) throw new Error("Remove failed");
}

export type UseWatchlistOptions = {
  /** Called after a deferred save (post sign-in) succeeds. */
  onPendingSaveFlushed?: (regionId: string) => void;
};

/**
 * Clerk-scoped saved markets. Reads/writes only when `userId` is present; otherwise `items` is empty.
 * Flushes `sessionStorage` pending region once the user is signed in.
 */
export function useWatchlist(options?: UseWatchlistOptions) {
  const queryClient = useQueryClient();
  const { isLoaded, userId } = useAuth();
  const enabled = isLoaded && !!userId;
  const onPendingSaveFlushedRef = useRef(options?.onPendingSaveFlushed);
  onPendingSaveFlushedRef.current = options?.onPendingSaveFlushed;
  const flushInFlightRef = useRef(false);

  const listQuery = useQuery({
    queryKey: ["watchlist", userId],
    queryFn: fetchWatchlist,
    enabled,
  });

  const add = useMutation({
    mutationFn: postWatchlist,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["watchlist", userId] });
    },
  });

  const remove = useMutation({
    mutationFn: deleteWatchlist,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["watchlist", userId] });
    },
  });

  useEffect(() => {
    if (!isLoaded || !userId) return;
    const regionId = peekPendingWatchlistRegion();
    if (!regionId || flushInFlightRef.current) return;

    flushInFlightRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        await postWatchlist(regionId);
        if (cancelled) return;
        clearPendingWatchlistRegion();
        await queryClient.invalidateQueries({ queryKey: ["watchlist", userId] });
        toast.success("Saved for later", {
          description: "Added after you signed in.",
        });
        onPendingSaveFlushedRef.current?.(regionId);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Save failed";
        toast.error("Couldn’t save your market", {
          description: msg === "SIGN_IN_REQUIRED" ? "Please sign in again." : msg,
        });
      } finally {
        flushInFlightRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      flushInFlightRef.current = false;
    };
  }, [isLoaded, userId, queryClient]);

  const items = userId ? (listQuery.data ?? []) : [];
  const ids = new Set(items.map((i) => i.regionId));

  return {
    items,
    isLoading: enabled && listQuery.isLoading,
    isSaving: add.isPending,
    isRemoving: remove.isPending,
    watchlistBusy: add.isPending || remove.isPending,
    isSignedInWatchlist: !!userId,
    isWatchlisted: (regionId: string | null) => !!regionId && ids.has(regionId),
    add: add.mutateAsync,
    remove: remove.mutateAsync,
  };
}
