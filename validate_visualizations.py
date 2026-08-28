import sys
import base64
from pathlib import Path
import cv2
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from unified_inference import analyze_chest_xray

def test_visualization_pipeline():
    sample_image_path = Path("c:/Users/vihaa/OneDrive/Desktop/0a7faa2a.png")
    assert sample_image_path.exists(), f"Sample image not found: {sample_image_path}"

    print(f"Running analyze_chest_xray on {sample_image_path}...")
    result = analyze_chest_xray(sample_image_path)

    # 1. Confirm classification metadata
    assert "classification" in result, "Missing 'classification' key"
    clf = result["classification"]
    assert "predicted_class" in clf
    assert "predicted_label" in clf
    assert "confidence" in clf
    assert "confidence_category" in clf
    assert "class_probabilities" in clf
    print(f"[OK] Classification metadata present: predicted={clf['predicted_class']}, conf={clf['confidence']:.4f}")

    # 2. Confirm segmentation metadata
    assert "segmentation" in result, "Missing 'segmentation' key"
    seg = result["segmentation"]
    assert "lung_coverage" in seg
    assert "bounding_box" in seg
    assert "lung_roi_shape" in seg
    print(f"[OK] Segmentation metadata present: coverage={seg['lung_coverage']:.4f}, bbox={seg['bounding_box']}")

    # 3. Confirm Grad-CAM metadata
    assert "gradcam" in result, "Missing 'gradcam' key"
    cam = result["gradcam"]
    assert "predicted_class" in cam
    assert "target_class" in cam
    assert "confidence" in cam
    assert "heatmap_shape" in cam
    print(f"[OK] Grad-CAM metadata present: target={cam['target_class']}, heatmap_shape={cam['heatmap_shape']}")

    # 4. Confirm visualizations key and fields
    assert "visualizations" in result, "Missing 'visualizations' key"
    vis = result["visualizations"]
    assert "gradcam_overlay" in vis, "Missing 'gradcam_overlay'"
    assert "segmentation_overlay" in vis, "Missing 'segmentation_overlay'"
    print("[OK] Both visualization fields present in result['visualizations']")

    # 5. Decode Base64 and verify valid PNG format
    png_signature = b"\x89PNG\r\n\x1a\n"

    gradcam_b64 = vis["gradcam_overlay"]
    assert isinstance(gradcam_b64, str), "gradcam_overlay must be a string"
    assert not gradcam_b64.startswith("data:"), "Must not have data URI prefix"
    gradcam_bytes = base64.b64decode(gradcam_b64)
    assert gradcam_bytes.startswith(png_signature), "Decoded gradcam_overlay bytes must have PNG signature"
    gradcam_img = cv2.imdecode(np.frombuffer(gradcam_bytes, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    assert gradcam_img is not None, "Failed to cv2.imdecode gradcam overlay"
    print(f"[OK] Grad-CAM overlay decoded successfully: shape={gradcam_img.shape}, dtype={gradcam_img.dtype}")

    seg_b64 = vis["segmentation_overlay"]
    assert isinstance(seg_b64, str), "segmentation_overlay must be a string"
    assert not seg_b64.startswith("data:"), "Must not have data URI prefix"
    seg_bytes = base64.b64decode(seg_b64)
    assert seg_bytes.startswith(png_signature), "Decoded segmentation_overlay bytes must have PNG signature"
    seg_img = cv2.imdecode(np.frombuffer(seg_bytes, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    assert seg_img is not None, "Failed to cv2.imdecode segmentation overlay"
    print(f"[OK] Segmentation overlay decoded successfully: shape={seg_img.shape}, dtype={seg_img.dtype}")

    # 6. Verify that no raw numpy arrays are left in the result dict
    def check_no_numpy(obj, path=""):
        if isinstance(obj, np.ndarray):
            raise AssertionError(f"Found raw numpy array at {path}")
        elif isinstance(obj, dict):
            for k, v in obj.items():
                check_no_numpy(v, f"{path}.{k}")
        elif isinstance(obj, (list, tuple)):
            for i, v in enumerate(obj):
                check_no_numpy(v, f"{path}[{i}]")

    check_no_numpy(result)
    print("[OK] Verified no raw NumPy arrays in returned dictionary")

    # 7. Test FastAPI /predict endpoint function directly
    import asyncio
    from io import BytesIO
    from fastapi import UploadFile
    from starlette.datastructures import Headers

    API_DIR = PROJECT_ROOT / "api"
    if str(API_DIR) not in sys.path:
        sys.path.insert(0, str(API_DIR))
    from main import predict_chest_xray as api_predict

    with open(sample_image_path, "rb") as f:
        file_bytes = f.read()

    upload_file = UploadFile(
        file=BytesIO(file_bytes),
        filename="test.png",
        headers=Headers({"content-type": "image/png"})
    )

    api_response = asyncio.run(api_predict(file=upload_file))
    assert api_response["success"] is True
    assert "visualizations" in api_response["result"]
    assert "gradcam_overlay" in api_response["result"]["visualizations"]
    assert "segmentation_overlay" in api_response["result"]["visualizations"]
    print("[OK] FastAPI predict_chest_xray endpoint logic verified and returns JSON-safe Base64 visualizations")

    print("\nALL LOCAL VALIDATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_visualization_pipeline()
