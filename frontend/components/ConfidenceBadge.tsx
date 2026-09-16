import React from "react";
import { ConfidenceCategory } from "@/lib/types";
import { getConfidenceBadgeColor } from "@/lib/utils";

interface ConfidenceBadgeProps {
  category: ConfidenceCategory;
  confidence: number;
}

export function ConfidenceBadge({ category, confidence }: ConfidenceBadgeProps) {
  const styles = getConfidenceBadgeColor(category);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles.bg} ${styles.text} ${styles.border}`}
      role="status"
      aria-label={`Confidence category: ${category}, score: ${(confidence * 100).toFixed(1)} percent`}
    >
      <span className={`h-2 w-2 rounded-full ${styles.dot}`} aria-hidden="true" />
      <span className="uppercase tracking-wider font-bold">{category} CONFIDENCE</span>
      <span className="text-zinc-400 dark:text-zinc-500 font-normal">|</span>
      <span>{(confidence * 100).toFixed(2)}%</span>
    </div>
  );
}
