import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingWatchlistRegion,
  peekPendingWatchlistRegion,
  setPendingWatchlistRegion,
} from "./pending-watchlist-save";

function mockSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
  });
}

describe("pending-watchlist-save", () => {
  beforeEach(() => {
    mockSessionStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores, peeks, and clears one region id", () => {
    setPendingWatchlistRegion("region-a");
    expect(peekPendingWatchlistRegion()).toBe("region-a");
    clearPendingWatchlistRegion();
    expect(peekPendingWatchlistRegion()).toBeNull();
  });

  it("overwrites pending with latest region", () => {
    setPendingWatchlistRegion("first");
    setPendingWatchlistRegion("second");
    expect(peekPendingWatchlistRegion()).toBe("second");
  });
});
