"use client";

import React, { useState } from "react";
import { PredictionResult } from "@/lib/types";
import { ChevronDown, ChevronRight, Terminal, Copy, Check } from "lucide-react";

interface TechnicalDetailsProps {
  data: PredictionResult;
}

export function TechnicalDetails({ data }: TechnicalDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-zinc-500" />
          <span>Technical Inference Metadata & JSON Payload</span>
          <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
            Request: {data.request_id.slice(0, 8)}...
          </span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-6 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-zinc-500">Structured FastAPI Response Schema</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
          </div>
          <pre className="max-h-80 overflow-auto rounded-xl bg-zinc-900 p-4 text-xs font-mono text-emerald-400 dark:bg-black/80">
            <code>{jsonString}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
