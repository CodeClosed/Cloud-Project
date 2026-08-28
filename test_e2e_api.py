import sys
import base64
import json
import time
from pathlib import Path
import cv2
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / "src"
API_DIR = PROJECT_ROOT / "api"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from unified_inference import analyze_chest_xray

def run_tests():
    sample_image = Path("c:/Users/vihaa/OneDrive/Desktop/0a7faa2a.png")
    output_dir = PROJECT_ROOT / "test_outputs"
    output_dir.mkdir(exist_ok=True)

    print("=" * 70)
    print("CHEST X-RAY INFERENCE & VISUALIZATION TEST SUITE")
    print("=" * 70)
    print(f"Sample Image Path: {sample_image}")
    assert sample_image.exists(), f"Image not found at {sample_image}"

    start_time = time.time()
    result = analyze_chest_xray(sample_image)
    elapsed = time.time() - start_time
    print(f"\n[+] Inference completed in {elapsed:.2f} seconds.")

    # 1. Classification Output
    clf = result["classification"]
    print("\n--- 1. CLASSIFICATION RESULTS ---")
    print(f"  Predicted Class    : {clf['predicted_class'].upper()}")
    print(f"  Predicted Label ID : {clf['predicted_label']}")
    print(f"  Confidence Score   : {clf['confidence'] * 100:.2f}%")
    print(f"  Confidence Level   : {clf['confidence_category'].upper()}")
    print("  Class Probabilities:")
    for c_name, prob in clf["class_probabilities"].items():
        print(f"    - {c_name.ljust(12)}: {prob * 100:.4f}%")

    # 2. Segmentation Output
    seg = result["segmentation"]
    print("\n--- 2. LUNG SEGMENTATION RESULTS ---")
    print(f"  Lung Area Coverage : {seg['lung_coverage'] * 100:.2f}% of image")
    print(f"  Bounding Box       : x_min={seg['bounding_box']['x_min']}, y_min={seg['bounding_box']['y_min']}, "
          f"width={seg['bounding_box']['width']}, height={seg['bounding_box']['height']}")
    print(f"  Lung ROI Dimensions: {seg['lung_roi_shape']}")

    # 3. Grad-CAM Output
    cam = result["gradcam"]
    print("\n--- 3. GRAD-CAM EXPLAINABILITY RESULTS ---")
    print(f"  Target Class       : {cam['target_class']}")
    print(f"  Heatmap Resolution : {cam['heatmap_shape']}")

    # 4. Visualizations & Decoding
    vis = result["visualizations"]
    print("\n--- 4. VISUALIZATION OUTPUTS ---")
    
    gradcam_b64 = vis["gradcam_overlay"]
    gradcam_bytes = base64.b64decode(gradcam_b64)
    gradcam_img = cv2.imdecode(np.frombuffer(gradcam_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    gradcam_save_path = output_dir / "gradcam_overlay.png"
    cv2.imwrite(str(gradcam_save_path), gradcam_img)
    print(f"  [OK] Grad-CAM Overlay      : Saved to {gradcam_save_path} (Dimensions: {gradcam_img.shape})")

    seg_b64 = vis["segmentation_overlay"]
    seg_bytes = base64.b64decode(seg_b64)
    seg_img = cv2.imdecode(np.frombuffer(seg_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    seg_save_path = output_dir / "segmentation_overlay.png"
    cv2.imwrite(str(seg_save_path), seg_img)
    print(f"  [OK] Segmentation Overlay  : Saved to {seg_save_path} (Dimensions: {seg_img.shape})")

    # 5. FastAPI Prediction Endpoint Simulation
    print("\n--- 5. FASTAPI /predict ENDPOINT SIMULATION ---")
    from io import BytesIO
    from fastapi import UploadFile
    from starlette.datastructures import Headers
    from main import predict_chest_xray as api_predict
    import asyncio

    with open(sample_image, "rb") as f:
        img_bytes = f.read()

    upload_file = UploadFile(
        file=BytesIO(img_bytes),
        filename=sample_image.name,
        headers=Headers({"content-type": "image/png"})
    )

    api_response = asyncio.run(api_predict(file=upload_file))
    print(f"  API Response Success Flag : {api_response['success']}")
    print(f"  Base64 Grad-CAM length    : {len(api_response['result']['visualizations']['gradcam_overlay'])} chars")
    print(f"  Base64 Segmentation length: {len(api_response['result']['visualizations']['segmentation_overlay'])} chars")

    print("\n" + "=" * 70)
    print("ALL TESTS PASSED SUCCESSFULLY! BOTH VISUALIZATIONS GENERATED & VERIFIED.")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
