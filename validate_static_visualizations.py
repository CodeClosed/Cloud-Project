import sys
import asyncio
from io import BytesIO
from pathlib import Path
import cv2
import numpy as np
from fastapi import UploadFile
from starlette.datastructures import Headers

PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / "src"
API_DIR = PROJECT_ROOT / "api"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from main import predict_chest_xray as api_predict, VISUALIZATIONS_DIR
from unified_inference import analyze_chest_xray

def test_static_visualizations():
    sample_image_path = Path("c:/Users/vihaa/OneDrive/Desktop/0a7faa2a.png")
    assert sample_image_path.exists(), f"Sample image not found: {sample_image_path}"

    print("=" * 70)
    print("VALIDATION: STATIC PNG FILE GENERATION & FASTAPI URL EXPOSURE")
    print("=" * 70)

    # 1. Test direct analyze_chest_xray call
    print("\n--- 1. Testing analyze_chest_xray() directly ---")
    custom_request_id = "test_req_12345"
    result = analyze_chest_xray(sample_image_path, request_id=custom_request_id)

    assert "visualizations" in result, "Missing 'visualizations' key in analyze_chest_xray result"
    vis = result["visualizations"]
    assert "gradcam_overlay_url" in vis, "Missing 'gradcam_overlay_url'"
    assert "segmentation_overlay_url" in vis, "Missing 'segmentation_overlay_url'"
    assert vis["gradcam_overlay_url"] == f"/visualizations/{custom_request_id}_gradcam.png"
    assert vis["segmentation_overlay_url"] == f"/visualizations/{custom_request_id}_segmentation.png"

    # Confirm files exist on disk
    gradcam_disk_file = VISUALIZATIONS_DIR / f"{custom_request_id}_gradcam.png"
    seg_disk_file = VISUALIZATIONS_DIR / f"{custom_request_id}_segmentation.png"
    assert gradcam_disk_file.exists(), f"Grad-CAM file was not created on disk: {gradcam_disk_file}"
    assert seg_disk_file.exists(), f"Segmentation file was not created on disk: {seg_disk_file}"

    # Verify they are valid readable images
    img_gradcam = cv2.imread(str(gradcam_disk_file))
    assert img_gradcam is not None, "Grad-CAM file is not a valid readable image"
    img_seg = cv2.imread(str(seg_disk_file))
    assert img_seg is not None, "Segmentation file is not a valid readable image"
    print(f"[OK] Direct call: Saved and verified readable images on disk (shape={img_gradcam.shape})")

    # 2. Test FastAPI /predict endpoint
    print("\n--- 2. Testing FastAPI /predict endpoint ---")
    with open(sample_image_path, "rb") as f:
        img_bytes = f.read()

    upload_file = UploadFile(
        file=BytesIO(img_bytes),
        filename="chest_xray_test.png",
        headers=Headers({"content-type": "image/png"})
    )

    api_response = asyncio.run(api_predict(file=upload_file))

    assert api_response["success"] is True, "API response 'success' is not True"
    api_result = api_response["result"]

    # 3. Confirm all existing metadata fields are preserved
    assert "classification" in api_result
    assert "predicted_class" in api_result["classification"]
    assert "confidence" in api_result["classification"]
    assert "confidence_category" in api_result["classification"]
    assert "class_probabilities" in api_result["classification"]
    print(f"[OK] Classification preserved: {api_result['classification']['predicted_class']} (confidence: {api_result['classification']['confidence']:.4f})")

    assert "segmentation" in api_result
    assert "lung_coverage" in api_result["segmentation"]
    assert "bounding_box" in api_result["segmentation"]
    assert "lung_roi_shape" in api_result["segmentation"]
    print(f"[OK] Segmentation preserved: coverage={api_result['segmentation']['lung_coverage']:.4f}, bbox={api_result['segmentation']['bounding_box']}")

    assert "gradcam" in api_result
    assert "predicted_class" in api_result["gradcam"]
    assert "target_class" in api_result["gradcam"]
    assert "confidence" in api_result["gradcam"]
    assert "heatmap_shape" in api_result["gradcam"]
    print(f"[OK] Grad-CAM preserved: target={api_result['gradcam']['target_class']}, shape={api_result['gradcam']['heatmap_shape']}")

    # 4. Confirm visualizations URL structure
    assert "visualizations" in api_result, "Missing 'visualizations' in API response"
    api_vis = api_result["visualizations"]
    assert "gradcam_overlay_url" in api_vis, "Missing 'gradcam_overlay_url'"
    assert "segmentation_overlay_url" in api_vis, "Missing 'segmentation_overlay_url'"
    assert "gradcam_overlay" not in api_vis, "Found legacy Base64 'gradcam_overlay' in API response"
    assert "segmentation_overlay" not in api_vis, "Found legacy Base64 'segmentation_overlay' in API response"

    print(f"[OK] Returned Grad-CAM URL:      {api_vis['gradcam_overlay_url']}")
    print(f"[OK] Returned Segmentation URL:  {api_vis['segmentation_overlay_url']}")

    # 5. Confirm URLs correspond to valid files on disk
    g_filename = Path(api_vis["gradcam_overlay_url"]).name
    s_filename = Path(api_vis["segmentation_overlay_url"]).name

    g_path = VISUALIZATIONS_DIR / g_filename
    s_path = VISUALIZATIONS_DIR / s_filename

    assert g_path.exists(), f"File {g_path} does not exist for URL {api_vis['gradcam_overlay_url']}"
    assert s_path.exists(), f"File {s_path} does not exist for URL {api_vis['segmentation_overlay_url']}"

    g_loaded = cv2.imread(str(g_path))
    assert g_loaded is not None, f"Failed to read image from {g_path}"
    s_loaded = cv2.imread(str(s_path))
    assert s_loaded is not None, f"Failed to read image from {s_path}"

    print(f"[OK] Verified URL file {g_filename} on disk: shape={g_loaded.shape}, size={g_path.stat().st_size} bytes")
    print(f"[OK] Verified URL file {s_filename} on disk: shape={s_loaded.shape}, size={s_path.stat().st_size} bytes")

    print("\n" + "=" * 70)
    print("ALL VALIDATION CHECKS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_static_visualizations()
