"use client";

import React, { useState } from "react";
import { VisualizationsResult } from "@/lib/types";
import { getVisualizationUrl } from "@/lib/api";
import { ExternalLink, Layers, Eye, Sparkles } from "lucide-react";

interface VisualizationsGalleryProps {
  originalPreviewUrl: string;
  visualizations: VisualizationsResult;
  predictedClass: string;
}

export function VisualizationsGallery({
  originalPreviewUrl,
  visualizations,
  predictedClass,
}: VisualizationsGalleryProps) {
  const [activeTab, setActiveTab] = useState<"all" | "segmentation" | "gradcam">("all");

  const gradcamUrl = getVisualizationUrl(visualizations.gradcam_overlay_url);
  const segmentationUrl = getVisualizationUrl(visualizations.segmentation_overlay_url);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Comparative Visualizations
            </h3>
            <span className="text-[11px] text-zinc-400">Side-by-side radiographic inspection & overlays</span>
          </div>
        </div>

        {/* Filter / View Tabs */}
        <div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === "all"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            All (3 Views)
          </button>
          <button
            onClick={() => setActiveTab("segmentation")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === "segmentation"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Segmentation
          </button>
          <button
            onClick={() => setActiveTab("gradcam")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === "gradcam"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Grad-CAM
          </button>
        </div>
      </div>

      <div className={`mt-6 grid gap-6 ${
        activeTab === "all" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
      }`}>
        {/* Card 1: Original X-Ray */}
        <div className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/80 px-3.5 py-2.5 bg-zinc-100/50 dark:bg-zinc-800/40">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-blue-500" />
              1. Original Radiograph
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Input</span>
          </div>

          <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalPreviewUrl}
              alt="Original Chest Radiograph"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="p-3.5 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/60 flex-1 flex flex-col justify-between">
            <p className="leading-relaxed">
              Full unsegmented chest radiograph submitted to the EfficientNetB0 classification pipeline.
            </p>
          </div>
        </div>

        {/* Card 2: U-Net Lung Segmentation */}
        {(activeTab === "all" || activeTab === "segmentation") && (
          <div className="flex flex-col rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-zinc-50/50 dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/40 px-3.5 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/30">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                2. Lung Segmentation
              </span>
              <a
                href={segmentationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <span>Full PNG</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={segmentationUrl}
                alt="Lung Segmentation Overlay"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="p-3.5 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/60 flex-1 flex flex-col justify-between">
              <p className="leading-relaxed">
                Green overlay delineating anatomical lung margins identified by the independent U-Net segmentation network.
              </p>
            </div>
          </div>
        )}

        {/* Card 3: Grad-CAM Explainability */}
        {(activeTab === "all" || activeTab === "gradcam") && (
          <div className="flex flex-col rounded-xl border border-purple-200/60 dark:border-purple-900/40 bg-zinc-50/50 dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/40 px-3.5 py-2.5 bg-purple-50/50 dark:bg-purple-950/30">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                3. Grad-CAM Explainability
              </span>
              <a
                href={gradcamUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                <span>Full PNG</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gradcamUrl}
                alt="Grad-CAM Activation Heatmap Overlay"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="p-3.5 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/60 flex-1 flex flex-col justify-between">
              <p className="leading-relaxed">
                Jet colormap showing feature gradients for <strong className="text-purple-700 dark:text-purple-300 capitalize">{predictedClass}</strong>. Red/yellow highlights influenced the model most.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
