"use client";

import React, { useEffect, useState } from "react";
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  History as HistoryIcon 
} from "lucide-react";
import { checkBackendHealth } from "@/lib/api";

interface HeaderProps {
  onReset?: () => void;
  onOpenHistory?: () => void;
  historyCount?: number;
}

export function Header({ 
  onReset, 
  onOpenHistory, 
  historyCount = 0 
}: HeaderProps) {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  const verifyHealth = async () => {
    setBackendStatus("checking");
    try {
      await checkBackendHealth();
      setBackendStatus("online");
    } catch {
      setBackendStatus("offline");
    }
  };

  useEffect(() => {
    verifyHealth();
    const interval = setInterval(verifyHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div 
          onClick={onReset}
          className="flex items-center gap-3 cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="Chest X-Ray AI Home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              Chest X-Ray <span className="text-blue-600 dark:text-blue-400">AI</span>
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium hidden sm:block">
              AI-assisted chest radiograph diagnostics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-zinc-600 dark:text-zinc-300 mr-2">
            <a href="#analyze" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Analyze
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              How It Works
            </a>
            <a href="#about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              About
            </a>
          </nav>

          {/* History Drawer Trigger */}
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              title="View Scan History"
            >
              <HistoryIcon className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
              {historyCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          {/* API Status Pill */}
          <div className="flex items-center pl-2 border-l border-zinc-200 dark:border-zinc-800">
            {backendStatus === "checking" && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                <RefreshCw className="h-3 w-3 animate-spin text-zinc-400" />
                <span className="hidden lg:inline">Checking</span>
              </div>
            )}
            {backendStatus === "online" && (
              <div 
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                title="FastAPI inference engine is connected and ready"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden lg:inline">API Online</span>
              </div>
            )}
            {backendStatus === "offline" && (
              <button
                onClick={verifyHealth}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                title="Cannot connect to FastAPI backend. Click to retry."
              >
                <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                <span className="hidden lg:inline">API Offline</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
