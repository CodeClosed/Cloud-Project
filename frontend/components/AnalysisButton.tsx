"use client";

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface AnalysisButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function AnalysisButton({ onClick, isLoading, disabled = false }: AnalysisButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        disabled || isLoading
          ? "cursor-not-allowed bg-zinc-400 dark:bg-zinc-700 shadow-none opacity-80"
          : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-blue-500/25 hover:shadow-blue-500/35"
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>Analyzing X-Ray...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 text-blue-200" />
          <span>Analyze X-Ray</span>
        </>
      )}
    </button>
  );
}
