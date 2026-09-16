"use client";

import React, { useState } from "react";
import { X, FileText, CheckCircle2, Download, Check } from "lucide-react";
import { downloadImageToLaptop } from "@/lib/download";

interface ImagePreviewProps {
  file: File;
  previewUrl: string;
  onRemove: () => void;
  disabled?: boolean;
}

export function ImagePreview({ file, previewUrl, onRemove, disabled = false }: ImagePreviewProps) {
  const [downloaded, setDownloaded] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = async () => {
    setDownloaded(true);
    await downloadImageToLaptop(previewUrl, file.name || "chest_xray_preview.png");
    setTimeout(() => setDownloaded(false), 1500);
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Preview thumbnail with quick hover download */}
        <div className="relative h-48 w-48 sm:h-40 sm:w-40 shrink-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-black/95 flex items-center justify-center group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Selected Chest X-Ray Preview"
            className="h-full w-full object-contain"
          />
          <div className="absolute top-2 left-2 rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
            Original X-Ray
          </div>
          {/* Quick hover download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="absolute bottom-2.5 right-2.5 p-2 rounded-lg bg-black/75 hover:bg-black text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95"
            title="Download image to laptop"
          >
            {downloaded ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Metadata and Controls */}
        <div className="flex-1 w-full text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Ready for Analysis</span>
          </div>

          <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-md" title={file.name}>
            {file.name}
          </h4>

          <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> {file.type || "Image"}
            </span>
            <span>Size: {formatFileSize(file.size)}</span>
          </div>

          <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Change Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
