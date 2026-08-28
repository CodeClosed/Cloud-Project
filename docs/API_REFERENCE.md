# REST API Reference Manual

The Chest X-Ray AI API exposes endpoints for running inference, checking service health, and retrieving static visual explainability assets.

* **Base URL:** `http://127.0.0.1:8000`
* **Interactive OpenAPI (Swagger) UI:** `http://127.0.0.1:8000/docs`
* **Alternative ReDoc UI:** `http://127.0.0.1:8000/redoc`

---

## 📌 Endpoint Summary

| Method | Endpoint | Description | Content-Type |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API status and root information | `application/json` |
| `GET` | `/health` | Service health status | `application/json` |
| `POST` | `/predict` | Primary multi-model inference and visualization generation | `multipart/form-data` |
| `GET` | `/visualizations/{filename}` | Retrieve rendered PNG visualization overlay files | `image/png` |

---

## 1. POST `/predict`

Performs full multi-modal analysis (classification, lung segmentation, Grad-CAM generation, and visual overlay creation).

### Request Parameters
* **Type:** `multipart/form-data`
* **Form Field:** `file` (Binary Image File)
* **Supported MIME Types:** `image/jpeg`, `image/jpg`, `image/png`
* **Supported Extensions:** `.jpg`, `.jpeg`, `.png`

### Successful Response (HTTP 200 OK)
```json
{
  "success": true,
  "result": {
    "image_path": "C:\\Users\\vihaa\\OneDrive\\Desktop\\chest_xray_api\\api\\temp_uploads\\9c7f12e8-42fa-48b2-84da-508efbfdb682.png",
    "classification": {
      "predicted_class": "covid",
      "predicted_label": 0,
      "confidence": 0.9999064207077026,
      "confidence_category": "high",
      "class_probabilities": {
        "covid": 0.9999064207077026,
        "normal": 2.4019182092160918e-05,
        "pneumonia": 6.951638351893052e-05
      }
    },
    "segmentation": {
      "lung_coverage": 0.25584428129829984,
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
      "confidence": 0.9999064207077026,
      "heatmap_shape": [
        7,
        7
      ]
    },
    "visualizations": {
      "gradcam_overlay_url": "/visualizations/a7804a59-cfde-4b72-b53f-d7c02406300f_gradcam.png",
      "segmentation_overlay_url": "/visualizations/a7804a59-cfde-4b72-b53f-d7c02406300f_segmentation.png"
    }
  }
}
```

### Error Responses

#### 400 Bad Request (Invalid Media Type)
```json
{
  "detail": "Unsupported file type. Please upload a JPG, JPEG, or PNG image."
}
```

#### 400 Bad Request (Invalid File Suffix)
```json
{
  "detail": "Unsupported file extension. Allowed extensions: .jpg, .jpeg, .png"
}
```

#### 500 Internal Server Error (Inference Failure)
```json
{
  "detail": "Inference failed: <error description>"
}
```

---

## 2. GET `/visualizations/{filename}`

Static file endpoint serving the generated visualization PNG images.

### Parameters
* `filename` (path parameter, string): Name of the generated file (e.g., `a7804a59-cfde-4b72-b53f-d7c02406300f_gradcam.png`).

### Response
* **HTTP 200 OK:** Binary image stream (`image/png`).
* **HTTP 404 Not Found:** File does not exist.

---

## 3. GET `/health`

Verifies that the API server is operational.

```json
{
  "status": "healthy",
  "unified_inference": "available"
}
```

---

## 4. GET `/`

Returns root service metadata and documentation links.

```json
{
  "message": "Chest X-Ray AI API is running",
  "docs": "/docs"
}
```

---

## 💻 Client Code Examples

### cURL
```bash
# Upload an image for prediction
curl -X POST "http://127.0.0.1:8000/predict" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@chest_xray.png"

# Download the resulting Grad-CAM visualization
curl -O "http://127.0.0.1:8000/visualizations/a7804a59-cfde-4b72-b53f-d7c02406300f_gradcam.png"
```

### Python (`requests`)
```python
import requests

url = "http://127.0.0.1:8000/predict"
image_path = "chest_xray.png"

with open(image_path, "rb") as f:
    files = {"file": ("xray.png", f, "image/png")}
    response = requests.post(url, files=files)

data = response.json()
print("Predicted Class:", data["result"]["classification"]["predicted_class"])
print("Confidence:", data["result"]["classification"]["confidence"])
print("Grad-CAM URL:", data["result"]["visualizations"]["gradcam_overlay_url"])
print("Segmentation URL:", data["result"]["visualizations"]["segmentation_overlay_url"])
```

### JavaScript / TypeScript (`fetch`)
```javascript
const formData = new FormData();
formData.append("file", fileInputElement.files[0]);

const response = await fetch("http://127.0.0.1:8000/predict", {
  method: "POST",
  body: formData,
});

const data = await response.json();
console.log("Prediction Result:", data.result);

// Display visualization in an <img> tag
const gradcamImg = document.getElementById("gradcam-view");
gradcamImg.src = `http://127.0.0.1:8000${data.result.visualizations.gradcam_overlay_url}`;
```
