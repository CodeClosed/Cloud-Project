import { PredictionResponse, HealthResponse } from "./types";

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

/**
 * Constructs a fully qualified URL for visualizations served by the FastAPI backend.
 */
export function getVisualizationUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Check backend health status
 */
export async function checkBackendHealth(): Promise<HealthResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Health check returned status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error && error.name === "AbortError"
        ? "Health check timed out."
        : "Backend service is currently unreachable."
    );
  }
}

/**
 * Send chest X-ray image for full-pipeline inference (Classification + U-Net Segmentation + Grad-CAM)
 */
export async function analyzeChestXray(file: File): Promise<PredictionResponse> {
  // Client-side validations
  if (!file) {
    throw new Error("No image file provided.");
  }

  const validTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Invalid format. Please select a JPG, JPEG, or PNG image.");
  }

  const maxBytes = 15 * 1024 * 1024; // 15MB
  if (file.size > maxBytes) {
    throw new Error("File exceeds maximum allowed size of 15MB.");
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const controller = new AbortController();
    // 60-second timeout for model cold-starts / first inference
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Analysis failed with status ${response.status}.`;
      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // use fallback message if json parsing fails
      }
      throw new Error(errorMessage);
    }

    const data: PredictionResponse = await response.json();
    if (!data.success || !data.result) {
      throw new Error("Malformed response received from analysis engine.");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("The request timed out. Model inference took longer than expected.");
      }
      throw error;
    }
    throw new Error("An unexpected error occurred while connecting to the analysis API.");
  }
}
