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
const MAX_HISTORY_ITEMS = 50;

/**
 * Filter out large base64 or dead blob strings to avoid exceeding localStorage quota
 */
function sanitizePreviewUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // If it's a huge base64 data URI or dead blob URI, do not store it in localStorage
  if (url.startsWith("data:") || url.startsWith("blob:") || url.length > 512) {
    return undefined;
  }
  return url;
}

/**
 * Clean legacy entries that might have stored massive base64 strings
 */
function sanitizeItem(item: unknown): HistoryItem | null {
  if (!item || typeof item !== "object") return null;
  const candidate = item as Partial<HistoryItem>;
  if (!candidate.id || !candidate.result) return null;

  return {
    id: String(candidate.id),
    timestamp: typeof candidate.timestamp === "number" ? candidate.timestamp : Date.now(),
    filename: typeof candidate.filename === "string" ? candidate.filename : "chest_xray.png",
    previewUrl: sanitizePreviewUrl(candidate.previewUrl),
    result: candidate.result,
    notes: typeof candidate.notes === "string" ? candidate.notes : undefined,
    triage: candidate.triage,
  };
}

/**
 * Safe write to localStorage with automatic quota recovery strategies
 */
function safeWriteStorage(items: HistoryItem[]): boolean {
  if (typeof window === "undefined") return false;

  const tryWrite = (data: HistoryItem[]): boolean => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  };

  // 1. First attempt: write sanitized items
  if (tryWrite(items)) return true;

  // 2. Second attempt: strip all previewUrls completely to conserve quota
  const stripped = items.map((item) => ({ ...item, previewUrl: undefined }));
  if (tryWrite(stripped)) return true;

  // 3. Third attempt: keep only the 15 most recent items
  if (tryWrite(stripped.slice(0, 15))) return true;

  // 4. Fourth attempt: keep only the 5 most recent items
  if (tryWrite(stripped.slice(0, 5))) return true;

  // 5. Emergency fallback: clear corrupted or overloaded history
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.warn("Unable to clear browser storage key:", err);
  }

  return false;
}

/**
 * Retrieve saved scan history from browser storage
 */
export function getStoredHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    let hasBloatedItems = false;
    const sanitizedList: HistoryItem[] = [];

    for (const rawItem of parsed) {
      if (rawItem?.previewUrl && (rawItem.previewUrl.startsWith("data:") || rawItem.previewUrl.length > 512)) {
        hasBloatedItems = true;
      }
      const valid = sanitizeItem(rawItem);
      if (valid) {
        sanitizedList.push(valid);
      }
    }

    // Automatically heal and compact existing storage if bloated base64 data was found
    if (hasBloatedItems) {
      safeWriteStorage(sanitizedList);
    }

    return sanitizedList;
  } catch (err) {
    console.warn("Failed to load scan history:", err);
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
    previewUrl: sanitizePreviewUrl(entry.previewUrl),
    id: entry.result.request_id || `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  if (typeof window === "undefined") return newItem;

  try {
    const history = getStoredHistory();
    // Avoid duplicate request IDs, prepend newest item
    const filtered = history.filter((item) => item.id !== newItem.id);
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    safeWriteStorage(updated);
  } catch (err) {
    console.warn("Failed to save scan to history:", err);
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
    safeWriteStorage(updated);
    return updated;
  } catch (err) {
    console.warn("Failed to delete from history:", err);
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
    console.warn("Failed to clear history:", err);
  }
}
