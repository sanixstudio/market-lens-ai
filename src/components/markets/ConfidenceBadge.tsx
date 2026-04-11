"use client";

import { Badge } from "@/components/ui/badge";

/**
 * Surfaces data confidence for a market (Section 16 — low confidence state).
 */
export function ConfidenceBadge({ score }: { score: number }) {
  const level =
    score >= 0.65 ? "high" : score >= 0.45 ? "medium" : "low";
  const variant = level === "low" ? "outline" : "secondary";
  return (
    <Badge variant={variant} className="text-xs font-normal">
      Confidence: {level} ({Math.round(score * 100)}%)
    </Badge>
  );
}
