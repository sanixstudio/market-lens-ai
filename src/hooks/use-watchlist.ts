"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

/**
 * Clerk-scoped saved markets. Reads/writes only when `userId` is present; otherwise `items` is empty.
 */
export function useWatchlist() {
  const queryClient = useQueryClient();
  const { isLoaded, userId } = useAuth();
  const enabled = isLoaded && !!userId;

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
