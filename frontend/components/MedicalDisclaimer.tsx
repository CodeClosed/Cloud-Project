import React from "react";
import { ShieldAlert } from "lucide-react";

export function MedicalDisclaimer() {
  return (
    <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide text-[11px] mb-1">
            Clinical Evaluation & Safety Notice
          </h4>
          <p>
            This application is an artificial intelligence research demonstration intended strictly for educational and investigational purposes. It is <strong>not a medical device</strong> and has not been cleared or approved by any regulatory health agency (e.g., FDA, EMA).
          </p>
          <p className="mt-1.5 text-zinc-600 dark:text-zinc-400">
            Model predictions, confidence categories, lung segmentations, and Grad-CAM attention overlays must <strong>never</strong> be used as a replacement for professional clinical judgement, radiologist examination, or validated medical laboratory tests.
          </p>
        </div>
      </div>
    </div>
  );
}
