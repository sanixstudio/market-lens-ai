/**
 * Holds a single region the user chose to save while signed out. Survives refresh
 * in the same tab; cleared after a successful server save or explicitly.
 */
const STORAGE_KEY = "marketlens_pending_watchlist_region";

function getSessionStorage(): Storage | null {
  if (typeof globalThis === "undefined") return null;
  try {
    const s = globalThis.sessionStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

/**
 * Remember this region to POST to `/api/watchlist` after Clerk sign-in completes.
 * Overwrites any previous pending save (latest click wins).
 */
export function setPendingWatchlistRegion(regionId: string): void {
  const s = getSessionStorage();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, regionId);
  } catch {
    /* quota / private mode */
  }
}

/** Read pending id without removing it. */
export function peekPendingWatchlistRegion(): string | null {
  const s = getSessionStorage();
  if (!s) return null;
  try {
    const v = s.getItem(STORAGE_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function clearPendingWatchlistRegion(): void {
  const s = getSessionStorage();
  if (!s) return;
  try {
    s.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
