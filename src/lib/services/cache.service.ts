/**
 * DB-backed AI insight cache (Section 14). Thin facade over the repository.
 */
export {
  findValidAiCache,
  upsertAiCache,
} from "@/lib/repositories/ai-cache.repository";
