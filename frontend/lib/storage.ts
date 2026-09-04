import { PredictionResult } from "./types";

export interface HistoryItem {
  id: string;
  timestamp: number;
  filename: string;
  previewUrl?: string;
  result: PredictionResult;
  notes?: string;
  triage?: "routine" | "urgent" | "critical";
}

export interface AppSettings {
  apiUrl: string;
  autoSaveHistory: boolean;
  theme: "system" | "light" | "dark";
  defaultVisualizer: "gradcam" | "segmentation" | "original";
  highConfidenceThreshold: number; // e.g. 90%
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000",
  autoSaveHistory: true,
  theme: "system",
  defaultVisualizer: "gradcam",
  highConfidenceThreshold: 90,
};

const HISTORY_STORAGE_KEY = "cxray_analysis_history";
const SETTINGS_STORAGE_KEY = "cxray_app_settings";

/**
 * Retrieve saved scan history from browser storage
 */
export function getStoredHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load scan history:", err);
    return [];
  }
}

/**
 * Save a new analysis to local history
 */
export function saveToHistory(
  entry: Omit<HistoryItem, "id" | "timestamp">
): HistoryItem {
  const newItem: HistoryItem = {
    ...entry,
    id: entry.result.request_id || `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  if (typeof window === "undefined") return newItem;

  try {
    const history = getStoredHistory();
    // Avoid exact duplicate request IDs, prepend new one
    const filtered = history.filter((item) => item.id !== newItem.id);
    const updated = [newItem, ...filtered].slice(0, 50); // Keep last 50
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save scan to history:", err);
  }

  return newItem;
}

/**
 * Delete a specific item from history
 */
export function deleteFromHistory(id: string): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const history = getStoredHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to delete from history:", err);
    return [];
  }
}

/**
 * Clear all history
 */
export function clearAllHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear history:", err);
  }
}

/**
 * Retrieve app settings
 */
export function getStoredSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error("Failed to load settings:", err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save updated app settings
 */
export function saveStoredSettings(newSettings: Partial<AppSettings>): AppSettings {
  const current = getStoredSettings();
  const merged: AppSettings = { ...current, ...newSettings };
  if (typeof window === "undefined") return merged;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error("Failed to save settings:", err);
  }
  return merged;
}
