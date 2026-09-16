"use client";

import React from "react";
import { PredictionResult } from "@/lib/types";
import { ClassificationResult } from "./ClassificationResult";
import { ProbabilityChart } from "./ProbabilityChart";
import { SegmentationResult } from "./SegmentationResult";
import { GradCAMResult } from "./GradCAMResult";
import { VisualizationsGallery } from "./VisualizationsGallery";
import { TechnicalDetails } from "./TechnicalDetails";
import { MedicalDisclaimer } from "./MedicalDisclaimer";
import { RotateCcw, CheckCircle2, FileText, Hash } from "lucide-react";

interface ResultsDashboardProps {
  result: PredictionResult;
  originalPreviewUrl: string;
  onReset: () => void;
}

export function ResultsDashboard({
  result,
  originalPreviewUrl,
  onReset,
}: ResultsDashboardProps) {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 sm:p-6 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Analysis Complete</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            Radiographic Diagnostic Summary
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> {result.filename}
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Hash className="h-3 w-3" /> {result.request_id.slice(0, 8)}
            </span>
          </div>
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-xs font-semibold text-white dark:text-zinc-900 shadow-md hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Analyze Another X-Ray</span>
        </button>
      </div>

      {/* Balanced 2x2 Diagnostic & Metadata Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <ClassificationResult data={result.classification} />
        <SegmentationResult data={result.segmentation} />
        <ProbabilityChart
          probabilities={result.classification.class_probabilities}
          predictedClass={result.classification.predicted_class}
        />
        <GradCAMResult data={result.gradcam} />
      </div>

      {/* Full Width Visualizations Gallery */}
      <VisualizationsGallery
        originalPreviewUrl={originalPreviewUrl}
        visualizations={result.visualizations}
        predictedClass={result.classification.predicted_class}
        requestId={result.request_id}
      />

      {/* Technical Metadata */}
      <TechnicalDetails data={result} />

      {/* Clinical Disclaimer */}
      <MedicalDisclaimer />
    </div>
  );
}
