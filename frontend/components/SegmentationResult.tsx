import React from "react";
import { SegmentationResult as ISegmentationResult } from "@/lib/types";
import { formatPercent } from "@/lib/utils";
import { Layers, Scan, Maximize2 } from "lucide-react";

interface SegmentationResultProps {
  data: ISegmentationResult;
}

export function SegmentationResult({ data }: SegmentationResultProps) {
  const { bounding_box, lung_coverage, lung_roi_shape } = data;

  return (
    <div className="h-full flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
      <div>
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Anatomical Lung Segmentation
              </h3>
              <span className="text-[11px] text-zinc-400">Model: U-Net (256×256 binary mask threshold @ 0.5)</span>
            </div>
          </div>

          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            U-Net
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
            <Scan className="h-4 w-4 text-emerald-500" />
            <span>Lung Field Coverage</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatPercent(lung_coverage, 1)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Proportion of total radiographic image area occupied by segmented lung fields.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
            <Maximize2 className="h-4 w-4 text-emerald-500" />
            <span>Bounding Box & ROI</span>
          </div>
          <div className="mt-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
            {bounding_box.width} × {bounding_box.height} px
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Region: ({bounding_box.x_min}, {bounding_box.y_min}) to ({bounding_box.x_max}, {bounding_box.y_max})
          </p>
        </div>
      </div>
      </div>

      <div className="mt-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 p-3 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="font-semibold text-emerald-700 dark:text-emerald-300">Anatomical Context: </span>
        Segmentation is an independent pipeline task isolating pulmonary anatomy. It is not an assertion of disease pathology.
      </div>
    </div>
  );
}
