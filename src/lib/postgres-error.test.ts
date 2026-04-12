import { describe, expect, it } from "vitest";
import {
  isNotNullViolation,
  isUndefinedColumn,
  isWatchlistSchemaDrift,
} from "./postgres-error";

describe("isWatchlistSchemaDrift", () => {
  it("detects undefined column (42703)", () => {
    expect(isWatchlistSchemaDrift({ code: "42703" })).toBe(true);
  });

  it("detects not-null on watchlist / anon_key", () => {
    const e = new Error('null value in column "anon_key"');
    (e as unknown as { code: string }).code = "23502";
    expect(isWatchlistSchemaDrift(e)).toBe(true);
  });

  it("ignores unrelated not-null violations", () => {
    const e = new Error('null value in column "title"');
    (e as unknown as { code: string }).code = "23502";
    expect(isWatchlistSchemaDrift(e)).toBe(false);
  });
});

describe("postgres helpers", () => {
  it("isUndefinedColumn", () => {
    expect(isUndefinedColumn({ code: "42703" })).toBe(true);
    expect(isUndefinedColumn({ code: "23502" })).toBe(false);
  });

  it("isNotNullViolation", () => {
    expect(isNotNullViolation({ code: "23502" })).toBe(true);
  });
});
