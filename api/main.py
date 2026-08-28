import sys
import uuid
import shutil
from pathlib import Path
from typing import Any

import numpy as np

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException
)
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


# =============================================================================
# APPLICATION PATHS
# =============================================================================

TEMP_DIR = PROJECT_ROOT / "api" / "temp_uploads"

TEMP_DIR.mkdir(
    parents=True,
    exist_ok=True
)

VISUALIZATIONS_DIR = PROJECT_ROOT / "generated_visualizations"

VISUALIZATIONS_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="Chest X-Ray AI API",
    description=(
        "API for chest X-ray classification, "
        "lung segmentation metadata, and Grad-CAM analysis."
    ),
    version="1.0.0"
)

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

    if isinstance(
        value,
        (
            np.integer,
            np.int32,
            np.int64
        )
    ):

        return int(value)

    if isinstance(
        value,
        (
            np.floating,
            np.float32,
            np.float64
        )
    ):

        return float(value)

    if isinstance(value, np.bool_):

        return bool(value)

    if isinstance(value, Path):

        return str(value)

    return value


# =============================================================================
# ALLOWED IMAGE TYPES
# =============================================================================

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
# ROOT ENDPOINT
# =============================================================================

@app.get("/")
def root():

    return {
        "message": "Chest X-Ray AI API is running",
        "docs": "/docs"
    }


# =============================================================================
# HEALTH ENDPOINT
# =============================================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "unified_inference": "available"
    }


# =============================================================================
# PREDICTION ENDPOINT
# =============================================================================

@app.post("/predict")
async def predict_chest_xray(
    file: UploadFile = File(...)
):

    # -------------------------------------------------------------------------
    # FILE VALIDATION
    # -------------------------------------------------------------------------

    if (
        file.content_type
        not in ALLOWED_CONTENT_TYPES
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Please upload a JPG, JPEG, or PNG image."
            )
        )

    suffix = Path(
        file.filename
    ).suffix.lower()

    if suffix not in ALLOWED_SUFFIXES:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file extension. "
                "Allowed extensions: .jpg, .jpeg, .png"
            )
        )

    # -------------------------------------------------------------------------
    # CREATE UNIQUE TEMPORARY FILE
    # -------------------------------------------------------------------------

    temp_filename = (
        f"{uuid.uuid4()}{suffix}"
    )

    temp_path = (
        TEMP_DIR / temp_filename
    )

    try:

        # ---------------------------------------------------------------------
        # SAVE UPLOADED FILE
        # ---------------------------------------------------------------------

        with open(
            temp_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        # ---------------------------------------------------------------------
        # RUN UNIFIED INFERENCE
        # ---------------------------------------------------------------------

        request_id = str(uuid.uuid4())

        result = analyze_chest_xray(
            str(temp_path),
            output_dir=VISUALIZATIONS_DIR,
            request_id=request_id
        )

        # ---------------------------------------------------------------------
        # JSON-SAFE RESPONSE
        # ---------------------------------------------------------------------

        safe_result = make_json_safe(
            result
        )

        return {

            "success": True,

            "result": safe_result
        }

    except HTTPException:

        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Inference failed: "
                f"{str(error)}"
            )
        )

    finally:

        # ---------------------------------------------------------------------
        # CLEAN UP TEMPORARY FILE
        # ---------------------------------------------------------------------

        if temp_path.exists():

            temp_path.unlink()

        await file.close()
