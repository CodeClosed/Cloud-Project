import React from "react";
import { Upload, Cpu, Layers, Sparkles, LayoutDashboard } from "lucide-react";
import { PipelineDiagram } from "./PipelineDiagram";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Radiograph Ingestion",
      desc: "Client-side format checking validates JPG or PNG chest radiographs up to 15MB before streaming to the backend API.",
      icon: Upload,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      step: "02",
      title: "Full-Field Classification",
      desc: "EfficientNetB0 receives the entire 224×224×3 radiograph (never just the cropped ROI) and outputs softmax probabilities for COVID-19, Normal, and Pneumonia.",
      icon: Cpu,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      step: "03",
      title: "Independent Segmentation",
      desc: "U-Net processes a 256×256 grayscale view to generate lung probability masks, calculate pulmonary area coverage, and extract bounding coordinates.",
      icon: Layers,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      step: "04",
      title: "Grad-CAM Attribution",
      desc: "Gradient backpropagation from the top predicted class through the top_conv layer highlights the specific image features influencing the classifier.",
      icon: Sparkles,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/50",
    },
    {
      step: "05",
      title: "Unified Dashboard",
      desc: "FastAPI serves JSON inference metadata alongside high-resolution static overlay PNGs directly to this responsive Next.js frontend.",
      icon: LayoutDashboard,
      color: "text-cyan-500",
      bg: "bg-cyan-50 dark:bg-cyan-950/50",
    },
  ];

  return (
    <section id="how-it-works" className="py-12 border-t border-zinc-200/80 dark:border-zinc-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Pipeline Architecture
          </h2>
          <h3 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            How The Analysis System Works
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            A simple, synchronized two-model deep learning architecture designed for clinical explainability.
          </p>
        </div>

        {/* Visual Flowchart Diagram */}
        <div className="mb-10">
          <PipelineDiagram />
        </div>

        {/* Step-by-Step Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-black text-zinc-400 dark:text-zinc-500">
                      {item.step}
                    </span>
                    <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
