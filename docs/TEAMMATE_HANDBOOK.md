# 👥 Teammate Onboarding & Operational Handbook

Welcome to the **Chest X-Ray AI Analysis & Visualization** project! This handbook is the primary reference manual for you to get up to speed in 5 minutes, run inference, test endpoints, retrieve images, and safely make modifications.

---

## ⚡ 1. Five-Minute Quickstart

### Step 1: Activate Environment & Install Dependencies
Open PowerShell or your terminal in the repository root:
```powershell
# Activate Python virtual environment
.\.venv\Scripts\Activate.ps1

# (Optional) Verify dependencies
pip install -r requirements.txt
```

### Step 2: Start the FastAPI Server
```powershell
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```
The server will now be live at `http://127.0.0.1:8000`.

### Step 3: Run the Automated Validation Suite
In a second terminal window:
```powershell
python validate_static_visualizations.py
```
If you see `ALL VALIDATION CHECKS PASSED SUCCESSFULLY!`, everything is working perfectly.

---

## 🖼️ 2. How to Generate and View Visualization Images

### Step-by-Step Flow:
1. **Send an Image to `/predict`:**
   * Via Swagger UI at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (Click `POST /predict` -> "Try it out" -> Upload an X-ray image -> Execute).
   * Or via cURL / Python script.

2. **Inspect the JSON Response:**
   Look for the `"visualizations"` object:
   ```json
   "visualizations": {
     "gradcam_overlay_url": "/visualizations/a7804a59-cfde-4b72-b53f-d7c02406300f_gradcam.png",
     "segmentation_overlay_url": "/visualizations/a7804a59-cfde-4b72-b53f-d7c02406300f_segmentation.png"
   }
   ```

3. **View the Generated Images:**
   * **In your browser:** Open `http://127.0.0.1:8000` + the returned path, e.g.:
     `http://127.0.0.1:8000/visualizations/a7804a59-cfde-4b72-b53f-d7c02406300f_gradcam.png`
   * **On local disk:** Open `chest_xray_api/generated_visualizations/` directly in File Explorer.
   * **Detailed Guide:** See **[IMAGE_RETRIEVAL_GUIDE.md](IMAGE_RETRIEVAL_GUIDE.md)** for Python, cURL, PowerShell, and React examples.

---

## 🗺️ 3. Codebase Map: Where Everything Lives

```text
chest_xray_api/
│
├── api/
│   ├── main.py                         # FastAPI routes (/predict, /health, static mount /visualizations)
│   └── temp_uploads/                   # Temporary upload directory (auto-deleted after inference)
│
├── src/
│   └── unified_inference.py            # Core engine: Model loading, Classification, U-Net, Grad-CAM, Overlay rendering
│
├── models/
│   ├── classification/
│   │   └── best_finetuned_efficientnetb0.keras  # EfficientNetB0 fine-tuned on COVID/Normal/Pneumonia
│   └── segmentation/
│       └── best_unet.keras                     # U-Net predicting lung binary mask
│
├── configs/
│   ├── classification_confidence_policy.json   # Confidence bin thresholds (High >= 0.90, Mod 0.70-0.90, Low < 0.70)
│   └── classification_gradcam_config.json      # Target layer ('top_conv') and backbone configuration
│
├── generated_visualizations/           # Output directory where static PNG overlays are saved
│
├── docs/                               # Complete project documentation
│   ├── README.md                       # Documentation hub
│   ├── TEAMMATE_HANDBOOK.md            # This onboarding guide
│   ├── IMAGE_RETRIEVAL_GUIDE.md        # How to view and download visualization images
│   ├── ARCHITECTURE.md                 # System architecture & sequence diagrams
│   ├── INFERENCE_PIPELINE.md           # Model mechanics & OpenCV image processing
│   ├── API_REFERENCE.md                # Complete REST API specifications
│   └── DEVELOPMENT_GUIDE.md            # Contribution guidelines & future extensions
│
├── validate_static_visualizations.py   # Main automated validation script
├── test_e2e_api.py                     # End-to-end timing & report test script
└── requirements.txt                    # Python package dependencies
```

---

## ⚠️ 4. Golden Rules & Invariants (Do's and Don'ts)

When working on this project, please follow these core principles:

| Rule | Explanation |
| :--- | :--- |
| 🚫 **DO NOT modify the `.keras` model files** | `best_finetuned_efficientnetb0.keras` and `best_unet.keras` are pre-trained and validated. |
| 🚫 **DO NOT run duplicate inference passes** | When generating visualizations or extracting features, reuse the intermediate arrays already produced during the single `analyze_chest_xray()` call. |
| 🚫 **DO NOT return raw NumPy arrays in JSON** | FastAPI/JSON cannot serialize `np.ndarray`. Always return primitives, lists, or static URLs. |
| ✅ **DO maintain temporary file cleanup** | Always delete uploaded temp files in `finally` blocks (see `api/main.py:274-278`). |
| ✅ **DO run validation tests before committing** | Always run `python validate_static_visualizations.py` to ensure no breaking changes. |

---

## 🔧 5. Common Tasks & How-To Recipes

### How to Run Inference in Python Directly
If you want to use the pipeline as a Python library without starting the web server:
```python
from pathlib import Path
import sys
sys.path.insert(0, "src")

from unified_inference import analyze_chest_xray

image_path = Path("path/to/xray.png")
result = analyze_chest_xray(image_path)

print("Class:", result["classification"]["predicted_class"])
print("Confidence:", result["classification"]["confidence"])
print("Lung Coverage:", result["segmentation"]["lung_coverage"])
print("Grad-CAM URL:", result["visualizations"]["gradcam_overlay_url"])
```

### How to Add a New Endpoint to FastAPI
Open `api/main.py` and define your route:
```python
@app.get("/custom-endpoint")
def custom_endpoint():
    return {"message": "Hello from custom endpoint"}
```

---

## 📞 6. Need Help?

* Refer to **[INFERENCE_PIPELINE.md](INFERENCE_PIPELINE.md)** for model math, Grad-CAM layer details, and OpenCV color blending formulas.
* Refer to **[API_REFERENCE.md](API_REFERENCE.md)** for request/response JSON schemas and status codes.
* Refer to **[ARCHITECTURE.md](ARCHITECTURE.md)** for system diagrams and request sequence lifecycles.
