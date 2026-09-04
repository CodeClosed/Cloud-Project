from typing import List, Dict, Any
from pydantic import BaseModel, Field

class DictAccessibleModel(BaseModel):
    def __getitem__(self, item: str) -> Any:
        try:
            return getattr(self, item)
        except AttributeError:
            raise KeyError(item)

    def __contains__(self, item: str) -> bool:
        return hasattr(self, item)

class ClassProbabilities(DictAccessibleModel):
    covid: float = Field(..., description="Probability score for COVID-19")
    normal: float = Field(..., description="Probability score for Normal chest X-ray")
    pneumonia: float = Field(..., description="Probability score for Pneumonia")

class ClassificationResult(DictAccessibleModel):
    predicted_class: str = Field(..., description="Predicted class label ('covid', 'normal', 'pneumonia')")
    predicted_label: int = Field(..., description="Integer label index corresponding to predicted class")
    confidence: float = Field(..., description="Confidence score for the predicted class [0.0 - 1.0]")
    confidence_category: str = Field(..., description="Confidence category: 'low', 'moderate', or 'high'")
    class_probabilities: ClassProbabilities = Field(..., description="Distribution of probabilities across all classes")

class BoundingBox(DictAccessibleModel):
    x_min: int = Field(..., description="Minimum x coordinate of lung bounding box")
    x_max: int = Field(..., description="Maximum x coordinate of lung bounding box")
    y_min: int = Field(..., description="Minimum y coordinate of lung bounding box")
    y_max: int = Field(..., description="Maximum y coordinate of lung bounding box")
    width: int = Field(..., description="Bounding box width")
    height: int = Field(..., description="Bounding box height")

class SegmentationResult(DictAccessibleModel):
    lung_coverage: float = Field(..., description="Fraction of total image area occupied by segmented lung fields")
    bounding_box: BoundingBox = Field(..., description="Extracted bounding box encompassing the lung regions")
    lung_roi_shape: List[int] = Field(..., description="Dimensions (height, width) of extracted lung region-of-interest")

class GradCamResult(DictAccessibleModel):
    predicted_class: str = Field(..., description="Classification model predicted class")
    target_class: str = Field(..., description="Class targeted during Grad-CAM backpropagation")
    confidence: float = Field(..., description="Classification confidence for target class")
    heatmap_shape: List[int] = Field(..., description="Spatial resolution of computed gradient heatmap")

class VisualizationsResult(DictAccessibleModel):
    gradcam_overlay_url: str = Field(..., description="Relative URL path to generated Grad-CAM overlay PNG")
    segmentation_overlay_url: str = Field(..., description="Relative URL path to generated lung segmentation overlay PNG")

class PredictionResult(DictAccessibleModel):
    request_id: str = Field(..., description="Unique UUID identifier for this inference request")
    filename: str = Field(..., description="Sanitized original filename uploaded by the user")
    classification: ClassificationResult
    segmentation: SegmentationResult
    gradcam: GradCamResult
    visualizations: VisualizationsResult

class PredictionResponse(DictAccessibleModel):
    success: bool = Field(default=True, description="Indicates whether inference completed successfully")
    result: PredictionResult

class HealthResponse(DictAccessibleModel):
    status: str = Field(default="healthy", description="Operational status of the API service")
    unified_inference: str = Field(default="available", description="Availability of persistent ML inference engine")
    version: str = Field(default="1.0.0", description="API version")
