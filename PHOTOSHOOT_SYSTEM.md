# Ozfabric Photoshoot System Documentation (Comprehensive Analysis)

This document provides a deep-dive analysis of the Ozfabric Photoshoot system's architecture, logic, and implementation details as of February 2026.

---

## 🏗 1. System Architecture
The system follows a **Hybrid AI Strategy** that separates "Thinking" (Visual Analysis) from "Execution" (Image Generation).

*   **Intelligence Layer:** Google **Gemini 2.0 Flash Lite** (Primary) and **Gemini 2.0 Flash**. Chosen for extreme speed, low latency, and superior technical fashion terminology.
*   **Generation Layer:** **Fal.ai Nanobanana Pro**. Utilized for high-fidelity e-commerce aesthetics and precise ControlNet capabilities.
*   **Frontend Logic:** Next.js App Router with complex state management for handling high-resolution assets and multi-shot batch specifications.

---

## 🧠 2. Deep Visual Analysis (Gemini 2.0 Pipeline)
Every generation starts with a collective analysis of the uploaded garment images.

### A. Fabric & Hardware Analysis (`api/analyze/route.ts`)
The model identifies:
- **Material & Weave:** Specificity like "12oz Twill Denim", "30/1 Combed Cotton", "Heathered Jersey".
- **Hardware:** Buttons, zippers, drawstrings, and their exact placement/style.
- **Finish:** Distressing, stone-washing, or technical coatings.

### B. Fit & Silhouette Recognition
Gemini analyzes the garment's cut relative to a standard body model:
- **Rise & Length:** Exact hem positions (e.g., "Full-length with slight pooling" vs. "Ankle-length").
- **Taper Logic:** Calculates where the taper begins (thigh, knee, or calf) and the percentage of narrowing toward the ankle.
- **Shoulder Construction:** Natural vs. Dropped shoulder identification.

### C. Pose & Dynamic Hair Control
When a pose is analyzed:
- **Biomechanics:** Maps joints, weight distribution, and limb angles.
- **Hair Physics:** The system specifically identifies **Movement Momentum**. It instructs the generator on how hair should flow based on the motion vector (e.g., "Hair is flowing naturally with the turning motion") to avoid static, "glued" hair artifacts.

---

## ⚡ 3. The Generation Pipeline (`api/generate/route.ts`)

### A. Structured Prompt Transition
The system converts UI state into a **Structured JSON Prompt**, which is then translated into a high-end photography instruction set.
- **Camera Tech:** Defines framing (Cowboy shot, Full body, Macro-detail) and specific lens behavior.
- **Lighting Dynamics:** Standardizes Octabox-Main and Softbox-Fill setups for consistent e-commerce high-key lighting.

### B. Smart Asset Routing
The system dynamically filters which images are sent to the API based on the **Shot Type**:
- **Styling Shots:** Includes model, garment, background, and accessories.
- **Technical Back Views:** Automatically triggers `NEGATIVE_PROMPTS.distorted_logo` to prevent halluncinated text/branding on blank products.
- **Close-up/Detail Shots:** Specifically **excludes** lower-body assets or shoes to focus the AI's attention solely on the upper garment texture and face.

### C. Stickman (Pose Control) Integration
- **Precision Control:** For the first styling shot of a batch, the system converts a user-provided pose into a **Stickman reference**.
- **Isolation:** The original "pose reference" image is **deleted** before API submission to prevent the model from "leaking" the garments from the reference image into the final result.

---

## 📦 4. Mavi EU Batch Workflow (`batch-helpers.ts`)
The system is optimized for a 5-6 shot automated sequence:
1.  **Styling Front (with Stickman):** The high-concept hero shot using 100% pose control.
2.  **Styling Angled:** 3/4 view with dynamic hair physics.
3.  **Technical Front:** Clean, static pose for catalog use (No hair interference).
4.  **Technical Back:** Clean back view with strict anti-hallucination prompts.
5.  **Closeup/Detail Front:** Tight framing on collar/chest, prioritizing fabric weave.
6.  **Detail Back (Lower only):** Focused on pocket structure and waist-down fit.

---

## 🛡 5. Safeguards & Negative Prompting
The system uses a mature negative prompt library to solve common "Nanobanana" artifacts:
- `equipment`: Prevents studio lights/softboxes from appearing in frame.
- `flatFabric`: Enforces micro-textures and weave visibility.
- `untucked/tucked`: Enforces the waistband visibility based on the UI toggle.
- `shoes`: Specifically prevents "clown feet" and disproportionate footwear.

---

## 🛠 5. Implementation Details
- **Seed Management:** A single random seed is generated at the start of a batch and reused across all angles to ensure consistent model face/lighting across different shots.
- **Resolution Control:** Supports multi-tier upscaling (1K, 2K, 4K) via the Fal.ai `Nano-Banana-Pro/edit` endpoint.
- **Language Layer:** While the UI is multilingual (TR/EN), the AI logic operates strictly in **Technical English** for maximum prompt adherence.
