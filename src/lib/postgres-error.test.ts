import { describe, expect, it } from "vitest";
import {
  getPostgresErrorCode,
  isOnConflictTargetMissing,
  isRelationUndefined,
} from "./postgres-error";

describe("postgres-error", () => {
  it("reads code from nested cause", () => {
    const inner = { code: "42P01", message: "relation missing" };
    const outer = new Error("wrapper", { cause: inner });
    expect(getPostgresErrorCode(outer)).toBe("42P01");
    expect(isRelationUndefined(outer)).toBe(true);
  });

  it("detects ON CONFLICT target missing from message", () => {
    const err = new Error(
      "there is no unique or exclusion constraint matching the ON CONFLICT specification"
    );
    expect(isOnConflictTargetMissing(err)).toBe(true);
  });
});
