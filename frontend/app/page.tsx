"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { UploadZone } from "@/components/UploadZone";
import { ImagePreview } from "@/components/ImagePreview";
import { AnalysisButton } from "@/components/AnalysisButton";
import { LoadingState } from "@/components/LoadingState";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { ErrorMessage } from "@/components/ErrorMessage";
import { HowItWorks } from "@/components/HowItWorks";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { SettingsModal } from "@/components/SettingsModal";
import { analyzeChestXray, getVisualizationUrl } from "@/lib/api";
import { PredictionResult } from "@/lib/types";
import { 
  getStoredHistory, 
  saveToHistory, 
  getStoredSettings, 
  AppSettings, 
  DEFAULT_SETTINGS, 
  HistoryItem 
} from "@/lib/storage";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History and Settings state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load history and settings from browser storage on mount
  useEffect(() => {
    setHistoryItems(getStoredHistory());
    setSettings(getStoredSettings());
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    
    // Immediate preview for instantaneous feedback
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Also read as permanent base64 Data URL for persistent history retention
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsLoading(false);
    setResult(null);
    setError(null);
  }, []);

  const handleSelectHistoryScan = (item: HistoryItem) => {
    setResult(item.result);
    // Resolve permanent image URL: prefer stored Data URL or backend original_image_url
    const backendOriginal = item.result.visualizations.original_image_url
      ? getVisualizationUrl(item.result.visualizations.original_image_url)
      : "";
    
    // If item.previewUrl is a dead blob URL, use the backend URL
    const isDeadBlob = item.previewUrl && item.previewUrl.startsWith("blob:");
    const finalOriginalUrl = (!isDeadBlob && item.previewUrl) ? item.previewUrl : backendOriginal;

    setPreviewUrl(finalOriginalUrl || null);
    setSelectedFile(null);
    setError(null);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a chest X-ray image first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await analyzeChestXray(selectedFile);
      setResult(response.result);

      // Determine permanent URL for the original image
      const backendUrl = response.result.visualizations.original_image_url
        ? getVisualizationUrl(response.result.visualizations.original_image_url)
        : "";
      const isBlob = previewUrl && previewUrl.startsWith("blob:");
      const permanentPreview = (!isBlob && previewUrl) ? previewUrl : backendUrl;

      // Auto-save to local history if enabled
      if (settings.autoSaveHistory) {
        saveToHistory({
          filename: selectedFile.name,
          previewUrl: permanentPreview || undefined,
          result: response.result,
        });
        setHistoryItems(getStoredHistory());
      }

      // Scroll smoothly to results
      window.scrollTo({ top: 400, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while communicating with the analysis server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <Header 
        onReset={handleReset} 
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={historyItems.length}
      />

      <main className="flex-1">
        <Hero />

        <section id="analyze" className="py-10 md:py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {!result ? (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    Image Ingestion
                  </h2>
                  <h3 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                    Upload Chest Radiograph
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    Select a chest X-ray (JPG or PNG) for simultaneous classification, segmentation, and Grad-CAM generation.
                  </p>
                </div>

                {!selectedFile ? (
                  <UploadZone onFileSelect={handleFileSelect} disabled={isLoading} />
                ) : (
                  <div className="space-y-6">
                    <ImagePreview
                      file={selectedFile}
                      previewUrl={previewUrl || ""}
                      onRemove={handleReset}
                      disabled={isLoading}
                    />

                    {!isLoading && (
                      <div className="flex justify-center">
                        <AnalysisButton
                          onClick={handleAnalyze}
                          isLoading={isLoading}
                          disabled={!selectedFile || isLoading}
                        />
                      </div>
                    )}
                  </div>
                )}

                {isLoading && <LoadingState />}

                {error && (
                  <ErrorMessage
                    message={error}
                    onRetry={selectedFile ? handleAnalyze : undefined}
                  />
                )}
              </div>
            ) : (
              <ResultsDashboard
                result={result}
                originalPreviewUrl={previewUrl || ""}
                onReset={handleReset}
              />
            )}
          </div>
        </section>

        <HowItWorks />
        <About />
      </main>

      <Footer />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onSelectScan={handleSelectHistoryScan}
        onRefreshHistory={() => setHistoryItems(getStoredHistory())}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={(newSettings) => setSettings(newSettings)}
        onHistoryCleared={() => setHistoryItems([])}
      />
    </div>
  );
}
