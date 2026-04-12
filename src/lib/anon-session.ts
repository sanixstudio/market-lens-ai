/** localStorage key for anonymous watchlist / future account linking */
export const ANON_STORAGE_KEY = "marketlens_anon_id";

/** Request header clients send on watchlist API routes */
export const ANON_HEADER = "x-marketlens-anon";

/**
 * Stable anonymous id for this browser (no auth). Safe to call only on the client.
 */
export function getOrCreateAnonId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    let id = window.localStorage.getItem(ANON_STORAGE_KEY);
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      id = crypto.randomUUID();
      window.localStorage.setItem(ANON_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}
