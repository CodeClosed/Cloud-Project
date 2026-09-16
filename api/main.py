import os
import sys
import uuid
import shutil
from pathlib import Path
from typing import Any, List

import cv2
import numpy as np

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# =============================================================================
# PROJECT PATH CONFIGURATION
# =============================================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = PROJECT_ROOT / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

# =============================================================================
# UNIFIED INFERENCE IMPORT
# =============================================================================

from unified_inference import analyze_chest_xray
from api.schemas import (
    PredictionResponse,
    PredictionResult,
    HealthResponse,
    ClassificationResult,
    SegmentationResult,
    GradCamResult,
    VisualizationsResult,
    BoundingBox,
    ClassProbabilities
)

# =============================================================================
# APPLICATION PATHS
# =============================================================================

TEMP_DIR = PROJECT_ROOT / "api" / "temp_uploads"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

VISUALIZATIONS_DIR = PROJECT_ROOT / "generated_visualizations"
VISUALIZATIONS_DIR.mkdir(parents=True, exist_ok=True)

# =============================================================================
# CONSTANTS & CONFIGURATION
# =============================================================================

MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png"
}

ALLOWED_SUFFIXES = {
    ".jpg",
    ".jpeg",
    ".png"
}

# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="Chest X-Ray AI API",
    description=(
        "API for chest X-ray classification, "
        "lung segmentation metadata, and Grad-CAM explainability analysis."
    ),
    version="1.0.0"
)

# =============================================================================
# CORS MIDDLEWARE CONFIGURATION
# =============================================================================

raw_allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)

allowed_origins: List[str] = [
    origin.strip()
    for origin in raw_allowed_origins.split(",")
    if origin.strip()
]

# Allow localhost dev servers and vercel deployments dynamically
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# STATIC VISUALIZATIONS MOUNT
# =============================================================================

app.mount(
    "/visualizations",
    StaticFiles(directory=str(VISUALIZATIONS_DIR)),
    name="visualizations"
)

# =============================================================================
# JSON SERIALIZATION HELPER
# =============================================================================

def make_json_safe(value: Any):
    if isinstance(value, dict):
        return {
            str(key): make_json_safe(item)
            for key, item in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [
            make_json_safe(item)
            for item in value
        ]
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, (np.integer, np.int32, np.int64)):
        return int(value)
    if isinstance(value, (np.floating, np.float32, np.float64)):
        return float(value)
    if isinstance(value, np.bool_):
        return bool(value)
    if isinstance(value, Path):
        return str(value)
    return value

# =============================================================================
# ROOT ENDPOINT
# =============================================================================

@app.get("/")
def root():
    return {
        "message": "Chest X-Ray AI API is running",
        "docs": "/docs",
        "version": "1.0.0"
    }

# =============================================================================
# HEALTH ENDPOINT
# =============================================================================

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        unified_inference="available",
        version="1.0.0"
    )

# =============================================================================
# PREDICTION ENDPOINT
# =============================================================================

@app.post("/predict", response_model=PredictionResponse)
async def predict_chest_xray(
    file: UploadFile = File(...)
):
    # -------------------------------------------------------------------------
    # 1. FILE VALIDATION
    # -------------------------------------------------------------------------
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Missing filename. Please upload a valid image file."
        )

    safe_original_name = Path(file.filename).name

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Please upload a JPG, JPEG, or PNG image."
            )
        )

    suffix = Path(safe_original_name).suffix.lower()

    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file extension. "
                "Allowed extensions: .jpg, .jpeg, .png"
            )
        )

    # -------------------------------------------------------------------------
    # 2. CREATE UNIQUE TEMPORARY FILE
    # -------------------------------------------------------------------------
    unique_id = str(uuid.uuid4())
    temp_filename = f"{unique_id}{suffix}"
    temp_path = TEMP_DIR / temp_filename

    try:
        # ---------------------------------------------------------------------
        # 3. SAVE UPLOADED FILE & ENFORCE SIZE LIMIT
        # ---------------------------------------------------------------------
        file_size = 0
        with open(temp_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File size exceeds the {MAX_FILE_SIZE // (1024 * 1024)}MB limit."
                    )
                buffer.write(chunk)

        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty."
            )

        # ---------------------------------------------------------------------
        # 4. IMAGE INTEGRITY CHECK
        # ---------------------------------------------------------------------
        test_img = cv2.imread(str(temp_path))
        if test_img is None or test_img.size == 0:
            raise HTTPException(
                status_code=400,
                detail="Corrupted or invalid image file. Unable to decode image data."
            )

        # ---------------------------------------------------------------------
        # 5. RUN UNIFIED INFERENCE
        # ---------------------------------------------------------------------
        request_id = str(uuid.uuid4())

        # Save a persistent copy of the input image so it is always accessible via URL
        original_vis_filename = f"{request_id}_original.png"
        original_vis_path = VISUALIZATIONS_DIR / original_vis_filename
        cv2.imwrite(str(original_vis_path), test_img)

        result = analyze_chest_xray(
            str(temp_path),
            output_dir=VISUALIZATIONS_DIR,
            request_id=request_id
        )

        safe_result = make_json_safe(result)

        # ---------------------------------------------------------------------
        # 6. ASSEMBLE STRUCTURED RESPONSE (Omit internal filesystem paths)
        # ---------------------------------------------------------------------
        structured_response = PredictionResponse(
            success=True,
            result=PredictionResult(
                request_id=request_id,
                filename=safe_original_name,
                classification=ClassificationResult(
                    predicted_class=safe_result["classification"]["predicted_class"],
                    predicted_label=safe_result["classification"]["predicted_label"],
                    confidence=safe_result["classification"]["confidence"],
                    confidence_category=safe_result["classification"]["confidence_category"],
                    class_probabilities=ClassProbabilities(
                        covid=safe_result["classification"]["class_probabilities"]["covid"],
                        normal=safe_result["classification"]["class_probabilities"]["normal"],
                        pneumonia=safe_result["classification"]["class_probabilities"]["pneumonia"],
                    )
                ),
                segmentation=SegmentationResult(
                    lung_coverage=safe_result["segmentation"]["lung_coverage"],
                    bounding_box=BoundingBox(
                        x_min=safe_result["segmentation"]["bounding_box"]["x_min"],
                        x_max=safe_result["segmentation"]["bounding_box"]["x_max"],
                        y_min=safe_result["segmentation"]["bounding_box"]["y_min"],
                        y_max=safe_result["segmentation"]["bounding_box"]["y_max"],
                        width=safe_result["segmentation"]["bounding_box"]["width"],
                        height=safe_result["segmentation"]["bounding_box"]["height"],
                    ),
                    lung_roi_shape=list(safe_result["segmentation"]["lung_roi_shape"])
                ),
                gradcam=GradCamResult(
                    predicted_class=safe_result["gradcam"]["predicted_class"],
                    target_class=safe_result["gradcam"]["target_class"],
                    confidence=safe_result["gradcam"]["confidence"],
                    heatmap_shape=list(safe_result["gradcam"]["heatmap_shape"])
                ),
                visualizations=VisualizationsResult(
                    original_image_url=f"/visualizations/{original_vis_filename}",
                    gradcam_overlay_url=safe_result["visualizations"]["gradcam_overlay_url"],
                    segmentation_overlay_url=safe_result["visualizations"]["segmentation_overlay_url"]
                )
            )
        )

        return structured_response

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Inference processing failed. Please verify the image and try again."
            )
        )

    finally:
        # ---------------------------------------------------------------------
        # 7. CLEAN UP TEMPORARY UPLOAD
        # ---------------------------------------------------------------------
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass

        await file.close()
