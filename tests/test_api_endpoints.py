import io
import sys
from pathlib import Path
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from starlette.testclient import TestClient
from api.main import app, VISUALIZATIONS_DIR

client = TestClient(app)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SAMPLE_IMAGE = PROJECT_ROOT / "0a7faa2a.png"

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Chest X-Ray AI API is running"
    assert "docs" in data

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["unified_inference"] == "available"

def test_cors_headers():
    response = client.options(
        "/predict",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"

def test_predict_unsupported_file_extension():
    response = client.post(
        "/predict",
        files={"file": ("test.txt", b"plain text content", "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]

def test_predict_corrupted_image():
    response = client.post(
        "/predict",
        files={"file": ("corrupt.png", b"fake invalid png byte stream", "image/png")}
    )
    assert response.status_code == 400
    assert "Corrupted or invalid image file" in response.json()["detail"]

def test_predict_valid_sample_image():
    assert SAMPLE_IMAGE.exists(), f"Sample image {SAMPLE_IMAGE} does not exist"
    
    with open(SAMPLE_IMAGE, "rb") as f:
        img_bytes = f.read()

    response = client.post(
        "/predict",
        files={"file": ("sample_xray.png", img_bytes, "image/png")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    res = data["result"]
    assert "request_id" in res
    assert res["filename"] == "sample_xray.png"

    # Verify no local host filesystem path leaked
    assert "image_path" not in res

    # Classification
    clf = res["classification"]
    assert clf["predicted_class"] in ["covid", "normal", "pneumonia"]
    assert 0.0 <= clf["confidence"] <= 1.0
    assert clf["confidence_category"] in ["low", "moderate", "high"]
    assert "covid" in clf["class_probabilities"]
    assert "normal" in clf["class_probabilities"]
    assert "pneumonia" in clf["class_probabilities"]

    # Segmentation
    seg = res["segmentation"]
    assert 0.0 < seg["lung_coverage"] < 1.0
    assert seg["bounding_box"]["width"] > 0
    assert seg["bounding_box"]["height"] > 0
    assert len(seg["lung_roi_shape"]) == 2

    # Grad-CAM
    cam = res["gradcam"]
    assert cam["predicted_class"] in ["covid", "normal", "pneumonia"]
    assert len(cam["heatmap_shape"]) == 2

    # Visualizations
    vis = res["visualizations"]
    assert vis["gradcam_overlay_url"].startswith("/visualizations/")
    assert vis["segmentation_overlay_url"].startswith("/visualizations/")

    # Test static file retrieval
    gradcam_res = client.get(vis["gradcam_overlay_url"])
    assert gradcam_res.status_code == 200
    assert gradcam_res.headers["content-type"] in ["image/png", "application/octet-stream"]

    seg_res = client.get(vis["segmentation_overlay_url"])
    assert seg_res.status_code == 200
    assert seg_res.headers["content-type"] in ["image/png", "application/octet-stream"]
