export type DiagnosticClass = "covid" | "normal" | "pneumonia";

export type ConfidenceCategory = "low" | "moderate" | "high";

export interface ClassProbabilities {
  covid: number;
  normal: number;
  pneumonia: number;
}

export interface ClassificationResult {
  predicted_class: DiagnosticClass;
  predicted_label: number;
  confidence: number;
  confidence_category: ConfidenceCategory;
  class_probabilities: ClassProbabilities;
}

export interface BoundingBox {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
  width: number;
  height: number;
}

export interface SegmentationResult {
  lung_coverage: number;
  bounding_box: BoundingBox;
  lung_roi_shape: [number, number];
}

export interface GradCamResult {
  predicted_class: string;
  target_class: string;
  confidence: number;
  heatmap_shape: [number, number];
}

export interface VisualizationsResult {
  original_image_url?: string;
  gradcam_overlay_url: string;
  segmentation_overlay_url: string;
}

export interface PredictionResult {
  request_id: string;
  filename: string;
  classification: ClassificationResult;
  segmentation: SegmentationResult;
  gradcam: GradCamResult;
  visualizations: VisualizationsResult;
}

export interface PredictionResponse {
  success: boolean;
  result: PredictionResult;
}

export interface HealthResponse {
  status: string;
  unified_inference: string;
  version: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
