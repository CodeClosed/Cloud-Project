import React from "react";
import { ClassificationResult as IClassificationResult } from "@/lib/types";
import { formatClassName } from "@/lib/utils";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Stethoscope, Info } from "lucide-react";

interface ClassificationResultProps {
  data: IClassificationResult;
}

export function ClassificationResult({ data }: ClassificationResultProps) {
  const formattedClass = formatClassName(data.predicted_class);

  const getPolicyExplanation = (category: string) => {
    switch (category.toLowerCase()) {
      case "high":
        return "High model confidence (≥ 90%). Indicates strong statistical pattern certainty. Does not constitute guaranteed diagnostic correctness.";
      case "moderate":
        return "Moderate model confidence (70% – 90%). Indicates meaningful uncertainty. Recommended for expert radiologist review.";
      case "low":
      default:
        return "Low model confidence (< 70%). High classification uncertainty. Prediction must be interpreted with extreme caution.";
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Primary Diagnostic Prediction
            </h3>
            <span className="text-[11px] text-zinc-400">Model: EfficientNetB0 (Full-field X-ray)</span>
          </div>
        </div>

        <ConfidenceBadge category={data.confidence_category} confidence={data.confidence} />
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Detected Condition</span>
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mt-0.5">
            {formattedClass}
          </div>
        </div>

        <div className="sm:text-right">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prediction Confidence</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
            {(data.confidence * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3.5 border border-zinc-200/60 dark:border-zinc-700/50 text-xs text-zinc-600 dark:text-zinc-300">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {getPolicyExplanation(data.confidence_category)}
        </p>
      </div>
    </div>
  );
}
