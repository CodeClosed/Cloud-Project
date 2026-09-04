"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileImage, AlertCircle } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFileSelect, disabled = false }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    setValidationError(null);

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    const validExtensions = [".jpg", ".jpeg", ".png"];
    const extension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      setValidationError("Unsupported file format. Please upload a JPG, JPEG, or PNG radiograph.");
      return;
    }

    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setValidationError("File is too large. Maximum supported image size is 15MB.");
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload chest X-ray image"
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 md:p-12 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          disabled
            ? "cursor-not-allowed opacity-50 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"
            : isDragging
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]"
            : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50 bg-white dark:bg-zinc-900/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform mb-4 shadow-sm">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Drag & Drop your Chest X-Ray here
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          or <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">browse files</span> from your computer
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
          <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md">
            <FileImage className="h-3.5 w-3.5" /> JPG, JPEG, PNG
          </span>
          <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md">
            Max 15MB
          </span>
          <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md">
            224×224+ Recommended
          </span>
        </div>
      </div>

      {validationError && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs font-medium text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
