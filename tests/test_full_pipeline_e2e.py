import sys
from pathlib import Path
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from starlette.testclient import TestClient
from api.main import app

client = TestClient(app)
SAMPLE_IMAGE = PROJECT_ROOT / "0a7faa2a.png"

def test_full_pipeline_integration():
    """
    Simulates the exact Next.js frontend user journey:
    1. Check backend health
    2. Submit chest X-ray image to /predict
    3. Verify all fields required by the frontend dashboard exist and have valid types
    4. Verify static PNG files exist and can be fetched via their relative URLs
    """
    # 1. Health check
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"
    assert health.json()["unified_inference"] == "available"

    # 2. Upload image
    with open(SAMPLE_IMAGE, "rb") as f:
        img_data = f.read()

    response = client.post(
        "/predict",
        files={"file": ("chest_xray_test.png", img_data, "image/png")}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    result = payload["result"]
    assert "request_id" in result
    assert result["filename"] == "chest_xray_test.png"

    # 3. Check Classification
    clf = result["classification"]
    assert clf["predicted_class"] in ["covid", "normal", "pneumonia"]
    assert isinstance(clf["predicted_label"], int)
    assert 0.0 <= clf["confidence"] <= 1.0
    assert clf["confidence_category"] in ["low", "moderate", "high"]
    assert set(clf["class_probabilities"].keys()) == {"covid", "normal", "pneumonia"}
    assert sum(clf["class_probabilities"].values()) == pytest.approx(1.0, rel=1e-3)

    # 4. Check Segmentation
    seg = result["segmentation"]
    assert 0.0 < seg["lung_coverage"] < 1.0
    bbox = seg["bounding_box"]
    assert bbox["width"] == bbox["x_max"] - bbox["x_min"] + 1
    assert bbox["height"] == bbox["y_max"] - bbox["y_min"] + 1
    assert len(seg["lung_roi_shape"]) == 2

    # 5. Check Grad-CAM
    cam = result["gradcam"]
    assert cam["predicted_class"] == clf["predicted_class"]
    assert cam["target_class"] == clf["predicted_class"]
    assert cam["heatmap_shape"] == [7, 7]

    # 6. Check Visualizations
    vis = result["visualizations"]
    assert vis["gradcam_overlay_url"].startswith("/visualizations/")
    assert vis["segmentation_overlay_url"].startswith("/visualizations/")

    # 7. Fetch both images
    res_cam = client.get(vis["gradcam_overlay_url"])
    assert res_cam.status_code == 200
    assert len(res_cam.content) > 1000

    res_seg = client.get(vis["segmentation_overlay_url"])
    assert res_seg.status_code == 200
    assert len(res_seg.content) > 1000

    print("\n[PASSED] End-to-End full pipeline integration test succeeded.")

if __name__ == "__main__":
    test_full_pipeline_integration()
