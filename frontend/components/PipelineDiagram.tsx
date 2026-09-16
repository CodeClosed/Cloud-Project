import React from "react";
import { Upload, Cpu, Layers, Sparkles, LayoutDashboard, ArrowDown, ArrowRight, ArrowDownRight, ArrowDownLeft } from "lucide-react";

export function PipelineDiagram() {
  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-6 sm:p-8 shadow-sm">
      <div className="max-w-4xl mx-auto">
        {/* Step 1: Input Radiograph */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 px-5 py-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Input Image
              </span>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Uploaded Chest Radiograph (JPG / PNG)
              </div>
            </div>
          </div>

          <div className="h-6 w-0.5 bg-blue-300 dark:bg-blue-700 my-1" />
          <ArrowDown className="h-4 w-4 text-blue-500 -mt-1 mb-1" />

          {/* Step 2: FastAPI */}
          <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>FastAPI Server — POST /predict</span>
          </div>

          <div className="h-6 w-0.5 bg-zinc-300 dark:bg-zinc-700 my-1" />
        </div>

        {/* Branching Header */}
        <div className="relative my-2">
          {/* Desktop Branching Line */}
          <div className="hidden md:block absolute top-0 left-1/4 right-1/4 h-0.5 bg-zinc-300 dark:bg-zinc-700" />
          <div className="hidden md:block absolute top-0 left-1/4 h-4 w-0.5 bg-zinc-300 dark:bg-zinc-700" />
          <div className="hidden md:block absolute top-0 right-1/4 h-4 w-0.5 bg-zinc-300 dark:bg-zinc-700" />
        </div>

        {/* Step 3: Two Parallel Models */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Branch A: Classification & Grad-CAM */}
          <div className="flex flex-col items-center space-y-3 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-gradient-to-b from-blue-50/40 to-white dark:from-blue-950/20 dark:to-zinc-900/40 p-5">
            <div className="w-full flex items-center justify-between">
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                Branch A: Disease Diagnosis
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">224×224×3</span>
            </div>

            {/* Model Card */}
            <div className="w-full rounded-xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-zinc-900 p-4 shadow-sm text-left">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    EfficientNetB0 Classifier
                  </h4>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                    Evaluates Full Radiograph (Never Cropped)
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-medium">
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">COVID-19</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">Normal</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">Pneumonia</span>
              </div>
            </div>

            <ArrowDown className="h-4 w-4 text-blue-400" />

            {/* Grad-CAM Card */}
            <div className="w-full rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-zinc-900 p-3.5 shadow-sm text-left">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-purple-500/10 p-1.5 text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Grad-CAM Explainability
                  </h5>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Heatmap overlay from <code className="text-purple-600 font-mono">top_conv</code> layer
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Branch B: Lung Segmentation */}
          <div className="flex flex-col items-center space-y-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-gradient-to-b from-emerald-50/40 to-white dark:from-emerald-950/20 dark:to-zinc-900/40 p-5">
            <div className="w-full flex items-center justify-between">
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                Branch B: Anatomy
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">256×256×1</span>
            </div>

            {/* U-Net Card */}
            <div className="w-full rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-zinc-900 p-4 shadow-sm text-left">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    U-Net Segmentation Model
                  </h4>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Independent Pulmonary Delineation
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-medium">
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">Binary Lung Mask</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">Coverage %</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">Bounding Box</span>
              </div>
            </div>

            <ArrowDown className="h-4 w-4 text-emerald-400" />

            {/* Segmentation Output Card */}
            <div className="w-full rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-zinc-900 p-3.5 shadow-sm text-left">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Lung Area & Green Mask Overlay
                  </h5>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Calculates pulmonary bounds for anatomical context
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Convergence into Output Dashboard */}
        <div className="flex flex-col items-center mt-6">
          <div className="hidden md:block relative w-1/2 my-1">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-300 dark:bg-zinc-700" />
            <div className="h-4 w-0.5 bg-zinc-300 dark:bg-zinc-700 mx-auto" />
          </div>
          <ArrowDown className="h-4 w-4 text-blue-500 mb-2" />

          <div className="flex items-center gap-3 rounded-2xl border border-cyan-200 dark:border-cyan-900/60 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/40 px-6 py-4 shadow-sm text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm shrink-0">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                Unified Result Dashboard
              </span>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Diagnosis + Probabilities + Lung Coverage + Side-by-Side Visualizations
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
