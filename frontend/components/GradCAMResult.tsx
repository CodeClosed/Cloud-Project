import React from "react";
import { GradCamResult as IGradCamResult } from "@/lib/types";
import { formatClassName } from "@/lib/utils";
import { Sparkles, Focus, AlertTriangle } from "lucide-react";

interface GradCAMResultProps {
  data: IGradCamResult;
}

export function GradCAMResult({ data }: GradCAMResultProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Model Explainability (Grad-CAM)
            </h3>
            <span className="text-[11px] text-zinc-400">Gradient-weighted Class Activation Mapping</span>
          </div>
        </div>

        <span className="rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
          top_conv layer
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
            <Focus className="h-4 w-4 text-purple-500" />
            <span>Target Class Attributed</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
            {formatClassName(data.target_class)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Gradients backpropagated from the {formatClassName(data.target_class)} class logit.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>Heatmap Resolution</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {data.heatmap_shape[0]} × {data.heatmap_shape[1]} grid
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Computed from final 7×7 feature map before pooling and dense classification.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 p-3 text-xs text-zinc-600 dark:text-zinc-400">
        <AlertTriangle className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-purple-700 dark:text-purple-300">Crucial Distinction: </strong>
          Grad-CAM highlights image regions that contributed most heavily to the classifier&apos;s decision. It is <strong>NOT</strong> a lung segmentation mask, and highlighted regions are not guaranteed clinical disease margins.
        </p>
      </div>
    </div>
  );
}
