import React from "react";
import { Loader2, BrainCircuit, Activity, Layers, Sparkles } from "lucide-react";

export function LoadingState() {
  return (
    <div className="w-full rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-6 sm:p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30 mb-4 animate-pulse">
        <BrainCircuit className="h-7 w-7" />
      </div>

      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
        <span>Processing Chest Radiograph</span>
        <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
      </h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
        Synchronized inference is evaluating the image across both neural networks.
      </p>

      {/* Synchronized pipeline stages indicator */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
        <div className="flex items-center gap-3 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/80 dark:bg-zinc-900/80 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
            <Activity className="h-4 w-4 animate-bounce" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Classification</div>
            <div className="text-[11px] text-zinc-500">EfficientNetB0 (Full image)</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/80 dark:bg-zinc-900/80 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300">
            <Layers className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Segmentation</div>
            <div className="text-[11px] text-zinc-500">U-Net (256×256 grayscale)</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-white/80 dark:bg-zinc-900/80 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Explainability</div>
            <div className="text-[11px] text-zinc-500">Grad-CAM (Top Conv layer)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
