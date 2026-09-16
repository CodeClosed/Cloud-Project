"use client";

import React, { useState } from "react";
import { VisualizationsResult } from "@/lib/types";
import { getVisualizationUrl } from "@/lib/api";
import { ExternalLink, Layers, Eye, Sparkles, Download, Check, Archive, FileArchive } from "lucide-react";
import { downloadImageToLaptop, downloadImagesAsZip } from "@/lib/download";

interface VisualizationsGalleryProps {
  originalPreviewUrl: string;
  visualizations: VisualizationsResult;
  predictedClass: string;
  requestId?: string;
}

export function VisualizationsGallery({
  originalPreviewUrl,
  visualizations,
  predictedClass,
  requestId,
}: VisualizationsGalleryProps) {
  const [activeTab, setActiveTab] = useState<"all" | "segmentation" | "gradcam">("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const gradcamUrl = getVisualizationUrl(visualizations.gradcam_overlay_url);
  const segmentationUrl = getVisualizationUrl(visualizations.segmentation_overlay_url);
  const backendOriginalUrl = visualizations.original_image_url
    ? getVisualizationUrl(visualizations.original_image_url)
    : "";

  const [originalSrc, setOriginalSrc] = useState<string>(originalPreviewUrl || backendOriginalUrl);

  React.useEffect(() => {
    setOriginalSrc(originalPreviewUrl || backendOriginalUrl);
  }, [originalPreviewUrl, backendOriginalUrl]);

  const handleDownload = async (url: string, filename: string, id: string) => {
    if (!url) return;
    setDownloadingId(id);
    try {
      await downloadImageToLaptop(url, filename);
    } catch (err) {
      console.error("Failed to download image:", err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1200);
    }
  };

  const handleDownloadAllZip = async () => {
    const items = [
      { url: originalSrc || backendOriginalUrl, filename: "1_original_radiograph.png" },
      { url: segmentationUrl, filename: "2_lung_segmentation.png" },
      { url: gradcamUrl, filename: `3_gradcam_explainability_${predictedClass}.png` },
    ].filter((item) => Boolean(item.url));

    setDownloadingId("zip");
    try {
      const zipName = requestId
        ? `chest_xray_analysis_${requestId.slice(0, 8)}.zip`
        : "chest_xray_analysis.zip";
      await downloadImagesAsZip(items, zipName);
    } catch (err) {
      console.error("Failed to download ZIP bundle:", err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
    }
  };

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
            <span className="text-[11px] text-zinc-400">Side-by-side radiographic inspection &amp; overlays</span>
          </div>
        </div>

        {/* Action Controls: Download ZIP Bundle & Filter Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadAllZip}
            disabled={downloadingId === "zip"}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/40 px-3.5 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-2xs hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Download all 3 images in a single .zip archive directly to your laptop"
          >
            {downloadingId === "zip" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                <span>Creating ZIP...</span>
              </>
            ) : (
              <>
                <Archive className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Download All (.zip)</span>
              </>
            )}
          </button>

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
      </div>

      {/* Grid: All (3 Cards) or Filtered (2 Cards) */}
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
            {originalSrc && (
              <a
                href={originalSrc}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Open full size in new tab"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalSrc || backendOriginalUrl}
              alt="Original Chest Radiograph"
              onError={() => {
                if (backendOriginalUrl && originalSrc !== backendOriginalUrl) {
                  setOriginalSrc(backendOriginalUrl);
                }
              }}
              className="h-full w-full object-contain"
            />
            {/* Quick hover download button */}
            <button
              onClick={() => handleDownload(originalSrc || backendOriginalUrl, "chest_xray_original.png", "orig")}
              className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-black/75 hover:bg-black text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95"
              title="Download original radiograph"
            >
              {downloadingId === "orig" ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>
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
                title="Open full size in new tab"
              >
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
              {/* Quick hover download button */}
              <button
                onClick={() => handleDownload(segmentationUrl, "chest_xray_lung_segmentation.png", "seg")}
                className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-black/75 hover:bg-black text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95"
                title="Download segmentation overlay"
              >
                {downloadingId === "seg" ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>
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
                title="Open full size in new tab"
              >
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
              {/* Quick hover download button */}
              <button
                onClick={() => handleDownload(gradcamUrl, `chest_xray_gradcam_${predictedClass}.png`, "cam")}
                className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-black/75 hover:bg-black text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95"
                title="Download Grad-CAM overlay"
              >
                {downloadingId === "cam" ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>
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
