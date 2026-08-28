# Chest X-Ray AI Analysis & Visualization API

An end-to-end medical AI inference service and FastAPI application designed for multi-modal chest radiograph analysis. The platform combines deep learning classification, deep learning lung anatomical segmentation, gradient-weighted class activation mapping (Grad-CAM), and static visual overlay generation.

---

## 📑 Documentation Directory

This `docs/` directory contains complete documentation for developers and collaborators working on this repository:

| Document | Description |
| :--- | :--- |
| **[TEAMMATE_HANDBOOK.md](TEAMMATE_HANDBOOK.md)** | **Start Here!** 5-minute quickstart, codebase map, golden rules, and everyday commands for teammates. |
| **[IMAGE_RETRIEVAL_GUIDE.md](IMAGE_RETRIEVAL_GUIDE.md)** | **How to View & Retrieve Images:** Step-by-step guide with examples in Browser, Python, cURL, PowerShell, and React. |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System architecture, pipeline flowcharts, module interactions, and design principles. |
| **[INFERENCE_PIPELINE.md](INFERENCE_PIPELINE.md)** | Technical deep-dive into the models, preprocessing, Grad-CAM graph tracing, segmentation ROI extraction, and OpenCV visualization blending. |
| **[API_REFERENCE.md](API_REFERENCE.md)** | Comprehensive REST API reference (`/predict`, `/health`, `/visualizations/...`) with payload specifications and examples. |
| **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** | Local environment setup, running the server, executing validation test suites, and guidelines for future extensions. |

---

## 🚀 Key Capabilities

1. **Multi-Class Pathology Classification**
   - EfficientNetB0 fine-tuned on chest radiographs.
   - Outputs class probabilities for **COVID-19**, **Normal**, and **Pneumonia**.
   - Categorizes confidence into **High** ($\ge 0.90$), **Moderate** ($0.70 - 0.90$), and **Low** ($< 0.70$) based on empirical validation.

2. **Anatomical Lung Segmentation**
   - U-Net architecture predicting binary lung masks at native resolution.
   - Calculates lung field area coverage percentage.
   - Computes minimum bounding box coordinates and extracts lung Region of Interest (ROI).

3. **Grad-CAM Visual Explainability**
   - Connects to the final convolutional feature extractor (`top_conv`) in the EfficientNetB0 backbone.
   - Calculates pooled gradient activations for the authoritative predicted class.
   - Generates heatmap overlays blended onto the original radiograph using OpenCV colormaps (`COLORMAP_JET`).

4. **Static Visual Asset Serving**
   - Renders Grad-CAM heatmaps and lung segmentation masks as full-resolution PNG images.
   - Exposes generated assets via static FastAPI URLs (`/visualizations/{request_id}_*.png`).
   - Zero duplicate model inference passes during image generation.

---

## 📂 Repository Structure

```text
chest_xray_api/
│
├── api/                                # FastAPI application layer
│   ├── main.py                         # API endpoints, static mounting & file upload handling
│   └── temp_uploads/                   # Temporary upload directory (auto-cleaned)
│
├── configs/                            # Configuration files
│   ├── classification_confidence_policy.json   # Confidence bin thresholds & policy notes
│   └── classification_gradcam_config.json      # Backbone & target layer configuration
│
├── docs/                               # Developer & architectural documentation
│   ├── README.md                       # Documentation hub (this file)
│   ├── TEAMMATE_HANDBOOK.md            # Teammate onboarding & operations handbook
│   ├── IMAGE_RETRIEVAL_GUIDE.md        # Guide to retrieving & displaying generated images
│   ├── ARCHITECTURE.md                 # System architecture & component design
│   ├── INFERENCE_PIPELINE.md           # Model mechanics & visualization generation
│   ├── API_REFERENCE.md                # REST endpoints, schemas, and usage examples
│   └── DEVELOPMENT_GUIDE.md            # Setup, execution, validation & testing guide
│
├── generated_visualizations/           # Static PNG outputs exposed via /visualizations
│   ├── {request_id}_gradcam.png
│   └── {request_id}_segmentation.png
│
├── models/                             # Trained model weights (.keras format)
│   ├── classification/
│   │   └── best_finetuned_efficientnetb0.keras
│   └── segmentation/
│       └── best_unet.keras
│
├── src/                                # Core inference engine
│   └── unified_inference.py            # Unified 2-model inference & overlay rendering
│
├── requirements.txt                    # Project Python dependencies
├── validate_static_visualizations.py   # Automated validation test suite
├── validate_visualizations.py          # Array & encoding validation test
├── test_e2e_api.py                     # Full end-to-end pipeline test script
├── uvicorn.cmd                         # Windows batch launcher for Uvicorn
└── uvicorn.ps1                         # PowerShell launcher for Uvicorn
```

---

## ⚡ Quick Start

```powershell
# 1. Activate virtual environment
.\.venv\Scripts\Activate.ps1

# 2. Start the API server
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload

# 3. In another terminal, run validation tests
python validate_static_visualizations.py
```
