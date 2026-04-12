"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startTransition, useEffect, useState } from "react";
import { ANON_HEADER, getOrCreateAnonId } from "@/lib/anon-session";

export type WatchlistRow = {
  regionId: string;
  regionName: string;
  createdAt: string;
};

async function fetchWatchlist(anonId: string): Promise<WatchlistRow[]> {
  const res = await fetch("/api/watchlist", {
    headers: { [ANON_HEADER]: anonId },
  });
  if (!res.ok) throw new Error("Failed to load watchlist");
  const data = (await res.json()) as { items: WatchlistRow[] };
  return data.items ?? [];
}

async function postWatchlist(anonId: string, regionId: string): Promise<void> {
  const res = await fetch("/api/watchlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [ANON_HEADER]: anonId,
    },
    body: JSON.stringify({ regionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Save failed");
  }
}

async function deleteWatchlist(anonId: string, regionId: string): Promise<void> {
  const res = await fetch(
    `/api/watchlist?regionId=${encodeURIComponent(regionId)}`,
    {
      method: "DELETE",
      headers: { [ANON_HEADER]: anonId },
    }
  );
  if (!res.ok) throw new Error("Remove failed");
}

export function useWatchlist() {
  const queryClient = useQueryClient();
  const [anonId, setAnonId] = useState("");

  useEffect(() => {
    startTransition(() => {
      setAnonId(getOrCreateAnonId());
    });
  }, []);

  const listQuery = useQuery({
    queryKey: ["watchlist", anonId],
    queryFn: () => fetchWatchlist(anonId),
    enabled: !!anonId,
  });

  const add = useMutation({
    mutationFn: (regionId: string) => postWatchlist(anonId, regionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["watchlist", anonId] });
    },
  });

  const remove = useMutation({
    mutationFn: (regionId: string) => deleteWatchlist(anonId, regionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["watchlist", anonId] });
    },
  });

  const ids = new Set((listQuery.data ?? []).map((i) => i.regionId));

  return {
    items: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    isSaving: add.isPending,
    isRemoving: remove.isPending,
    watchlistBusy: add.isPending || remove.isPending,
    hasAnon: !!anonId,
    isWatchlisted: (regionId: string | null) =>
      !!regionId && ids.has(regionId),
    add: add.mutateAsync,
    remove: remove.mutateAsync,
  };
}
