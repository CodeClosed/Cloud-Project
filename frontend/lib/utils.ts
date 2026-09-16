import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ConfidenceCategory } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function getConfidenceBadgeColor(category: ConfidenceCategory): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (category) {
    case "high":
      return {
        bg: "bg-emerald-500/10 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-500/30",
        dot: "bg-emerald-500",
      };
    case "moderate":
      return {
        bg: "bg-amber-500/10 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-500/30",
        dot: "bg-amber-500",
      };
    case "low":
    default:
      return {
        bg: "bg-rose-500/10 dark:bg-rose-950/40",
        text: "text-rose-700 dark:text-rose-400",
        border: "border-rose-500/30",
        dot: "bg-rose-500",
      };
  }
}

export function formatClassName(name: string): string {
  if (name.toLowerCase() === "covid") return "COVID-19";
  if (name.toLowerCase() === "normal") return "Normal";
  if (name.toLowerCase() === "pneumonia") return "Pneumonia";
  return name.charAt(0).toUpperCase() + name.slice(1);
}
