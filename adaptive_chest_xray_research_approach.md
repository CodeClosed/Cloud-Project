# Adaptive Uncertainty-Aware Hierarchical Multi-Task Framework for Chest X-ray Analysis

## 1. Research Idea

Instead of simply combining three existing models into one large
network, the proposed research direction is to combine the **strengths
and address the limitations** of the three approaches.

The proposed system is an **adaptive hierarchical pipeline** that
performs:

1.  Lung segmentation
2.  Fast initial screening
3.  Confidence-based detailed diagnosis
4.  Infection localization
5.  Severity quantification

### Proposed title

**An Adaptive Uncertainty-Aware Hierarchical Multi-Task Framework for
Chest X-ray Analysis**

The main idea is:

> Existing approaches focus separately on efficient binary
> classification, hierarchical disease classification, or infection
> localization and severity assessment. This work proposes an adaptive
> multi-stage framework that integrates these capabilities while
> selectively applying computationally expensive analysis only to
> uncertain or clinically relevant cases.

------------------------------------------------------------------------

# 2. Analysis of the Three Papers

  ---------------------------------------------------------------------------
  Paper                   Main Strength           Limitation / Research Gap
  ----------------------- ----------------------- ---------------------------
  **Paper 1 -- Modified   Fast and accurate       Focuses mainly on COVID and
  MobileNetV2**           binary COVID vs healthy healthy images and does not
                          classification          provide detailed
                                                  differential diagnosis
                                                  between COVID, bacterial
                                                  pneumonia, and other viral
                                                  pneumonia

  **Paper 2 -- Two-stage  Hierarchical            Uses deeper networks for
  ResNet50 + ResNet101**  differentiation between classification and still
                          normal, bacterial       has possible confusion
                          pneumonia, viral        between COVID-19 and other
                          pneumonia, and COVID-19 viral pneumonia;
                                                  reliability as a diagnostic
                                                  system remains an open
                                                  concern

  **Paper 3 --            Lung segmentation,      Focuses on
  Segmentation and        infection localization, segmentation/localization
  Severity Analysis**     and infection           and does not provide an
                          quantification using a  adaptive pipeline that
                          large benchmark dataset selectively applies
                                                  computationally expensive
                                                  analysis based on
                                                  uncertainty
  ---------------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Core Research Gap

The three papers solve different parts of the chest X-ray analysis
problem:

-   Paper 1 focuses on **efficient screening**.
-   Paper 2 focuses on **hierarchical differential diagnosis**.
-   Paper 3 focuses on **lung segmentation, infection localization, and
    severity assessment**.

However, they do not provide a single **adaptive end-to-end framework**
that decides how much analysis a particular X-ray requires.

This creates the central research question:

> **Can an uncertainty-aware adaptive architecture improve the
> usefulness and efficiency of chest X-ray analysis by combining
> lightweight screening, hierarchical diagnosis, infection localization,
> and severity quantification?**

------------------------------------------------------------------------

# 4. Proposed Architecture

## Segment → Screen → Diagnose → Localize

``` text
                     CHEST X-RAY
                          │
                          ▼
              ┌─────────────────────┐
              │ STAGE 1             │
              │ Lung Segmentation   │
              │ + Quality Check     │
              └─────────────────────┘
                          │
                          ▼
                    Lung ROI
                          │
                          ▼
              ┌─────────────────────┐
              │ STAGE 2             │
              │ MobileNetV2         │
              │ Fast Screening      │
              └─────────────────────┘
                          │
                  ┌───────┴────────┐
                  │                │
             HIGH CONFIDENCE    UNCERTAIN
                  │                │
                  ▼                ▼
           Fast Prediction   ┌──────────────────┐
                             │ STAGE 3          │
                             │ Hierarchical     │
                             │ Deep Diagnosis   │
                             └──────────────────┘
                                      │
                                      ▼
                          Normal / Bacterial /
                         Other Viral / COVID
                                      │
                         If COVID detected
                                      ▼
                             ┌─────────────────┐
                             │ STAGE 4         │
                             │ Infection       │
                             │ Localization +  │
                             │ Severity Score  │
                             └─────────────────┘
                                      │
                                      ▼
                               FINAL REPORT
```

------------------------------------------------------------------------

# 5. Stage 1 --- Lung Segmentation

The first stage uses the concept from the third paper.

Before classification, the system isolates the lung region from the
chest X-ray.

### Purpose

This helps reduce the influence of irrelevant regions such as:

-   Image borders
-   Embedded text or annotations
-   Background regions
-   Potential dataset-specific artifacts
-   Non-lung information

### Possible models

-   U-Net
-   U-Net++
-   Feature Pyramid Network (FPN)

### Output

``` text
Original Chest X-ray
        ↓
Lung Segmentation
        ↓
Lung Region of Interest
        ↓
Classification
```

The goal is to ensure that later classification stages focus primarily
on medically relevant lung regions.

------------------------------------------------------------------------

# 6. Stage 2 --- Lightweight Screening Using MobileNetV2

The second stage incorporates the main strength of Paper 1.

Modified MobileNetV2 is used as a **fast first-level screening model**.

Instead of making MobileNetV2 the final decision-maker in every case, it
produces:

-   Predicted class
-   Probability scores
-   Confidence score

### Routing logic

``` text
Input X-ray
      │
      ▼
MobileNetV2
      │
      ├── High Confidence → Fast Prediction
      │
      └── Low Confidence → Advanced Diagnosis
```

For example:

``` text
Confidence ≥ Threshold
        ↓
Fast Prediction

Confidence < Threshold
        ↓
Send to Deep Diagnostic Model
```

This creates an **adaptive computation strategy**.

Simple and highly confident cases can be processed quickly, while
difficult cases receive more computationally intensive analysis.

------------------------------------------------------------------------

# 7. Stage 3 --- Confidence-Based Hierarchical Diagnosis

This stage combines the hierarchical classification idea from Paper 2
with the efficiency of Paper 1.

The deep diagnostic model can classify:

1.  Normal
2.  Bacterial Pneumonia
3.  Other Viral Pneumonia
4.  COVID-19

A hierarchical structure can be used:

``` text
                     Chest X-ray
                          │
                          ▼
                 Broad Classification
                          │
          ┌───────────────┼───────────────┐
          │               │               │
        Normal       Bacterial         Viral
                                       │
                                       ▼
                              COVID vs Other Viral
```

### Possible architecture

-   ResNet50 for broad disease classification
-   ResNet101 or another deeper model for difficult differentiation

The important point is that the deeper model is **not necessarily
executed for every image**. It is activated when the first-stage model
is uncertain.

------------------------------------------------------------------------

# 8. Stage 4 --- Infection Localization

If the system predicts COVID-19, an infection segmentation module is
activated.

``` text
COVID Detected
      │
      ▼
Infection Segmentation
      │
      ▼
Infection Mask
```

Possible architectures:

-   U-Net++
-   FPN

The model produces a visual representation of the suspected infected
regions.

This makes the system more interpretable than a classifier that only
produces a class label.

------------------------------------------------------------------------

# 9. Stage 5 --- Severity Quantification

The infection mask can be combined with the lung mask to estimate the
proportion of affected lung area.

A possible calculation is:

\[ `\text{Infection Percentage}`{=tex} =
`\frac{\text{Infected Lung Area}}`{=tex}
{`\text{Total Lung Area}`{=tex}} `\times 100`{=tex} \]

The system could report:

``` text
Diagnosis: COVID-19

Confidence: XX%

Affected Lung Area: XX%

Severity Category: Mild / Moderate / Severe
```

**Important:** The exact thresholds for severity categories should not
be arbitrarily chosen. They should be derived from appropriately labeled
data or justified using a validated methodology.

------------------------------------------------------------------------

# 10. Main Novelty --- Uncertainty-Aware Routing

The strongest contribution of the proposed work is not simply using
multiple CNN models.

It is the **adaptive routing mechanism**.

Traditional approach:

``` text
Every X-ray
     ↓
Large Deep Model
     ↓
Prediction
```

Proposed approach:

``` text
Every X-ray
     ↓
Lung Segmentation
     ↓
Lightweight MobileNetV2
     │
     ├── High Confidence
     │        ↓
     │   Fast Prediction
     │
     └── Low Confidence
              ↓
       Advanced Deep Model
              ↓
      Detailed Diagnosis
              ↓
       If COVID Positive
              ↓
     Infection Localization
              ↓
      Severity Assessment
```

### Potential advantages

-   Faster processing for simple cases
-   More computational resources allocated to uncertain cases
-   More detailed differential diagnosis
-   Infection localization
-   Severity estimation
-   Better interpretability
-   Potentially lower average inference cost

------------------------------------------------------------------------

# 11. Important Methodological Improvement --- Preventing Data Leakage

A major area that should be handled carefully is data augmentation and
train-test splitting.

The recommended workflow is:

``` text
Original Dataset
       │
       ├── Training Set
       │       │
       │       └── Apply augmentation only here
       │
       ├── Validation Set
       │
       └── Untouched Test Set
```

The test set should contain original unseen images.

Augmented versions of the same original image should not appear across
training and testing sets.

This allows a more reliable evaluation of generalization.

------------------------------------------------------------------------

# 12. Dataset Strategy

Instead of combining already augmented datasets from the papers,
construct or use a unified dataset containing the relevant diagnostic
categories.

``` text
                    CHEST X-RAY DATASET
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       Normal          Pneumonia          COVID
                           │
                 ┌─────────┴─────────┐
                 │                   │
             Bacterial            Viral
                                      │
                              ┌───────┴────────┐
                              │                │
                           COVID           Other Viral
```

The final classification categories can be:

1.  Normal
2.  Bacterial Pneumonia
3.  Other Viral Pneumonia
4.  COVID-19

The segmentation dataset should additionally provide:

-   Lung masks
-   Infection masks, where available
-   Relevant labels required for severity analysis

------------------------------------------------------------------------

# 13. Evaluation Metrics

The proposed model should not be evaluated using accuracy alone.

## Classification

-   Accuracy
-   Precision
-   Recall
-   F1-score
-   Sensitivity
-   Specificity
-   ROC-AUC

## Segmentation

-   Dice Similarity Coefficient
-   Intersection over Union (IoU)

## Efficiency

-   Average inference time
-   Number or percentage of cases routed to the deep model
-   Computational cost
-   Performance versus computational trade-off

## Generalization

-   Performance on an untouched test set
-   If available, evaluation on an independent or external dataset

------------------------------------------------------------------------

# 14. Research Questions

The project can investigate the following questions:

### RQ1

Can lung segmentation before classification reduce the influence of
irrelevant non-lung features?

### RQ2

Can a lightweight MobileNetV2 model accurately handle high-confidence
cases while routing uncertain cases to a deeper classifier?

### RQ3

Can hierarchical classification improve differentiation between
COVID-19, bacterial pneumonia, other viral pneumonia, and normal cases?

### RQ4

Can infection localization and quantification provide a more informative
output than classification alone?

### RQ5

Can adaptive routing reduce average computational cost while maintaining
comparable or improved diagnostic performance?

------------------------------------------------------------------------

# 15. Expected Final System

The final model would produce something similar to:

``` text
=========================================
          CHEST X-RAY ANALYSIS
=========================================

Diagnosis:
COVID-19 Positive

Classification Confidence:
96.4%

Affected Lung Area:
28%

Severity:
Moderate

Analysis Path:
MobileNetV2 → Uncertain
ResNet Diagnostic Model → COVID-19
Segmentation Module → Infection Localized

Visual Output:
Lung Mask + Infection Mask
=========================================
```

------------------------------------------------------------------------

# 16. Final Proposed Contribution

The proposed research contribution can be summarized as:

> **This work proposes an adaptive uncertainty-aware hierarchical
> multi-task framework for chest X-ray analysis. The framework
> integrates lung segmentation, lightweight initial screening,
> confidence-based routing to a deeper diagnostic model, infection
> localization, and severity quantification. Unlike approaches that
> independently focus on binary classification, hierarchical diagnosis,
> or infection segmentation, the proposed system selectively applies
> computationally expensive analysis based on prediction uncertainty and
> clinical relevance.**

## Final Architecture

### **Segment → Screen → Diagnose → Localize → Quantify**

``` text
Chest X-ray
    ↓
Lung Segmentation
    ↓
MobileNetV2 Screening
    ↓
Confidence Evaluation
    ├── High Confidence → Fast Prediction
    └── Low Confidence  → Hierarchical Deep Diagnosis
                                  ↓
                             Final Diagnosis
                                  ↓
                          If COVID-19 Positive
                                  ↓
                         Infection Localization
                                  ↓
                          Severity Quantification
                                  ↓
                              Final Report
```

# 17. Conclusion

The proposed approach provides a legitimate direction for creating a new
model based on the three papers. Rather than simply combining
MobileNetV2, ResNet, and segmentation models, the research contribution
lies in designing an **adaptive pipeline** that combines their
strengths.

The system aims to provide:

-   **Efficiency** from lightweight MobileNetV2 screening
-   **Detailed differential diagnosis** from hierarchical deep
    classification
-   **Interpretability** through infection localization
-   **Clinical information** through infection quantification and
    severity assessment
-   **Computational efficiency** through uncertainty-based routing

The most important novelty should therefore be the **adaptive
uncertainty-aware decision pipeline**, rather than merely claiming that
multiple existing neural networks have been combined.
