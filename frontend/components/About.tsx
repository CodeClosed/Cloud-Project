import React from "react";
import { Info, CheckCircle2 } from "lucide-react";

export function About() {
  return (
    <section id="about" className="py-12 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Technical Rationale
            </h2>
            <h3 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              About This System
            </h3>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6 sm:p-8 shadow-sm space-y-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            <p>
              The <strong>Chest X-Ray AI Analysis System</strong> integrates deep learning classification and semantic segmentation to assist researchers and clinicians in radiographic image evaluation.
            </p>

            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pt-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              Full-Field Radiograph Classification
            </h4>
            <p>
              Our classification backbone is an <strong>EfficientNetB0</strong> fine-tuned on full chest X-ray images. Crucially, the classifier receives the entire image rather than a cropped lung ROI. Empirical validation confirmed that passing cropped ROIs into a full-image trained model causes distribution shifts; maintaining full-field evaluation preserves peripheral diagnostic cues and achieves 96.24% test accuracy across COVID-19, Normal, and Pneumonia classes.
            </p>

            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pt-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Independent Anatomical Segmentation
            </h4>
            <p>
              Lung boundary delineation is conducted by a separate <strong>U-Net</strong> architecture trained to output a binary pulmonary mask at a 0.5 probability threshold. This calculates the precise lung field area coverage and provides spatial coordinates for anatomical reference.
            </p>

            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pt-2">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              Explainability via Grad-CAM
            </h4>
            <p>
              To ensure transparency, <strong>Grad-CAM</strong> is applied to the final convolutional layer (<code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 text-xs font-mono">top_conv</code>) of the EfficientNetB0 network. Grad-CAM does not demarcate anatomy; rather, it highlights the features and localized visual patterns that influenced the neural network&apos;s classification decision.
            </p>

            <div className="mt-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900 dark:text-blue-200">
                <strong>Deployment Architecture:</strong> The Next.js frontend is designed for rapid, serverless deployment on <strong>Vercel</strong>, communicating with the persistent Python FastAPI inference backend via standard REST HTTP endpoints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
