# Chest X-Ray AI Analysis API

> **A two-model AI-assisted chest X-ray analysis system combining multi-class disease classification, lung segmentation, confidence-aware prediction, Grad-CAM explainability, generated visualization overlays, and a FastAPI backend.**

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Current Project Status](#2-current-project-status)
- [3. Final System Architecture](#3-final-system-architecture)
- [4. The Two Trained Models](#4-the-two-trained-models)
- [5. What the System Produces](#5-what-the-system-produces)
- [6. Classification Model](#6-classification-model)
- [7. Lung Segmentation Model](#7-lung-segmentation-model)
- [8. Dataset Information](#8-dataset-information)
- [9. Model Performance](#9-model-performance)
- [10. Confidence-Aware Prediction](#10-confidence-aware-prediction)
- [11. Grad-CAM Explainability](#11-grad-cam-explainability)
- [12. Visualization Generation](#12-visualization-generation)
- [13. Unified Inference Pipeline](#13-unified-inference-pipeline)
- [14. FastAPI Backend](#14-fastapi-backend)
- [15. API Endpoints](#15-api-endpoints)
- [16. API Response Structure](#16-api-response-structure)
- [17. Generated Images](#17-generated-images)
- [18. Project Structure](#18-project-structure)
- [19. Local Installation and Running](#19-local-installation-and-running)
- [20. How to Obtain Test Images](#20-how-to-obtain-test-images)
- [21. Validation and Testing Completed](#21-validation-and-testing-completed)
- [22. Important Design Decisions](#22-important-design-decisions)
- [23. Known Limitations and Medical Disclaimer](#23-known-limitations-and-medical-disclaimer)
- [24. Dockerization Handoff](#24-dockerization-handoff)
- [25. Important Files That Must Not Be Removed](#25-important-files-that-must-not-be-removed)
- [26. Troubleshooting](#26-troubleshooting)
- [27. Development History](#27-development-history)
- [28. Final Handoff Checklist](#28-final-handoff-checklist)

---

# 1. Project Overview

This project implements an integrated AI-assisted chest X-ray analysis pipeline.

A single chest X-ray image is processed by two complementary deep-learning models:

1. **EfficientNetB0** for multi-class chest X-ray classification.
2. **U-Net** for lung segmentation.

The system then extends the raw model predictions with:

- class probabilities;
- prediction confidence;
- confidence categorization;
- lung coverage analysis;
- lung bounding-box extraction;
- lung ROI information;
- Grad-CAM explainability;
- Grad-CAM visualization generation;
- lung segmentation visualization generation;
- FastAPI-based image upload and inference;
- direct URLs for generated visualization PNG files.

The final supported classification classes are:

```text
covid
normal
pneumonia
```

The project is intentionally a **two-model system**.

A previously explored third hierarchical diagnostic model is **out of scope** and is not part of the final architecture.

---

# 2. Current Project Status

## Completed

### Model development

- [x] Classification dataset preparation
- [x] Classification model training
- [x] EfficientNetB0 fine-tuning
- [x] Final classification evaluation
- [x] Confusion-matrix analysis
- [x] Confidence analysis
- [x] Confidence policy definition
- [x] Segmentation dataset preparation
- [x] U-Net training
- [x] Final segmentation evaluation
- [x] Lung mask generation
- [x] Lung ROI extraction

### Explainability and integration

- [x] Grad-CAM implementation
- [x] Grad-CAM target-layer configuration
- [x] Grad-CAM validation
- [x] Grad-CAM/classification consistency fix
- [x] Segmentation visualization support
- [x] Unified inference module
- [x] Persistent inference validation
- [x] Multi-class representative evaluation
- [x] Robustness evaluation
- [x] Correctness-aware audit

### API

- [x] FastAPI application
- [x] Root endpoint
- [x] Health endpoint
- [x] Image upload validation
- [x] `POST /predict`
- [x] Temporary upload cleanup
- [x] JSON-safe response serialization
- [x] Grad-CAM overlay PNG generation
- [x] Segmentation overlay PNG generation
- [x] Static visualization URLs
- [x] Local Swagger UI testing
- [x] Live local FastAPI inference

## Not yet completed

The primary next engineering phase is:

```text
Dockerization
        ↓
Container validation
        ↓
Optional deployment
```

Dockerization is intentionally separated from the completed model and API implementation.

---

# 3. Final System Architecture

The final architecture is:

```text
                         CHEST X-RAY IMAGE
                                 │
                                 ▼
                       FastAPI POST /predict
                                 │
                                 ▼
                       Unified Inference Layer
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
          MODEL 1: CLASSIFICATION         MODEL 2: SEGMENTATION
              EfficientNetB0                    U-Net
                 │                               │
                 ▼                               ▼
       ┌──────────────────────┐        ┌──────────────────────┐
       │ Predicted Class      │        │ Probability Mask     │
       │ Class Probabilities  │        │ Binary Lung Mask     │
       │ Confidence           │        │ Lung Coverage        │
       │ Confidence Category  │        │ Bounding Box         │
       └──────────┬───────────┘        │ Lung ROI             │
                  │                    └──────────┬───────────┘
                  │                               │
                  ▼                               │
            Grad-CAM Generation                   │
                  │                               │
                  ▼                               ▼
          Grad-CAM Overlay PNG            Segmentation Overlay PNG
                  │                               │
                  └───────────────┬───────────────┘
                                  ▼
                         Unified JSON Response
                                  │
                                  ▼
                     /visualizations/<file>.png
```

The classification model and segmentation model serve different purposes.

## Important architecture decision

The classification model receives the **full chest X-ray**.

```text
Full chest X-ray
       ↓
EfficientNetB0
       ↓
COVID / NORMAL / PNEUMONIA
```

The segmentation model is **not used to crop the image and then feed that cropped ROI into the final classifier**.

An exploratory experiment showed that passing segmented/cropped ROIs into the existing classifier introduced an input-distribution mismatch because the classifier was trained on full chest X-rays.

Therefore:

```text
Segmentation = lung analysis and visualization

Classification = full-image diagnostic classification
```

This is an intentional final design decision.

---

# 4. The Two Trained Models

## Model 1 — Chest X-Ray Classification

| Property | Value |
|---|---|
| Architecture | EfficientNetB0 |
| Final model file | `models/classification/best_finetuned_efficientnetb0.keras` |
| Input shape | `224 × 224 × 3` |
| Output classes | 3 |
| Classes | COVID, Normal, Pneumonia |
| Class mapping | COVID=0, Normal=1, Pneumonia=2 |

Capabilities:

- predicts one of three classes;
- returns probabilities for all classes;
- reports maximum prediction confidence;
- maps confidence to low/moderate/high;
- supports Grad-CAM explainability.

## Model 2 — Lung Segmentation

| Property | Value |
|---|---|
| Architecture | U-Net |
| Final model file | `models/segmentation/best_unet.keras` |
| Input shape | `256 × 256 × 1` |
| Output | lung probability mask |
| Binary threshold | `0.5` |

Capabilities:

- produces a lung probability mask;
- produces a binary lung mask;
- calculates lung coverage;
- extracts a lung bounding box;
- extracts a lung ROI;
- supports segmentation overlay generation.

## Model 3

```text
STATUS: OUT OF SCOPE
```

No third model is required for the final project.

---

# 5. What the System Produces

For every valid chest X-ray submitted to the API, the system can produce:

```text
1. Predicted disease class
2. Predicted numeric label
3. Probability for COVID
4. Probability for Normal
5. Probability for Pneumonia
6. Maximum prediction confidence
7. Confidence category
8. Lung coverage
9. Lung bounding box
10. Lung ROI dimensions
11. Grad-CAM predicted class
12. Grad-CAM target class
13. Grad-CAM confidence
14. Grad-CAM heatmap dimensions
15. Grad-CAM overlay PNG URL
16. Lung segmentation overlay PNG URL
```

---

# 6. Classification Model

## Architecture

The final classifier uses transfer learning with **EfficientNetB0**.

The classifier pipeline is:

```text
Chest X-ray
      ↓
Resize to 224 × 224
      ↓
3-channel image
      ↓
EfficientNetB0 backbone
      ↓
Classification head
      ↓
Softmax probabilities
      ↓
COVID / NORMAL / PNEUMONIA
```

## Training approach

The classification model was developed in two stages.

### Stage 1

The EfficientNetB0 backbone was initially frozen.

Configuration included:

```text
Optimizer: Adam
Learning rate: 0.001
Loss: Sparse Categorical Cross-Entropy
Metric: Accuracy
```

Stage 1 result:

```text
Test Accuracy: 94.21%
Test Loss:     0.181395
```

### Fine-tuning

Fine-tuning began from layer index `180`.

Configuration:

```text
Learning rate: 1e-05
Batch Normalization: Frozen
Fine-tuning epochs completed: 15
```

Final result:

```text
Test Accuracy: 96.24%
Test Loss:     0.119097
```

Improvement:

```text
94.21% → 96.24%

Improvement: approximately +2.03 percentage points
```

## Final confusion matrix

Class order:

```text
covid
normal
pneumonia
```

Confusion matrix:

```text
[[339   3   0]
 [  4 336   7]
 [  1  24 322]]
```

The largest systematic error pattern was:

```text
Pneumonia → Normal
```

This is important when interpreting predictions and is one reason the system should be treated as an AI-assisted analysis tool rather than an autonomous diagnostic system.

---

# 7. Lung Segmentation Model

The segmentation model is a U-Net trained to identify lung regions in chest X-rays.

## Input preprocessing

```text
Original X-ray
      ↓
Convert to grayscale
      ↓
Resize to 256 × 256
      ↓
Normalize to [0, 1]
      ↓
U-Net
```

The model returns a probability mask.

The probability mask is converted into a binary mask:

```text
probability >= 0.5 → lung
probability < 0.5  → background
```

## Post-processing

The predicted mask is used to calculate:

- binary lung region;
- lung coverage;
- bounding box;
- lung ROI.

Example logical flow:

```text
Probability Mask
       ↓
Binary Mask
       ↓
Mask original X-ray
       ↓
Locate lung pixels
       ↓
Bounding Box
       ↓
Extract Lung ROI
```

---

# 8. Dataset Information

## 8.1 Classification dataset

The classification dataset used during training contained:

```text
Classes:
- covid
- normal
- pneumonia
```

Earlier dataset preparation contained 6,939 valid balanced images, while the final persisted training configuration contains 6,902 samples after the final project filtering/preparation pipeline.

The final project split used by the persisted model configuration was:

| Split | Samples |
|---|---:|
| Training | 4,831 |
| Validation | 1,035 |
| Test | 1,036 |
| Total | 6,902 |

Class mapping:

```python
{
    "covid": 0,
    "normal": 1,
    "pneumonia": 2
}
```

The source dataset identifier used during project development was:

```text
amanullahasraf/covid19-pneumonia-normal-chest-xray-pa-dataset
```

The dataset is a Kaggle dataset.

### Classification dataset layout

The working project used data equivalent to:

```text
raw_downloads/
└── classification/
    ├── covid/
    ├── normal/
    └── pneumonia/
```

The persistent processed data and split manifests are stored separately under:

```text
data/classification/
├── classification_manifest.csv
└── splits/
    ├── train_manifest.csv
    ├── validation_manifest.csv
    └── test_manifest.csv
```

---

## 8.2 Segmentation dataset

The segmentation pipeline used chest X-ray images paired with lung masks.

The final project dataset contained:

```text
Total pairs: 566

Training:    396
Validation:  85
Test:        85
```

The project used a lung-mask dataset derived from the Montgomery/Shenzhen chest X-ray lung-mask resources used during the segmentation phase.

The persistent segmentation files are represented through:

```text
data/segmentation/
├── segmentation_manifest.csv
└── splits/
    ├── train_manifest.csv
    ├── validation_manifest.csv
    └── test_manifest.csv
```

The original segmentation data are **not required to run inference**.

Only the trained model file is required for the packaged FastAPI inference application.

---

# 9. Model Performance

## Classification

Final fine-tuned EfficientNetB0:

```text
Test samples:      1,036
Correct:             997
Incorrect:            39

Test Accuracy:     0.962355
Test Accuracy:     96.24%

Test Loss:         0.119097
```

## Segmentation

Final U-Net evaluation on the untouched test set:

```text
Test samples:           85
Test Loss:              0.140577
Test Binary Accuracy:   0.974407
Test Dice:              0.939656
Test IoU:               0.888163
```

Approximately:

```text
Binary Accuracy: 97.44%
Dice:            93.97%
IoU:             88.82%
```

### Per-sample segmentation summary

Dice:

```text
Mean:              0.948914
Median:            0.962277
Minimum:           0.779761
Maximum:           0.979547
Std. deviation:    0.034385
```

IoU:

```text
Mean:              0.904660
Median:            0.927296
Minimum:           0.639023
Maximum:           0.959915
Std. deviation:    0.057819
```

---

# 10. Confidence-Aware Prediction

The system does not return only the predicted class.

It also reports the model's maximum softmax probability and maps that value to a confidence category.

## Confidence policy

| Category | Rule |
|---|---|
| `low` | confidence `< 0.70` |
| `moderate` | `0.70 ≤ confidence < 0.90` |
| `high` | confidence `≥ 0.90` |

The policy is stored in:

```text
configs/classification_confidence_policy.json
```

## Important interpretation

Confidence means:

> how strongly the model favors its selected output under its learned probability distribution.

Confidence does **not** guarantee that the prediction is medically correct.

A high-confidence prediction can still be incorrect.

---

# 11. Grad-CAM Explainability

Grad-CAM is used to provide an interpretable visualization of image regions that contributed to the classifier's selected prediction.

## Target layer

The configured final convolutional target layer is:

```text
top_conv
```

The Grad-CAM configuration is stored in:

```text
configs/classification_gradcam_config.json
```

## Internal process

```text
Input X-ray
      ↓
EfficientNetB0
      ↓
Authoritative classification prediction
      ↓
Select predicted class as default Grad-CAM target
      ↓
Compute gradients
      ↓
Weight convolutional feature maps
      ↓
Generate 2D heatmap
      ↓
Normalize to [0, 1]
      ↓
Resize to original image size
      ↓
Apply colormap
      ↓
Blend with original X-ray
      ↓
Save Grad-CAM overlay PNG
```

The raw Grad-CAM heatmap has a model-level shape of:

```text
(7, 7)
```

The API visualization overlay is resized to the original uploaded image dimensions.

## Consistency design

The Grad-CAM implementation was explicitly corrected so that its default prediction source is consistent with the authoritative classification path.

The expected invariant is:

```text
Classification predicted class
            ==
Grad-CAM predicted class
            ==
Grad-CAM default target class
```

This was validated on representative samples from all three classes.

---

# 12. Visualization Generation

The project generates two visualization outputs.

## 12.1 Grad-CAM overlay

The process is:

```text
Original X-ray
      +
Resized Grad-CAM heatmap
      ↓
OpenCV colormap
      ↓
Alpha blending
      ↓
Grad-CAM overlay PNG
```

The resulting image visually represents regions that contributed to the model's selected class.

## 12.2 Lung segmentation overlay

The process is:

```text
Original X-ray
      +
Binary lung mask
      ↓
Colored lung overlay
      +
Lung contour
      ↓
Segmentation overlay PNG
```

The resulting image visually represents the region identified as lung tissue by the U-Net.

## Important distinction

These two visualizations answer different questions:

```text
Grad-CAM:
"What image regions influenced the classifier?"

Segmentation:
"What image region did the U-Net identify as lungs?"
```

They should not be interpreted as equivalent outputs.

---

# 13. Unified Inference Pipeline

The main reusable inference interface is:

```python
analyze_chest_xray(image_path)
```

The current implementation additionally supports optional output information used by the API:

```python
analyze_chest_xray(
    image_path,
    output_dir=None,
    request_id=None
)
```

The function coordinates the two trained models and post-processing pipeline.

## High-level flow

```text
analyze_chest_xray(image_path)
        │
        ├── Classification
        │     ├── preprocess image
        │     ├── predict class probabilities
        │     ├── select predicted class
        │     └── determine confidence category
        │
        ├── Segmentation
        │     ├── preprocess image
        │     ├── generate probability mask
        │     ├── generate binary mask
        │     ├── calculate lung coverage
        │     ├── calculate bounding box
        │     └── determine ROI shape
        │
        ├── Grad-CAM
        │     ├── use authoritative predicted class
        │     ├── compute heatmap
        │     └── validate target consistency
        │
        └── Visualization generation
              ├── Grad-CAM overlay PNG
              └── Segmentation overlay PNG
```

The primary module is:

```text
src/unified_inference.py
```

---

# 14. FastAPI Backend

The FastAPI application is located at:

```text
api/main.py
```

The backend imports the unified inference module and exposes HTTP endpoints.

## Main responsibilities

The API handles:

- receiving image uploads;
- validating the uploaded file;
- writing temporary uploads to disk;
- calling unified inference;
- generating a unique request UUID;
- creating visualization PNG files;
- returning JSON-safe inference metadata;
- exposing visualization images through static routes;
- cleaning temporary uploaded images after inference.

The API does not retrain either model.

The trained models are loaded for inference only.

---

# 15. API Endpoints

## `GET /`

Root endpoint.

Provides basic API information.

---

## `GET /health`

Health check endpoint.

Expected conceptual response:

```json
{
  "status": "healthy",
  "unified_inference": "available"
}
```

Use this endpoint to verify that the FastAPI application is running.

---

## `POST /predict`

Accepts a chest X-ray image.

### Request type

```text
multipart/form-data
```

### Form field

```text
file
```

### Example using cURL

```bash
curl -X POST "http://127.0.0.1:8000/predict" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@example_chest_xray.png;type=image/png"
```

### What happens internally

```text
Upload
   ↓
Validate
   ↓
Save temporary file
   ↓
Generate request UUID
   ↓
Run unified inference
   ↓
Generate Grad-CAM PNG
   ↓
Generate segmentation PNG
   ↓
Return JSON
   ↓
Delete temporary uploaded file
```

---

## `GET /visualizations/{filename}`

FastAPI exposes generated PNG files through a static route.

Example:

```text
/visualizations/
```

A typical generated file URL looks like:

```text
/visualizations/
8a4b5df7-a503-4688-bc78-cc275423036d_gradcam.png
```

When running locally, the full URL is:

```text
http://127.0.0.1:8000/visualizations/8a4b5df7-a503-4688-bc78-cc275423036d_gradcam.png
```

The same structure applies to segmentation:

```text
http://127.0.0.1:8000/visualizations/<request-id>_segmentation.png
```

---

# 16. API Response Structure

A successful prediction response follows this structure:

```json
{
  "success": true,
  "result": {
    "image_path": "...",
    "classification": {
      "predicted_class": "covid",
      "predicted_label": 0,
      "confidence": 0.9999,
      "confidence_category": "high",
      "class_probabilities": {
        "covid": 0.9999,
        "normal": 0.0000,
        "pneumonia": 0.0001
      }
    },
    "segmentation": {
      "lung_coverage": 0.2558,
      "bounding_box": {
        "x_min": 43,
        "x_max": 587,
        "y_min": 240,
        "y_max": 625,
        "width": 545,
        "height": 386
      },
      "lung_roi_shape": [
        386,
        545
      ]
    },
    "gradcam": {
      "predicted_class": "covid",
      "target_class": "covid",
      "confidence": 0.9999,
      "heatmap_shape": [
        7,
        7
      ]
    },
    "visualizations": {
      "gradcam_overlay_url": "/visualizations/<request-id>_gradcam.png",
      "segmentation_overlay_url": "/visualizations/<request-id>_segmentation.png"
    }
  }
}
```

The exact prediction values depend on the uploaded image.

---

# 17. Generated Images

Generated visualization files are stored in:

```text
generated_visualizations/
```

For each successful prediction request, the system creates:

```text
generated_visualizations/
├── <UUID>_gradcam.png
└── <UUID>_segmentation.png
```

Example:

```text
generated_visualizations/
├── 8a4b5df7-a503-4688-bc78-cc275423036d_gradcam.png
└── 8a4b5df7-a503-4688-bc78-cc275423036d_segmentation.png
```

## Why UUIDs are used

A unique request ID prevents filename collisions when multiple requests are processed.

```text
Request A → UUID A → unique images
Request B → UUID B → unique images
```

## Current cleanup behavior

Generated visualization files are currently retained for inspection.

Automatic cleanup has intentionally **not** been implemented yet.

For production deployment, the team should decide on a storage lifecycle strategy.

Possible future approaches:

```text
- delete files after a time limit;
- scheduled cleanup;
- maximum file-count limit;
- cloud object storage;
- database-backed metadata;
- per-user or per-request isolation.
```

---

# 18. Project Structure

The local deployment package currently follows this structure:

```text
chest_xray_api/
│
├── api/
│   ├── __init__.py
│   ├── main.py
│   └── temp_uploads/
│
├── configs/
│   ├── classification_confidence_policy.json
│   └── classification_gradcam_config.json
│
├── generated_visualizations/
│   ├── <uuid>_gradcam.png
│   └── <uuid>_segmentation.png
│
├── models/
│   ├── classification/
│   │   └── best_finetuned_efficientnetb0.keras
│   │
│   └── segmentation/
│       └── best_unet.keras
│
├── src/
│   └── unified_inference.py
│
├── validate_visualizations.py
├── validate_static_visualizations.py
├── requirements.txt
└── README.md
```

## Important files

### `api/main.py`

Responsible for:

- FastAPI application initialization;
- endpoint definitions;
- upload handling;
- inference invocation;
- temporary-file cleanup;
- static visualization route.

### `src/unified_inference.py`

The core inference module.

Responsible for:

- model path resolution;
- persistent model loading;
- classification preprocessing;
- classification prediction;
- confidence categorization;
- segmentation preprocessing;
- mask generation;
- ROI extraction;
- Grad-CAM generation;
- overlay generation;
- visualization file writing;
- unified result construction.

### `models/classification/best_finetuned_efficientnetb0.keras`

Final trained classification model.

### `models/segmentation/best_unet.keras`

Final trained lung segmentation model.

### `configs/classification_confidence_policy.json`

Defines confidence categories.

### `configs/classification_gradcam_config.json`

Defines the Grad-CAM target-layer configuration.

---

# 19. Local Installation and Running

## Prerequisites

Recommended:

```text
Python 3.10 or compatible Python version
pip
virtual environment support
```

The local project was tested using a Python virtual environment.

## Step 1 — Open the project

```bash
cd chest_xray_api
```

## Step 2 — Create a virtual environment

Windows:

```bash
python -m venv .venv
```

## Step 3 — Activate it

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Windows Command Prompt:

```cmd
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

## Step 4 — Install dependencies

```bash
pip install -r requirements.txt
```

The project requirements include the packages needed for:

- FastAPI;
- Uvicorn;
- multipart uploads;
- TensorFlow;
- OpenCV;
- NumPy;
- Pillow.

## Step 5 — Start the API

From the project root:

```bash
uvicorn api.main:app --host 127.0.0.1 --port 8000
```

For development with automatic reload:

```bash
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

## Step 6 — Open Swagger UI

Open:

```text
http://127.0.0.1:8000/docs
```

Swagger provides an interactive interface for testing:

```text
GET /
GET /health
POST /predict
```

---

# 20. How to Obtain Test Images

The deployment package intentionally does **not** need the entire training dataset.

You only need one valid chest X-ray image to test:

```text
POST /predict
```

## Option A — Use an image from the original project

If you still have the original project in Google Drive or local storage, sample images can be found under:

```text
raw_downloads/classification/covid/
raw_downloads/classification/normal/
raw_downloads/classification/pneumonia/
```

Example representative files previously used during validation include:

```text
COVID:
COVID19(197).jpg

Normal:
00001021_001.png

Pneumonia:
person1663_bacteria_4412.jpeg
```

The exact location depends on whether you are using the original Google Colab project or a local copy.

## Option B — Download the classification dataset

The project used the Kaggle dataset identifier:

```text
amanullahasraf/covid19-pneumonia-normal-chest-xray-pa-dataset
```

After obtaining the dataset, choose a single image from:

```text
covid/
normal/
pneumonia/
```

You do not need to download the segmentation dataset to test the inference API because the U-Net model is already included.

## Option C — Use your own chest X-ray image

Any compatible chest X-ray image can be uploaded through Swagger.

Common formats used during development include:

```text
.png
.jpg
.jpeg
```

### Important

The API is designed for chest X-ray images.

Uploading arbitrary photographs is not a meaningful use case and does not imply that the model can interpret non-radiographic images.

---

# 21. Validation and Testing Completed

The project was validated in multiple stages.

## Classification validation

The final model was evaluated on an untouched test set of:

```text
1,036 samples
```

Final result:

```text
Accuracy: 96.24%
```

## Segmentation validation

The final U-Net was evaluated on an untouched test set of:

```text
85 samples
```

Final result:

```text
Binary Accuracy: 97.44%
Dice:            0.939656
IoU:             0.888163
```

## Confidence validation

A confidence baseline audit evaluated all 1,036 classification test samples.

```text
Correct predictions: 997
Incorrect predictions: 39
Mean confidence: 0.958649
Median confidence: 0.997676
```

Confidence analysis showed that accuracy generally increased with confidence.

However:

```text
Confidence != guaranteed correctness
```

## Grad-CAM validation

The Grad-CAM implementation was validated for:

```text
COVID
NORMAL
PNEUMONIA
```

The final implementation uses the same authoritative classification prediction path to select the default Grad-CAM target.

## Representative unified inference validation

Three representative samples were evaluated:

```text
COVID:      PASS
NORMAL:     PASS
PNEUMONIA:  PASS
```

Validation included:

- classification;
- probability normalization;
- segmentation output;
- Grad-CAM output;
- classification/Grad-CAM consistency;
- Grad-CAM prediction/target consistency.

Final result:

```text
Correct classifications: 3/3
Valid segmentation outputs: 3/3
Valid Grad-CAM outputs: 3/3
Classification ↔ Grad-CAM consistency: 3/3
Grad-CAM prediction ↔ target consistency: 3/3
```

## Robustness evaluation

A deterministic sample of:

```text
5 COVID
5 NORMAL
5 PNEUMONIA
```

was used.

Total:

```text
15 samples
```

Pipeline robustness result:

```text
Successful inference:                  15/15
Valid predictions:                     15/15
Finite confidences:                    15/15
Valid probability distributions:       15/15
Normalized probabilities:              15/15
Valid segmentations:                   15/15
Valid Grad-CAM outputs:                15/15
Classification ↔ Grad-CAM consistency: 15/15
Grad-CAM target consistency:           15/15
```

### Important interpretation

The separate correctness audit of these 15 selected robustness samples produced:

```text
Correct predictions: 10/15
Deterministic sample accuracy: 66.67%
```

This robustness-sample accuracy is **not** the final model accuracy.

It is an audit of the selected deterministic sample only.

The authoritative full classification test evaluation remains:

```text
96.24% accuracy on 1,036 test samples
```

---

# 22. Important Design Decisions

## 22.1 Two models only

The final project contains:

```text
EfficientNetB0
+
U-Net
```

There is no active third model.

## 22.2 Full image classification

The classifier receives the full chest X-ray.

The segmentation ROI is not substituted for the classifier's original input.

## 22.3 Segmentation is still useful

The segmentation model provides:

- lung localization;
- lung coverage;
- bounding box;
- ROI information;
- segmentation visualization.

## 22.4 Grad-CAM explains the classification model

Grad-CAM is generated from the classification model's feature representations.

It is not a segmentation mask and should not be treated as one.

## 22.5 Persistent model loading

The inference module uses persistent model variables so that models are loaded once and reused within the process.

Conceptually:

```python
classification_model = None
segmentation_model = None
```

Models are loaded on demand and then reused.

This is important for API efficiency.

## 22.6 No duplicate inference for visualization generation

The visualization pipeline reuses intermediate arrays generated during the unified inference pass.

The system does not intentionally rerun model inference solely to create the overlay images.

---

# 23. Known Limitations and Medical Disclaimer

## Medical disclaimer

**This project is an educational and research-oriented AI system. It is not a medical device and must not be used as a replacement for professional medical diagnosis, treatment, or clinical decision-making.**

The outputs:

```text
COVID
Normal
Pneumonia
Confidence
Grad-CAM
Lung segmentation
```

are model-generated computational results.

They are not equivalent to a radiologist's report.

## Dataset limitations

Model performance is dependent on:

- the source datasets;
- dataset preprocessing;
- class definitions;
- image acquisition conditions;
- distribution similarity between training data and future images.

Performance on the original test set does not guarantee identical performance in external clinical environments.

## Confidence limitations

A high confidence score does not prove correctness.

## Grad-CAM limitations

Grad-CAM is an explainability visualization.

It should not be interpreted as:

- a pixel-perfect disease segmentation;
- a pathological lesion mask;
- a clinically validated localization map.

## Segmentation limitations

The U-Net identifies lung regions.

It does not perform infection segmentation or disease-severity quantification in the final project.

## Static visualization storage

Generated PNG files are currently retained.

A production deployment should implement a cleanup or storage policy.

---

# 24. Dockerization Handoff

The AI/application implementation is complete enough to hand over for containerization.

## Recommended Dockerization responsibility

The Dockerization phase should include:

### 1. Create a `Dockerfile`

The container must include:

```text
Python runtime
TensorFlow
FastAPI
Uvicorn
OpenCV
NumPy
Pillow
python-multipart
```

### 2. Preserve the required project structure

The container must contain:

```text
api/
src/
models/
configs/
requirements.txt
```

### 3. Ensure model paths remain valid

The project uses paths relative to the project root.

The Docker container should preserve:

```text
PROJECT_ROOT
```

relationships.

Do not hardcode the developer's local Windows paths.

## Recommended container structure

```text
/app
├── api
├── configs
├── generated_visualizations
├── models
├── src
├── requirements.txt
└── ...
```

## Recommended command

The final container should run conceptually as:

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

Note the difference:

```text
Local-only:
127.0.0.1

Container-accessible:
0.0.0.0
```

## Port

The current development server uses:

```text
8000
```

The Docker configuration should expose:

```text
8000
```

## Important Dockerization constraint

Do not remove or rename these model files:

```text
models/classification/best_finetuned_efficientnetb0.keras

models/segmentation/best_unet.keras
```

The inference code expects them.

## Generated visualization directory

The container must allow writing to:

```text
generated_visualizations/
```

The directory is created automatically by the application if it does not already exist.

The Docker implementation should ensure the running process has write permission.

## Temporary uploads

The API uses temporary upload storage.

The container must allow writing to the API's temporary upload directory.

## Suggested Docker validation

After building the container:

```text
1. Start the container.
2. Call GET /health.
3. Open /docs.
4. Upload a chest X-ray to POST /predict.
5. Confirm HTTP 200.
6. Confirm classification output.
7. Confirm segmentation output.
8. Confirm Grad-CAM output.
9. Open Grad-CAM visualization URL.
10. Open segmentation visualization URL.
```

The Docker phase should validate the complete end-to-end application, not only confirm that the container starts.

---

# 25. Important Files That Must Not Be Removed

## Required model files

```text
models/classification/best_finetuned_efficientnetb0.keras
models/segmentation/best_unet.keras
```

## Required configuration files

```text
configs/classification_confidence_policy.json
configs/classification_gradcam_config.json
```

## Required inference code

```text
src/unified_inference.py
```

## Required API code

```text
api/main.py
api/__init__.py
```

## Required dependencies

```text
requirements.txt
```

## Generated at runtime

```text
generated_visualizations/
api/temp_uploads/
```

The exact contents of these runtime directories do not need to be versioned as permanent artifacts.

---

# 26. Troubleshooting

## Problem: `ModuleNotFoundError`

Ensure the virtual environment is active:

```bash
.venv\Scripts\activate
```

Then reinstall:

```bash
pip install -r requirements.txt
```

---

## Problem: TensorFlow cannot load the model

Check that both files exist:

```text
models/classification/best_finetuned_efficientnetb0.keras

models/segmentation/best_unet.keras
```

Also verify that `src/unified_inference.py` is running relative to the correct project root.

---

## Problem: `POST /predict` returns an error

Check:

1. the uploaded file is an image;
2. the file is a readable chest X-ray image;
3. the model files exist;
4. TensorFlow is installed correctly;
5. the API terminal contains the underlying exception.

---

## Problem: Swagger does not show the latest API changes

Restart Uvicorn.

Without reload:

```text
Stop server
Restart server
```

With development reload:

```bash
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## Problem: Visualization URL returns 404

Check:

```text
generated_visualizations/
```

Verify that the expected PNG file exists.

Then verify the application mounted the static directory:

```text
/visualizations
```

The response URL should correspond to the generated filename.

---

## Problem: `address already in use`

Another process may already be using port `8000`.

Stop the existing Uvicorn process or choose another port.

Example:

```bash
uvicorn api.main:app --host 127.0.0.1 --port 8001
```

Then open:

```text
http://127.0.0.1:8001/docs
```

---

## Problem: Generated visualization files keep accumulating

This is expected with the current implementation.

Automatic deletion has not been implemented yet.

A future cleanup mechanism can be added during deployment.

---

# 27. Development History

The project began as a broader multi-stage chest X-ray AI research direction.

The development process included:

```text
Dataset preparation
      ↓
Segmentation development
      ↓
Classification development
      ↓
EfficientNetB0 fine-tuning
      ↓
U-Net validation
      ↓
Lung ROI experiments
      ↓
Final architecture revision
      ↓
Two-model architecture lock
      ↓
Confidence analysis
      ↓
Grad-CAM implementation
      ↓
Segmentation visualization
      ↓
Persistent unified inference
      ↓
Cross-component consistency fixes
      ↓
Robustness validation
      ↓
FastAPI integration
      ↓
Visualization image generation
      ↓
Static visualization serving
      ↓
Dockerization handoff
```

## Historical note

An earlier design explored a more complex hierarchical Model 3 path.

That direction was formally discontinued.

The final project intentionally focuses on:

```text
Model 1: EfficientNetB0 classification
+
Model 2: U-Net lung segmentation
+
Confidence analysis
+
Grad-CAM explainability
+
Visualization
+
FastAPI integration
```

---

# 28. Final Handoff Checklist

Before Dockerization begins, confirm the following.

## Required files

- [ ] `api/__init__.py`
- [ ] `api/main.py`
- [ ] `src/unified_inference.py`
- [ ] `models/classification/best_finetuned_efficientnetb0.keras`
- [ ] `models/segmentation/best_unet.keras`
- [ ] `configs/classification_confidence_policy.json`
- [ ] `configs/classification_gradcam_config.json`
- [ ] `requirements.txt`

## Local functionality

- [ ] Virtual environment works.
- [ ] Dependencies install successfully.
- [ ] Uvicorn starts.
- [ ] `/health` returns HTTP 200.
- [ ] `/docs` opens.
- [ ] `POST /predict` accepts an image.
- [ ] Classification result is returned.
- [ ] Segmentation metadata is returned.
- [ ] Grad-CAM metadata is returned.
- [ ] Grad-CAM PNG is generated.
- [ ] Segmentation PNG is generated.
- [ ] Visualization URLs are returned.
- [ ] Visualization URLs open successfully.

## Model invariants

- [ ] Classification model unchanged.
- [ ] Segmentation model unchanged.
- [ ] Confidence policy preserved.
- [ ] Grad-CAM configuration preserved.
- [ ] Classification remains full-image based.
- [ ] No discontinued Model 3 is required.

---

# Final Summary

This project implements a complete local AI-assisted chest X-ray analysis backend built around two trained deep-learning models.

```text
┌─────────────────────────────────────────────────────┐
│                CHEST X-RAY AI SYSTEM                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  MODEL 1                                            │
│  EfficientNetB0                                     │
│  ├── COVID                                          │
│  ├── Normal                                         │
│  └── Pneumonia                                      │
│                                                     │
│  MODEL 2                                            │
│  U-Net                                              │
│  └── Lung Segmentation                              │
│                                                     │
│  INTEGRATION                                        │
│  ├── Confidence Categories                          │
│  ├── Lung Coverage                                  │
│  ├── Bounding Box                                   │
│  ├── Lung ROI                                       │
│  ├── Grad-CAM                                       │
│  ├── Grad-CAM Overlay PNG                           │
│  └── Segmentation Overlay PNG                       │
│                                                     │
│  BACKEND                                            │
│  └── FastAPI                                        │
│      ├── /                                          │
│      ├── /health                                    │
│      ├── /predict                                   │
│      └── /visualizations/{filename}                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The AI model development and application integration are complete.

The next engineering phase is:

```text
DOCKERIZATION
      ↓
CONTAINER VALIDATION
      ↓
OPTIONAL DEPLOYMENT
```

The Dockerization team should treat the trained models, unified inference logic, confidence policy, Grad-CAM configuration, and validated FastAPI behavior as the baseline system and should containerize the application without changing the trained-model behavior.

---

## Project Status

```text
Classification Model:        COMPLETE
Segmentation Model:          COMPLETE
Confidence Analysis:         COMPLETE
Grad-CAM:                    COMPLETE
Visualization Generation:    COMPLETE
Unified Inference:           COMPLETE
FastAPI Backend:             COMPLETE
Local API Validation:        COMPLETE
Static Visualization URLs:   COMPLETE

Dockerization:               NEXT PHASE
Deployment:                  OPTIONAL FUTURE PHASE
```

**The project is ready for Dockerization handoff.**
