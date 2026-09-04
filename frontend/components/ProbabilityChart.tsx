import React from "react";
import { ClassProbabilities } from "@/lib/types";
import { formatClassName } from "@/lib/utils";
import { BarChart3, Info } from "lucide-react";

interface ProbabilityChartProps {
  probabilities: ClassProbabilities;
  predictedClass: string;
}

export function ProbabilityChart({ probabilities, predictedClass }: ProbabilityChartProps) {
  const classes: Array<{ key: keyof ClassProbabilities; label: string; score: number }> = [
    { key: "covid", label: formatClassName("covid"), score: probabilities.covid },
    { key: "normal", label: formatClassName("normal"), score: probabilities.normal },
    { key: "pneumonia", label: formatClassName("pneumonia"), score: probabilities.pneumonia },
  ];

  return (
    <div className="h-full flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
      <div>
        <div className="flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Multi-Class Probability Distribution
            </h3>
            <span className="text-[11px] text-zinc-400">Softmax outputs across candidate categories</span>
          </div>
        </div>

      <div className="mt-6 space-y-4">
        {classes.map((item) => {
          const isTop = item.key.toLowerCase() === predictedClass.toLowerCase();
          const percentage = (item.score * 100).toFixed(2);

          return (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isTop ? "text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5" : "text-zinc-700 dark:text-zinc-300"}`}>
                  {item.label}
                  {isTop && (
                    <span className="rounded bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                      Primary
                    </span>
                  )}
                </span>
                <span className={`tabular-nums ${isTop ? "font-bold text-blue-600 dark:text-blue-400 text-sm" : "text-zinc-500 dark:text-zinc-400"}`}>
                  {percentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div 
                className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                role="progressbar"
                aria-valuenow={parseFloat(percentage)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.label} probability: ${percentage}%`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isTop
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-sm"
                      : "bg-zinc-400 dark:bg-zinc-600"
                  }`}
                  style={{ width: `${Math.max(item.score * 100, 1)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/20 p-3 text-xs text-zinc-600 dark:text-zinc-400">
        <Info className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-semibold text-cyan-700 dark:text-cyan-300">Statistical Softmax: </span>
          Normalized likelihood scores across candidate categories. Sums strictly to 100%.
        </p>
      </div>
    </div>
  );
}
