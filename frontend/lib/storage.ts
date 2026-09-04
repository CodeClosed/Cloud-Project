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

const HISTORY_STORAGE_KEY = "cxray_analysis_history";

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

