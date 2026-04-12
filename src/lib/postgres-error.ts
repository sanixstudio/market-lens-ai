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

/** SQLSTATE 42703 — undefined column (e.g. `clerk_user_id` before migration). */
export function isUndefinedColumn(error: unknown): boolean {
  return getPostgresErrorCode(error) === "42703";
}

/** SQLSTATE 23514 — check constraint (e.g. `watchlist_items_owner_oneof`). */
export function isCheckViolation(error: unknown): boolean {
  return getPostgresErrorCode(error) === "23514";
}

/**
 * SQLSTATE 23502 — not-null violation, often `anon_key` still NOT NULL while inserting Clerk rows.
 */
export function isNotNullViolation(error: unknown): boolean {
  return getPostgresErrorCode(error) === "23502";
}

function collectErrorText(error: unknown, maxDepth = 8): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let d = 0; d < maxDepth && current != null; d++) {
    if (current instanceof Error && current.message) {
      parts.push(current.message);
    }
    if (typeof current === "object" && current !== null && "detail" in current) {
      const detail = (current as { detail?: unknown }).detail;
      if (typeof detail === "string") parts.push(detail);
    }
    if (typeof current === "object" && current !== null && "cause" in current) {
      current = (current as { cause: unknown }).cause;
      continue;
    }
    break;
  }
  return parts.join(" ");
}

/**
 * Watchlist Clerk migration (`0003_watchlist_clerk_user`) not applied or partially applied.
 */
export function isWatchlistSchemaDrift(error: unknown): boolean {
  if (isUndefinedColumn(error) || isCheckViolation(error)) {
    return true;
  }
  if (!isNotNullViolation(error)) {
    return false;
  }
  const blob = collectErrorText(error);
  return /watchlist_items|anon_key|clerk_user_id/i.test(blob);
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
