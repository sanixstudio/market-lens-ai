/**
 * Walks `Error.cause` chains (postgres-js / Drizzle) to read PostgreSQL `code`.
 */
export function getPostgresErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 8 && current != null; depth += 1) {
    if (
      typeof current === "object" &&
      current !== null &&
      "code" in current &&
      typeof (current as { code: unknown }).code === "string"
    ) {
      const c = (current as { code: string }).code;
      if (c) return c;
    }
    if (typeof current === "object" && current !== null && "cause" in current) {
      current = (current as { cause: unknown }).cause;
      continue;
    }
    break;
  }
  return undefined;
}

/** SQLSTATE 42P01 — relation does not exist (migrations not applied). */
export function isRelationUndefined(error: unknown): boolean {
  return getPostgresErrorCode(error) === "42P01";
}

/**
 * INSERT ... ON CONFLICT is invalid when no matching unique constraint/index exists.
 * SQLSTATE is often 42P10; message check covers driver/version differences.
 */
export function isOnConflictTargetMissing(error: unknown): boolean {
  if (getPostgresErrorCode(error) === "42P10") return true;
  const msg = error instanceof Error ? error.message : String(error);
  return /no unique or exclusion constraint matching the ON CONFLICT/i.test(msg);
}
