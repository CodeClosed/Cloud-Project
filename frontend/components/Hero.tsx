import React from "react";
import { ShieldAlert, Cpu, Sparkles, Layers } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-10 md:py-14 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-zinc-50/50 via-white to-white dark:from-zinc-900/40 dark:via-zinc-950 dark:to-zinc-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300 mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>Two-Model Deep Learning Pipeline</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-3xl mx-auto leading-tight">
          AI-Assisted Chest X-Ray Analysis & Explainability
        </h1>

        <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Automated multi-class diagnosis, anatomical lung segmentation, and Grad-CAM visual attention overlays powered by synchronized neural networks.
        </p>

        {/* 3 Core Pillars */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
          <div className="flex items-start gap-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-3.5 shadow-sm">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                Classification
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                EfficientNetB0 analyzes full X-ray for COVID, Normal, or Pneumonia.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-3.5 shadow-sm">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                Segmentation
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                U-Net isolates lung fields and calculates pulmonary coverage percentage.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-3.5 shadow-sm">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                Grad-CAM
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Backpropagated gradient maps highlight diagnostic decision regions.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>Research & Educational Evaluation Tool. Not an autonomous clinical diagnostic device.</span>
        </div>
      </div>
    </section>
  );
}
