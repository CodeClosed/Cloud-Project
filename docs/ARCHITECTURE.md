# System Architecture & Component Design

This document details the architectural principles, data flow, component interactions, and resource management strategies of the Chest X-Ray AI Analysis & Visualization platform.

---

## 🏛️ High-Level Architecture Overview

The system is structured as a layered, modular inference pipeline served by a FastAPI asynchronous web service.

```mermaid
graph TD
    Client["Client / Frontend"] -->|"POST /predict (Multipart File)"| FastAPIRoute["FastAPI Route: /predict (api/main.py)"]
    FastAPIRoute -->|"1. Save Temp Image"| TempDisk["api/temp_uploads/"]
    FastAPIRoute -->|"2. Invoke Pipeline"| UnifiedInference["Unified Inference Engine (src/unified_inference.py)"]
    
    subgraph "Unified Inference Layer"
        UnifiedInference --> ModelLoading["Persistent Model Loader"]
        ModelLoading --> ClfModel["EfficientNetB0 Model (224x224)"]
        ModelLoading --> SegModel["U-Net Model (256x256)"]
        
        ClfModel --> ClfOut["Class Probabilities & Confidence"]
        SegModel --> SegOut["Binary Lung Mask & ROI Bounding Box"]
        
        ClfModel --> GradCAMOut["Gradient-Tape Feature Graph (top_conv)"]
        
        GradCAMOut & SegOut --> OverlayGen["OpenCV Visual Overlay Generator"]
    end
    
    OverlayGen -->|"Save Static PNGs"| StaticDisk["generated_visualizations/"]
    FastAPIRoute -->|"3. Clean Temp File"| TempDisk
    
    FastAPIRoute -->|"4. Return JSON Metadata + URLs"| Client
    Client -->|"GET /visualizations/{request_id}_*.png"| StaticFilesRoute["FastAPI Static Route: /visualizations"]
    StaticFilesRoute -->|"Serve Image Bytes"| StaticDisk
```

---

## 🧩 Component Breakdown

### 1. Web Service Layer (`api/main.py`)
* **Framework:** FastAPI with Uvicorn ASGI server.
* **Responsibilities:**
  * Request validation (file type: JPG, JPEG, PNG; content-type checking).
  * Unique file session generation (`uuid.uuid4()`).
  * Temporary upload persistence to avoid in-memory streaming bottlenecks with large imaging tensors.
  * Delegating execution to `unified_inference.py`.
  * Converting NumPy data types to JSON-safe Python types via recursive `make_json_safe()`.
  * Mounting static file serving for generated PNG visualizations at `/visualizations`.
  * Temporary file cleanup in a `finally` block to guarantee no disk leakage for uploaded raw data.

### 2. Unified Inference Engine (`src/unified_inference.py`)
* **Role:** Single entrypoint module (`analyze_chest_xray`) orchestrating two separate deep learning models, explainability graph extraction, and visual rendering in a single execution pass.
* **Core Principles:**
  * **Zero Redundant Inference:** Intermediates (original image array, binary lung mask, Grad-CAM heatmap array) are captured directly during inference and reused for visualization rendering.
  * **Singleton Model Lifecycle:** TensorFlow `.keras` models are lazily loaded once on first invocation into module-level singletons (`classification_model`, `segmentation_model`) to eliminate repeated disk I/O and graph compilation latency.
  * **Isolated Model Inputs:** Classification and segmentation pipelines maintain dedicated preprocessing tailored to their training resolutions ($224 \times 224 \times 3$ RGB vs $256 \times 256 \times 1$ Grayscale).

### 3. Static Visualization Asset Layer (`generated_visualizations/`)
* **Role:** Storage directory for rendered visualization images.
* **Asset Lifecycle:**
  * Saved as standard uint8 PNG files using OpenCV (`cv2.imwrite`).
  * Named deterministically per inference request:
    * `{request_id}_gradcam.png`
    * `{request_id}_segmentation.png`
  * Served with caching headers through `fastapi.staticfiles.StaticFiles`.

---

## 🔄 End-to-End Request & Data Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as Client
    participant API as FastAPI (api/main.py)
    participant Temp as Temp Storage
    participant Engine as unified_inference.py
    participant Models as TF Keras Models
    participant VizStorage as generated_visualizations/

    User->>API: POST /predict (image file)
    API->>API: Validate MIME type & file extension (.jpg, .jpeg, .png)
    API->>Temp: Write unique temporary file (UUID.ext)
    API->>Engine: analyze_chest_xray(temp_path, output_dir, request_id)
    
    Engine->>Models: predict_chest_xray(temp_path) [EfficientNetB0]
    Models-->>Engine: probabilities, predicted_class, confidence
    
    Engine->>Models: predict_lung_mask(temp_path) [U-Net]
    Models-->>Engine: binary_mask, probability_mask, original_image
    
    Engine->>Models: generate_gradcam(temp_path) [GradientTape on top_conv]
    Models-->>Engine: normalized heatmap array [7x7]
    
    Engine->>Engine: generate_gradcam_overlay() [Resize, COLORMAP_JET, Blend 60/40]
    Engine->>Engine: generate_segmentation_overlay() [Tint 35%, Contours]
    
    Engine->>VizStorage: Write {request_id}_gradcam.png
    Engine->>VizStorage: Write {request_id}_segmentation.png
    
    Engine-->>API: Return Python dictionary with metadata & static URLs
    API->>Temp: Delete temporary input file
    API-->>User: HTTP 200 OK (JSON response)
    
    opt Fetch Visualizations
        User->>API: GET /visualizations/{request_id}_gradcam.png
        API->>VizStorage: Read image file
        API-->>User: HTTP 200 OK (image/png stream)
    end
```

---

## 🔒 Thread Safety & Concurrency Considerations

1. **Model Loading:** The models are loaded in memory upon the first request or at startup. TensorFlow 2.x execution in Python is thread-safe for inference (`model.predict(..., verbose=0)` or `model(tensor)`).
2. **File Isolation:** Each request is assigned a distinct UUID v4 string for both temporary uploads and output visualization files. This eliminates race conditions during concurrent API requests.
3. **No Global State Mutations:** Prediction functions receive file paths and parameters explicitly and return discrete dictionary structures without mutating shared application state.
