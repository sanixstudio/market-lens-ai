type LogLevel = "info" | "warn" | "error";

/**
 * Structured logs for ranking, AI, and cache (Section 17).
 */
export function logStructured(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown>
) {
  const line = JSON.stringify({ level, event, ts: new Date().toISOString(), ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
