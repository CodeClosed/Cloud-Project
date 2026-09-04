"use client";

import React, { useState } from "react";
import { 
  X, 
  Settings, 
  Server, 
  Eye, 
  Save, 
  Moon, 
  Sun, 
  Laptop, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Trash2,
  Sliders
} from "lucide-react";
import { AppSettings, DEFAULT_SETTINGS, saveStoredSettings, clearAllHistory } from "@/lib/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
  onHistoryCleared?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onHistoryCleared,
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus("testing");
    try {
      const url = localSettings.apiUrl.replace(/\/+$/, "") + "/health";
      const res = await fetch(url, { method: "GET" });
      if (res.ok) {
        setTestStatus("success");
      } else {
        setTestStatus("error");
      }
    } catch {
      setTestStatus("error");
    }
  };

  const handleSave = () => {
    const updated = saveStoredSettings(localSettings);
    onSettingsChange(updated);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  const handleClearAllData = () => {
    if (window.confirm("Are you sure? This will delete all saved scan history.")) {
      clearAllHistory();
      if (onHistoryCleared) onHistoryCleared();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Application Settings
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure your inference endpoint, display preferences, and local data
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Backend API Endpoint */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              <Server className="h-4 w-4 text-blue-500" />
              <span>FastAPI Inference Backend</span>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">
                API Base URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localSettings.apiUrl}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, apiUrl: e.target.value });
                    setTestStatus("idle");
                  }}
                  placeholder="http://127.0.0.1:8000"
                  className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === "testing"}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {testStatus === "testing" ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : testStatus === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : testStatus === "error" ? (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                  ) : (
                    <span>Test</span>
                  )}
                  <span>{testStatus === "testing" ? "Testing..." : testStatus === "success" ? "Connected" : testStatus === "error" ? "Failed" : "Ping"}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Default: <code className="font-mono text-zinc-500 dark:text-zinc-400">http://127.0.0.1:8000</code>. Point to your remote cloud API if deployed.
              </p>
            </div>
          </div>

          {/* Section 2: Default Visualizer View */}
          <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              <Eye className="h-4 w-4 text-cyan-500" />
              <span>Default Visualizer View</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "gradcam", label: "Grad-CAM", desc: "Attention heatmap" },
                { id: "segmentation", label: "Segmentation", desc: "U-Net lung mask" },
                { id: "original", label: "Original", desc: "Raw radiograph" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, defaultVisualizer: opt.id as any })}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    localSettings.defaultVisualizer === opt.id
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                  }`}
                >
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Data & Auto-Save History */}
          <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              <Save className="h-4 w-4 text-emerald-500" />
              <span>Data &amp; Privacy</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-950/40">
              <div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                  Auto-Save Scans to History
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Store completed scans locally in your browser for quick reload
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.autoSaveHistory}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoSaveHistory: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Section 4: Data Reset Controls */}
          <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Reset settings to defaults
              </button>
              <button
                type="button"
                onClick={handleClearAllData}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear all scan history</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            {savedFeedback ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
