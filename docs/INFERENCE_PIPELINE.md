# Deep Learning Inference & Explainability Pipeline

This document provides a technical deep-dive into the models, mathematical formulations, preprocessing routines, explainability mechanisms, and image blending pipelines implemented in `src/unified_inference.py`.

---

## 1. Multi-Class Pathology Classification

### Model Architecture
* **Model File:** `models/classification/best_finetuned_efficientnetb0.keras`
* **Backbone:** Pre-trained `EfficientNetB0` with custom classification head.
* **Target Classes:**
  1. `covid` (Index: 0)
  2. `normal` (Index: 1)
  3. `pneumonia` (Index: 2)

### Preprocessing (`preprocess_classification_image`)
1. **Load:** Image is loaded using `tf.keras.utils.load_img(image_path, target_size=(224, 224))`.
2. **Convert:** Converted to a float32 array with shape $(224, 224, 3)$.
3. **Batch Dimension:** Expanded to $(1, 224, 224, 3)$ matching the network input layer.

### Prediction & Probability Extraction
1. Softmax output produces a probability distribution vector $\mathbf{p} \in \mathbb{R}^3$.
2. **Predicted Class:** $\hat{c} = \arg\max_{c} p_c$.
3. **Confidence Score:** $C = \max_{c} p_c = p_{\hat{c}}$.

### Confidence Policy Mapping
Based on `configs/classification_confidence_policy.json`, predictions are mapped to qualitative reliability categories:

$$\text{Category}(C) = \begin{cases} 
\text{"high"} & \text{if } C \ge 0.90 \\
\text{"moderate"} & \text{if } 0.70 \le C < 0.90 \\
\text{"low"} & \text{if } C < 0.70 
\end{cases}$$

---

## 2. U-Net Anatomical Lung Segmentation

### Model Architecture
* **Model File:** `models/segmentation/best_unet.keras`
* **Input Layer:** $(1, 256, 256, 1)$ single-channel grayscale.
* **Output Layer:** Single-channel probability mask $\mathbf{M}_{\text{prob}} \in [0.0, 1.0]^{256 \times 256}$.

### Preprocessing (`preprocess_segmentation_image`)
1. Read source image via `cv2.imread(..., cv2.IMREAD_GRAYSCALE)`.
2. Retain copy of `original_image` $(H_{\text{orig}}, W_{\text{orig}})$.
3. Resize to $256 \times 256$ using bilinear interpolation.
4. Normalize pixel intensities: $I_{\text{norm}} = \frac{I}{255.0} \in [0.0, 1.0]$.
5. Expand dimensions to $(1, 256, 256, 1)$.

### Postprocessing & Native Resolution Scaling
1. **Model Prediction:** $\mathbf{M}_{\text{prob}} = \text{U-Net}(I_{\text{norm}})[0, :, :, 0]$.
2. **Resize to Original Dimensions:** $\mathbf{M}_{\text{prob, orig}} = \text{cv2.resize}(\mathbf{M}_{\text{prob}}, (W_{\text{orig}}, H_{\text{orig}}))$.
3. **Binarization:** $\mathbf{M}_{\text{bin}} = (\mathbf{M}_{\text{prob, orig}} \ge 0.5).\text{astype}(\text{uint8})$.

### Derived Morphometric Metrics
* **Lung Field Coverage:** $\text{Coverage} = \frac{1}{H \times W} \sum_{i=1}^H \sum_{j=1}^W \mathbf{M}_{\text{bin}}(i, j)$
* **Bounding Box Calculation (`extract_lung_roi`):**
  - $y_{\min} = \min(\{i \mid \mathbf{M}_{\text{bin}}(i, j) = 1\})$, $y_{\max} = \max(\{i \mid \mathbf{M}_{\text{bin}}(i, j) = 1\})$
  - $x_{\min} = \min(\{j \mid \mathbf{M}_{\text{bin}}(i, j) = 1\})$, $x_{\max} = \max(\{j \mid \mathbf{M}_{\text{bin}}(i, j) = 1\})$
  - $\text{width} = x_{\max} - x_{\min} + 1$, $\text{height} = y_{\max} - y_{\min} + 1$
* **Cropped ROI:** $\text{ROI} = \text{original\_image}[y_{\min}:y_{\max}+1, x_{\min}:x_{\max}+1]$.

---

## 3. Grad-CAM Explainability Formulation

Gradient-weighted Class Activation Mapping (Grad-CAM) computes visual explanations highlighting discriminative regions used by the classification model.

### Target Layer
* Target layer: `top_conv` (the final $7 \times 7$ convolutional feature layer in the `efficientnetb0` backbone).
* Configured in `configs/classification_gradcam_config.json`.

### Gradient Computation (`tf.GradientTape`)
Let $A^k \in \mathbb{R}^{7 \times 7}$ be the $k$-th feature activation map of `top_conv`, and let $y^c$ be the raw score for class $c$ (the authoritative predicted class $\hat{c}$).

1. **Neuron Importance Weights ($\alpha_k^c$):**
   Global-average-pool the gradients over height $i$ and width $j$:
   $$\alpha_k^c = \frac{1}{Z} \sum_{i=1}^U \sum_{j=1}^V \frac{\partial y^c}{\partial A_{i, j}^k}$$

2. **Weighted Combination & Rectification:**
   $$L_{\text{Grad-CAM}}^c = \text{ReLU}\left( \sum_k \alpha_k^c A^k \right)$$

3. **Feature-wise Normalization:**
   $$H = \frac{L_{\text{Grad-CAM}}^c}{\max(L_{\text{Grad-CAM}}^c) + \epsilon}$$
   Yields a normalized 2D heatmap $H \in [0.0, 1.0]^{7 \times 7}$.

---

## 4. Visual Overlay Generation (OpenCV)

The pipeline blends feature activations directly onto the high-resolution original radiograph.

### A. Grad-CAM Overlay (`generate_gradcam_overlay`)
```python
# 1. Resize 7x7 heatmap to native image resolution (W, H)
heatmap_resized = cv2.resize(heatmap, (width, height))

# 2. Scale float [0.0, 1.0] to uint8 [0, 255]
heatmap_uint8 = np.uint8(255 * np.clip(heatmap_resized, 0.0, 1.0))

# 3. Apply OpenCV COLORMAP_JET colormap (Blue = Low, Red = High activation)
heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

# 4. Alpha blend with original radiograph (60% original image, 40% heatmap)
overlay = cv2.addWeighted(original_bgr, 0.6, heatmap_colored, 0.4, 0)
```

### B. Segmentation Mask Overlay (`generate_segmentation_overlay`)
```python
# 1. Ensure binary mask matches image dimensions
mask_bool = binary_mask > 0

# 2. Create solid green BGR layer (0, 255, 0)
colored_layer = np.zeros_like(original_bgr, dtype=np.uint8)
colored_layer[:] = (0, 255, 0)

# 3. Alpha blend mask region (65% original image, 35% green tint)
blended = cv2.addWeighted(original_bgr, 0.65, colored_layer, 0.35, 0)
overlay[mask_bool] = blended[mask_bool]

# 4. Extract external contours and draw crisp 2px border
contours, _ = cv2.findContours(binary_mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cv2.drawContours(overlay, contours, -1, (0, 255, 0), 2)
```

### C. File Output Serialization
Overlays are written directly to disk via `cv2.imwrite` in `generated_visualizations/` as lossless PNG files:
* `{request_id}_gradcam.png`
* `{request_id}_segmentation.png`
