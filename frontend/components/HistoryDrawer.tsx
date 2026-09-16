"use client";

import React, { useState } from "react";
import { 
  X, 
  History, 
  Trash2, 
  Download, 
  Search, 
  ArrowUpRight, 
  Clock, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText
} from "lucide-react";
import { HistoryItem, clearAllHistory, deleteFromHistory } from "@/lib/storage";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelectScan: (item: HistoryItem) => void;
  onRefreshHistory: () => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  items,
  onSelectScan,
  onRefreshHistory,
}: HistoryDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.filename.toLowerCase().includes(term) ||
      item.result.classification.predicted_class.toLowerCase().includes(term) ||
      (item.notes && item.notes.toLowerCase().includes(term))
    );
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteFromHistory(id);
    onRefreshHistory();
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all analysis history?")) {
      clearAllHistory();
      onRefreshHistory();
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cxray_analysis_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getClassBadge = (cls: string) => {
    switch (cls.toLowerCase()) {
      case "covid":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/60">
            <AlertTriangle className="h-3 w-3" />
            COVID-19
          </span>
        );
      case "pneumonia":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60">
            <Activity className="h-3 w-3" />
            Pneumonia
          </span>
        );
      case "normal":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
            <CheckCircle2 className="h-3 w-3" />
            Normal
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in" 
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                Scan History
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {items.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Click any scan to restore full diagnostics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Action Bar */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by filename or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 pl-8 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportJSON}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Export History as JSON"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleClearAll}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                title="Clear All History"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* List of Scans */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3">
                <FileText className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No analyses saved yet
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                Upload and analyze a chest X-ray image. Results are automatically saved locally for instant review.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-500">
              No matching scans found for &quot;{searchTerm}&quot;
            </div>
          ) : (
            filteredItems.map((item) => {
              const clf = item.result.classification;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectScan(item);
                    onClose();
                  }}
                  className="group relative flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-3 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Thumbnail if previewUrl exists, or icon */}
                    <div className="relative h-12 w-12 rounded-lg bg-zinc-950 overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-center">
                      {item.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.previewUrl}
                          alt={item.filename}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Activity className="h-5 w-5 text-zinc-600" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {getClassBadge(clf.predicted_class)}
                        <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                          {(clf.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate mt-1">
                        {item.filename}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatRelativeTime(item.timestamp)}
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          {item.result.request_id ? item.result.request_id.slice(0, 6) : "saved"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete scan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="p-1 text-zinc-400 group-hover:text-blue-600 transition-colors">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-center">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Stored locally in browser • No external data transmission
          </p>
        </div>
      </div>
    </div>
  );
}
