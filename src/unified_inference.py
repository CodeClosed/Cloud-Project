
"""
Persistent unified inference module for the Chest X-Ray Adaptive Framework.

Provides:
    analyze_chest_xray(image_path)

Integrated components:
    - EfficientNetB0 classification
    - Confidence categorization
    - U-Net lung segmentation
    - Lung ROI extraction
    - Grad-CAM generation

This module is inference-only.
"""

from pathlib import Path
import json
import base64
import uuid

import cv2
import numpy as np
import tensorflow as tf


# =============================================================================
# PROJECT PATHS
# =============================================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

VISUALIZATIONS_DIR = PROJECT_ROOT / "generated_visualizations"
VISUALIZATIONS_DIR.mkdir(
    parents=True,
    exist_ok=True
)

CLASSIFICATION_MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "classification"
    / "best_finetuned_efficientnetb0.keras"
)

SEGMENTATION_MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "segmentation"
    / "best_unet.keras"
)

CONFIDENCE_POLICY_PATH = (
    PROJECT_ROOT
    / "configs"
    / "classification_confidence_policy.json"
)

GRADCAM_CONFIG_PATH = (
    PROJECT_ROOT
    / "configs"
    / "classification_gradcam_config.json"
)


# =============================================================================
# MODEL LOADING
# =============================================================================

classification_model = None
segmentation_model = None

with open(CONFIDENCE_POLICY_PATH, "r") as file:
    confidence_policy = json.load(file)

with open(GRADCAM_CONFIG_PATH, "r") as file:
    gradcam_config = json.load(file)


CLASS_NAMES = [
    "covid",
    "normal",
    "pneumonia"
]


def load_models():
    """
    Load persistent classification and segmentation models once.
    """

    global classification_model
    global segmentation_model

    if classification_model is None:
        classification_model = tf.keras.models.load_model(
            CLASSIFICATION_MODEL_PATH,
            compile=False
        )

    if segmentation_model is None:
        segmentation_model = tf.keras.models.load_model(
            SEGMENTATION_MODEL_PATH,
            compile=False
        )


# =============================================================================
# CLASSIFICATION
# =============================================================================

def preprocess_classification_image(image_path):
    """
    Load and preprocess an image for EfficientNetB0 inference.
    """

    image = tf.keras.utils.load_img(
        image_path,
        target_size=(224, 224)
    )

    image_array = tf.keras.utils.img_to_array(image)

    image_array = np.expand_dims(
        image_array,
        axis=0
    )

    return image_array


def get_confidence_category(confidence):
    """
    Assign the configured confidence category.
    """

    if confidence < 0.70:
        return "low"

    if confidence < 0.90:
        return "moderate"

    return "high"


def predict_chest_xray(image_path):
    """
    Run confidence-aware chest X-ray classification.
    """

    load_models()

    image_path = Path(image_path)

    image_array = preprocess_classification_image(
        image_path
    )

    probabilities_array = classification_model.predict(
        image_array,
        verbose=0
    )[0]

    predicted_label = int(
        np.argmax(probabilities_array)
    )

    confidence = float(
        probabilities_array[predicted_label]
    )

    probabilities = {
        class_name: float(probability)
        for class_name, probability in zip(
            CLASS_NAMES,
            probabilities_array
        )
    }

    return {
        "image_path": str(image_path),
        "predicted_class": CLASS_NAMES[
            predicted_label
        ],
        "predicted_label": predicted_label,
        "confidence": confidence,
        "confidence_category": get_confidence_category(
            confidence
        ),
        "probabilities": probabilities
    }


# =============================================================================
# SEGMENTATION
# =============================================================================

def preprocess_segmentation_image(image_path):
    """
    Load and preprocess an image for U-Net segmentation.
    """

    image = cv2.imread(
        str(image_path),
        cv2.IMREAD_GRAYSCALE
    )

    if image is None:
        raise ValueError(
            f"Unable to load image:\n{image_path}"
        )

    original_image = image.copy()

    resized_image = cv2.resize(
        image,
        (256, 256)
    )

    normalized_image = (
        resized_image.astype(np.float32)
        / 255.0
    )

    model_input = np.expand_dims(
        normalized_image,
        axis=(0, -1)
    )

    return original_image, model_input


def predict_lung_mask(image_path):
    """
    Generate a probability and binary lung mask.
    """

    load_models()

    original_image, model_input = (
        preprocess_segmentation_image(
            image_path
        )
    )

    probability_mask = segmentation_model.predict(
        model_input,
        verbose=0
    )[0, :, :, 0]

    binary_mask = (
        probability_mask >= 0.5
    ).astype(np.uint8)

    original_height, original_width = (
        original_image.shape
    )

    probability_mask_resized = cv2.resize(
        probability_mask,
        (original_width, original_height)
    )

    binary_mask_resized = (
        probability_mask_resized >= 0.5
    ).astype(np.uint8)

    return {
        "original_image": original_image,
        "probability_mask": probability_mask_resized,
        "binary_mask": binary_mask_resized
    }


def extract_lung_roi(original_image, binary_mask):
    """
    Extract the bounding-box ROI containing the predicted lungs.
    """

    coordinates = np.where(binary_mask > 0)

    if len(coordinates[0]) == 0:
        raise ValueError(
            "No lung region detected."
        )

    y_min = int(coordinates[0].min())
    y_max = int(coordinates[0].max())

    x_min = int(coordinates[1].min())
    x_max = int(coordinates[1].max())

    roi = original_image[
        y_min:y_max + 1,
        x_min:x_max + 1
    ]

    bounding_box = {
        "x_min": x_min,
        "x_max": x_max,
        "y_min": y_min,
        "y_max": y_max,
        "width": x_max - x_min + 1,
        "height": y_max - y_min + 1
    }

    return roi, bounding_box


def create_segmentation_visualization(image_path):
    """
    Generate segmentation outputs required by unified inference.
    """

    segmentation_prediction = predict_lung_mask(
        image_path
    )

    original_image = segmentation_prediction[
        "original_image"
    ]

    probability_mask = segmentation_prediction[
        "probability_mask"
    ]

    binary_mask = segmentation_prediction[
        "binary_mask"
    ]

    lung_roi, bounding_box = extract_lung_roi(
        original_image,
        binary_mask
    )

    lung_coverage = float(
        np.mean(binary_mask)
    )

    return {
        "original_image": original_image,
        "probability_mask": probability_mask,
        "binary_mask": binary_mask,
        "lung_roi": lung_roi,
        "bounding_box": bounding_box,
        "lung_coverage": lung_coverage
    }


# =============================================================================
# GRAD-CAM
# =============================================================================

def generate_gradcam(image_path, class_index=None):
    """
    Generate Grad-CAM for the predicted or requested class.

    The default target class is determined by the authoritative
    classification inference path so that Grad-CAM remains consistent
    with predict_chest_xray().
    """

    load_models()

    image_path = Path(image_path)

    # -------------------------------------------------------------------------
    # IDENTICAL IMAGE PREPROCESSING
    # -------------------------------------------------------------------------

    image_array = preprocess_classification_image(
        image_path
    )

    # -------------------------------------------------------------------------
    # AUTHORITATIVE CLASSIFICATION PREDICTION
    # -------------------------------------------------------------------------

    authoritative_probabilities = (
        classification_model.predict(
            image_array,
            verbose=0
        )[0]
    )

    authoritative_predicted_label = int(
        np.argmax(
            authoritative_probabilities
        )
    )

    authoritative_confidence = float(
        authoritative_probabilities[
            authoritative_predicted_label
        ]
    )

    # -------------------------------------------------------------------------
    # SELECT TARGET CLASS
    # -------------------------------------------------------------------------

    if class_index is None:
        class_index = authoritative_predicted_label

    class_index = int(class_index)

    if not 0 <= class_index < len(CLASS_NAMES):
        raise ValueError(
            f"class_index must be between 0 and "
            f"{len(CLASS_NAMES) - 1}."
        )

    # -------------------------------------------------------------------------
    # GRADIENT-CONNECTED FEATURE GRAPH
    # -------------------------------------------------------------------------

    backbone = classification_model.get_layer(
        "efficientnetb0"
    )

    target_layer = backbone.get_layer(
        "top_conv"
    )

    model_input = classification_model.inputs[0]

    backbone_feature_model = tf.keras.models.Model(
        inputs=backbone.input,
        outputs=target_layer.output
    )

    conv_output = backbone_feature_model(
        model_input
    )

    classification_head_layers = (
        classification_model.layers[
            classification_model.layers.index(backbone) + 1:
        ]
    )

    prediction_output = conv_output

    for layer in classification_head_layers:
        prediction_output = layer(
            prediction_output
        )

    grad_model = tf.keras.models.Model(
        inputs=model_input,
        outputs=[
            conv_output,
            prediction_output
        ]
    )

    # -------------------------------------------------------------------------
    # GRAD-CAM COMPUTATION
    # -------------------------------------------------------------------------

    with tf.GradientTape() as tape:

        conv_outputs, graph_predictions = grad_model(
            image_array
        )

        class_channel = graph_predictions[
            :,
            class_index
        ]

    gradients = tape.gradient(
        class_channel,
        conv_outputs
    )

    if gradients is None:
        raise RuntimeError(
            "Grad-CAM gradient computation failed. "
            "The target class is not connected to the feature tensor."
        )

    pooled_gradients = tf.reduce_mean(
        gradients,
        axis=(0, 1, 2)
    )

    conv_outputs = conv_outputs[0]

    heatmap = tf.reduce_sum(
        conv_outputs * pooled_gradients,
        axis=-1
    )

    heatmap = tf.maximum(
        heatmap,
        0
    )

    maximum = tf.reduce_max(
        heatmap
    )

    if maximum > 0:
        heatmap = heatmap / maximum

    heatmap = heatmap.numpy()

    # -------------------------------------------------------------------------
    # RETURN AUTHORITATIVE CLASSIFICATION METADATA
    # -------------------------------------------------------------------------

    return {
        "predicted_class": CLASS_NAMES[
            authoritative_predicted_label
        ],
        "target_class": CLASS_NAMES[
            class_index
        ],
        "confidence": authoritative_confidence,
        "heatmap": heatmap,
        "heatmap_shape": tuple(
            heatmap.shape
        )
    }


# =============================================================================
# VISUALIZATION GENERATION & ENCODING
# =============================================================================

def encode_image_to_base64(image_array):
    """
    Accept a uint8 NumPy image array, encode it as PNG, and return Base64 string.
    """

    success, buffer = cv2.imencode(".png", image_array)

    if not success:
        raise ValueError("Failed to encode image to PNG format.")

    return base64.b64encode(buffer).decode("utf-8")


def generate_gradcam_overlay(
    original_image,
    heatmap,
    alpha=0.6,
    colormap=cv2.COLORMAP_JET
):
    """
    Create a blended Grad-CAM overlay on the original X-ray image.

    Parameters:
        original_image: Grayscale or BGR uint8 NumPy image.
        heatmap: 2D float array in [0.0, 1.0].
        alpha: Weight of the original image in blending.
        colormap: OpenCV colormap identifier.

    Returns:
        uint8 BGR image array.
    """

    if original_image.ndim == 2:
        original_bgr = cv2.cvtColor(
            original_image,
            cv2.COLOR_GRAY2BGR
        )
    elif original_image.ndim == 3 and original_image.shape[2] == 1:
        original_bgr = cv2.cvtColor(
            original_image,
            cv2.COLOR_GRAY2BGR
        )
    else:
        original_bgr = original_image.copy()

    height, width = original_bgr.shape[:2]

    heatmap_resized = cv2.resize(
        heatmap,
        (width, height)
    )

    heatmap_uint8 = np.uint8(
        255 * np.clip(heatmap_resized, 0.0, 1.0)
    )

    heatmap_colored = cv2.applyColorMap(
        heatmap_uint8,
        colormap
    )

    overlay = cv2.addWeighted(
        original_bgr,
        alpha,
        heatmap_colored,
        1.0 - alpha,
        0
    )

    return overlay


def generate_segmentation_overlay(
    original_image,
    binary_mask,
    alpha=0.35,
    color=(0, 255, 0)
):
    """
    Create a visible colored overlay of the segmented lung region on the original X-ray.

    Parameters:
        original_image: Grayscale or BGR uint8 NumPy image.
        binary_mask: 2D binary mask (values > 0 indicating lung).
        alpha: Weight of the color mask in blending.
        color: BGR color tuple for the overlay (default: green).

    Returns:
        uint8 BGR image array.
    """

    if original_image.ndim == 2:
        original_bgr = cv2.cvtColor(
            original_image,
            cv2.COLOR_GRAY2BGR
        )
    elif original_image.ndim == 3 and original_image.shape[2] == 1:
        original_bgr = cv2.cvtColor(
            original_image,
            cv2.COLOR_GRAY2BGR
        )
    else:
        original_bgr = original_image.copy()

    height, width = original_bgr.shape[:2]

    if binary_mask.shape[:2] != (height, width):
        mask_resized = cv2.resize(
            binary_mask.astype(np.uint8),
            (width, height),
            interpolation=cv2.INTER_NEAREST
        )
    else:
        mask_resized = binary_mask

    mask_bool = mask_resized > 0

    overlay = original_bgr.copy()

    colored_layer = np.zeros_like(
        original_bgr,
        dtype=np.uint8
    )
    colored_layer[:] = color

    blended = cv2.addWeighted(
        original_bgr,
        1.0 - alpha,
        colored_layer,
        alpha,
        0
    )

    overlay[mask_bool] = blended[mask_bool]

    contours, _ = cv2.findContours(
        mask_resized.astype(np.uint8),
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )
    cv2.drawContours(
        overlay,
        contours,
        -1,
        color,
        2
    )

    return overlay


def analyze_chest_xray(
    image_path,
    output_dir=None,
    request_id=None
):
    """
    Run the complete two-model chest X-ray analysis pipeline and save visualizations.
    """

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(
            f"Image not found:\n{image_path}"
        )

    if output_dir is None:
        output_dir = VISUALIZATIONS_DIR
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    if request_id is None:
        request_id = str(uuid.uuid4())

    classification_result = predict_chest_xray(
        image_path
    )

    segmentation_result = (
        create_segmentation_visualization(
            image_path
        )
    )

    gradcam_result = generate_gradcam(
        image_path
    )

    original_image = segmentation_result[
        "original_image"
    ]
    binary_mask = segmentation_result[
        "binary_mask"
    ]
    heatmap = gradcam_result[
        "heatmap"
    ]

    gradcam_overlay = generate_gradcam_overlay(
        original_image,
        heatmap
    )

    segmentation_overlay = generate_segmentation_overlay(
        original_image,
        binary_mask
    )

    gradcam_filename = f"{request_id}_gradcam.png"
    segmentation_filename = f"{request_id}_segmentation.png"

    gradcam_filepath = output_dir / gradcam_filename
    segmentation_filepath = output_dir / segmentation_filename

    cv2.imwrite(
        str(gradcam_filepath),
        gradcam_overlay
    )

    cv2.imwrite(
        str(segmentation_filepath),
        segmentation_overlay
    )

    return {
        "image_path": str(image_path),

        "classification": {
            "predicted_class": classification_result[
                "predicted_class"
            ],

            "predicted_label": classification_result[
                "predicted_label"
            ],

            "confidence": classification_result[
                "confidence"
            ],

            "confidence_category": classification_result[
                "confidence_category"
            ],

            "class_probabilities": classification_result[
                "probabilities"
            ]
        },

        "segmentation": {
            "lung_coverage": segmentation_result[
                "lung_coverage"
            ],

            "bounding_box": segmentation_result[
                "bounding_box"
            ],

            "lung_roi_shape": tuple(
                segmentation_result[
                    "lung_roi"
                ].shape
            )
        },

        "gradcam": {
            "predicted_class": gradcam_result[
                "predicted_class"
            ],

            "target_class": gradcam_result[
                "target_class"
            ],

            "confidence": gradcam_result[
                "confidence"
            ],

            "heatmap_shape": tuple(
                gradcam_result[
                    "heatmap"
                ].shape
            )
        },

        "visualizations": {
            "gradcam_overlay_url": f"/visualizations/{gradcam_filename}",
            "segmentation_overlay_url": f"/visualizations/{segmentation_filename}"
        }
    }
