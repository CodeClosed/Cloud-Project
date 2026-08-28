# Developer & Contributor Guide

This guide is designed for teammates and future developers maintaining, testing, or extending the Chest X-Ray AI Analysis & Visualization project.

---

## 🛠️ 1. Development Environment Setup

### Prerequisites
* **Python:** Version `3.10` or `3.11` (Python 3.11 recommended).
* **OS:** Windows 10/11, Linux (Ubuntu 20.04+), or macOS (Apple Silicon / Intel).

### Step-by-Step Installation

1. **Clone or Navigate to the Repository:**
   ```bash
   cd chest_xray_api
   ```

2. **Create a Virtual Environment:**
   ```bash
   python -m venv .venv
   ```

3. **Activate the Virtual Environment:**
   * **Windows PowerShell:**
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   * **Windows Command Prompt:**
     ```cmd
     .venv\Scripts\activate.bat
     ```
   * **Linux / macOS:**
     ```bash
     source .venv/bin/activate
     ```

4. **Install Dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

---

## 🚀 2. Running the API Server

### Option A: Using Uvicorn Directly
```powershell
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

### Option B: Using Included Scripts
* **PowerShell:** `.\uvicorn.ps1`
* **CMD Batch:** `uvicorn.cmd`

The server will be reachable at:
* Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 🧪 3. Validation & Testing

The repository contains automated test and validation scripts:

### A. Static Visualization & URL Validation
Tests the full pipeline, disk saving, image decodability, URL structure, and metadata invariants:
```powershell
python validate_static_visualizations.py
```

### B. End-to-End API Test Suite
Performs end-to-end inference timing, prints detailed probability distributions, bounding box coordinates, and verifies static file generation:
```powershell
python test_e2e_api.py
```

---

## 📏 4. Code & Architectural Invariants

When contributing to this codebase, always adhere to the following rules:

1. **Model Weights & Invariance:**
   - Never overwrite or modify `models/classification/best_finetuned_efficientnetb0.keras` or `models/segmentation/best_unet.keras` without running full regression evaluation.
   - Do not alter confidence category boundaries in `configs/classification_confidence_policy.json` unless updating clinical evidence thresholds.

2. **Zero Duplicate Inference Passes:**
   - Any new visualization, feature extraction, or downstream metric must reuse intermediate tensors and NumPy arrays already produced during the single `analyze_chest_xray()` invocation.

3. **JSON Serialization Safety:**
   - Raw NumPy arrays (`np.ndarray`) must **never** be returned directly in the FastAPI JSON response. Pass any dictionaries through `make_json_safe()` before serialization.

4. **Temporary File Discipline:**
   - All uploaded images in `api/temp_uploads/` must be unlinked in `finally` blocks to prevent disk leaks.

---

## 💡 5. Extension Ideas & Roadmap

For teammates looking to add features or improve the service:

### 1. Scheduled Cleanup of Static Visualizations
Currently, generated visualizations in `generated_visualizations/` are preserved for review. To manage disk space in high-throughput production:
* Implement an asynchronous background task or cron job (e.g., using `APScheduler` or FastAPI `BackgroundTasks`) to delete PNG files older than $N$ hours.

### 2. Dockerization
Create a standardized container environment:
```dockerfile
# Example Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3. Additional Visualization Options
* Add query parameters to `/predict` (e.g. `?colormap=viridis` or `?alpha=0.5`) to allow clients to customize overlay transparency and color schemes dynamically.
* Add bounding box visualization overlay (drawing the lung bounding rectangle on the X-ray).
