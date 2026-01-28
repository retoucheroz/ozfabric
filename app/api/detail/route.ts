import { NextRequest, NextResponse } from "next/server";

// Configure route config
export const maxDuration = 60; // 60 seconds max duration
export const dynamic = 'force-dynamic';

// Negative prompts for common issues (same approach as generate API)
const NEGATIVE_PROMPTS = {
  tucked: "tucked in shirt, shirt inside pants, waistband visible, belt visible, partial tuck, front tuck, half tuck, shirt in waistband, any part of shirt inside pants",
  untucked: "untucked shirt, shirt hanging out, loose shirt over waistband, shirt draping over pants",
  colorChange: "different color, color shift, altered hue, changed saturation, wrong pattern colors, modified fabric color",
  backgroundChange: "different background, changed background, new background color, altered backdrop"
};

// --- SPECIFIC DETAIL PROMPTS ---
// STRICT REFERENCE PRESERVATION: Colors, patterns, background MUST be exactly as in reference images
// Framing options:
// - "cowboy_shot": Head to mid-thigh (for UPPER BODY products)
// - "waist_to_above_knees": Waist to knees (for LOWER BODY products)

const FRONT_DETAIL_TEMPLATE = (productName: string, gender: string, framing: string) => `
{
  "task": "generate_model_worn_garment_image",
  "view": "front",
  "garment_description": "${productName}",
  "subject_gender": "${gender}",

  "CRITICAL_REFERENCE_RULES": {
    "fabric_color": "EXACTLY match the color from uploaded garment reference image - DO NOT alter hue, saturation, or brightness",
    "fabric_pattern": "EXACTLY replicate the pattern (stripes, checks, solid, print) from reference - same width, spacing, colors",
    "background": "USE THE EXACT uploaded background image - same color, same texture, same lighting - DO NOT change or invent new background",
    "overall_tone": "Preserve the exact color temperature and mood from reference images"
  },

  "framing": {
    "crop": "${framing}",
    "camera_angle": "eye_level",
    "lens_look": "50mm",
    "distortion": "none"
  },

  "model_pose": {
    "posture": "neutral_standing",
    "movement": "none",
    "fashion_pose": false
  },

  "lighting": {
    "type": "match_reference_lighting",
    "exposure": "same_as_reference",
    "shadow_style": "preserve_from_reference"
  },

  "background": {
    "source": "EXACT_uploaded_background_image",
    "modification": "NONE - use as-is",
    "color_change": "STRICTLY_FORBIDDEN"
  },

  "reference_policy": {
    "garment_details_source": "reference_images_only",
    "color_source": "reference_images_only",
    "pattern_source": "reference_images_only",
    "background_source": "uploaded_background_only",
    "hallucination": "strictly_disallowed",
    "creative_interpretation": "strictly_disallowed"
  },

  "detail_preservation": {
    "exact_colors": true,
    "exact_pattern": true,
    "exact_fabric_texture": true,
    "logos": { "preserve": true },
    "labels_and_text": {
      "legibility": "maximum",
      "no_warping": true,
      "no_mirroring": true
    },
    "stitching_and_hardware": {
      "exact_transfer": true
    }
  },

  "consistency_rules": {
    "angle_orientation": "locked",
    "color_consistency": "locked_to_reference",
    "reuse_orientation_on_rerender": true
  },

  "negative_constraints": [
    "DO NOT change garment color - keep exact color from reference",
    "DO NOT change stripe/pattern colors or widths",
    "DO NOT change background color or add new background",
    "DO NOT alter overall color temperature or mood",
    "no pose variation",
    "no stylization",
    "no invented details",
    "no white t-shirt hallucination",
    "no extra garments",
    "no color grading or filters",
    "no creative reinterpretation of fabric"
  ]
}
`;

const BACK_DETAIL_TEMPLATE = (productName: string, gender: string, framing: string) => `
{
  "task": "generate_model_worn_garment_image",
  "view": "back",
  "garment_description": "${productName}",
  "subject_gender": "${gender}",

  "CRITICAL_REFERENCE_RULES": {
    "fabric_color": "EXACTLY match the color from uploaded garment reference image - DO NOT alter hue, saturation, or brightness",
    "fabric_pattern": "EXACTLY replicate the pattern from reference - same width, spacing, colors",
    "background": "USE THE EXACT uploaded background image - DO NOT change or invent new background",
    "overall_tone": "Preserve the exact color temperature and mood from reference images"
  },

  "framing": {
    "crop": "${framing}",
    "camera_angle": "eye_level",
    "lens_look": "50mm",
    "distortion": "none"
  },

  "model_pose": {
    "posture": "neutral_standing",
    "movement": "none",
    "fashion_pose": false
  },

  "lighting": {
    "type": "match_reference_lighting",
    "exposure": "same_as_reference",
    "shadow_style": "preserve_from_reference"
  },

  "background": {
    "source": "EXACT_uploaded_background_image",
    "modification": "NONE - use as-is",
    "color_change": "STRICTLY_FORBIDDEN"
  },

  "reference_policy": {
    "garment_details_source": "reference_images_only",
    "color_source": "reference_images_only",
    "pattern_source": "reference_images_only",
    "background_source": "uploaded_background_only",
    "hallucination": "strictly_disallowed",
    "creative_interpretation": "strictly_disallowed"
  },

  "detail_preservation": {
    "exact_colors": true,
    "exact_pattern": true,
    "exact_fabric_texture": true,
    "logos": { "preserve": true },
    "labels_and_text": {
      "legibility": "maximum",
      "no_warping": true,
      "no_mirroring": true
    },
    "stitching_and_hardware": {
      "exact_transfer": true
    }
  },

  "consistency_rules": {
    "angle_orientation": "locked",
    "color_consistency": "locked_to_reference",
    "reuse_orientation_on_rerender": true
  },

  "negative_constraints": [
    "DO NOT change garment color - keep exact color from reference",
    "DO NOT change stripe/pattern colors or widths",
    "DO NOT change background color or add new background",
    "DO NOT alter overall color temperature or mood",
    "no mirrored output",
    "no unreadable labels",
    "no reinterpretation of branding",
    "no white t-shirt hallucination",
    "no extra garments",
    "no color grading or filters"
  ]
}
`;

const ANGLED_DETAIL_TEMPLATE = (productName: string, gender: string, framing: string) => `
{
  "task": "generate_model_worn_garment_image",
  "view": "angled",
  "garment_description": "${productName}",
  "subject_gender": "${gender}",

  "CRITICAL_REFERENCE_RULES": {
    "fabric_color": "EXACTLY match the color from uploaded garment reference image - DO NOT alter hue, saturation, or brightness",
    "fabric_pattern": "EXACTLY replicate the pattern from reference - same width, spacing, colors",
    "background": "USE THE EXACT uploaded background image - DO NOT change or invent new background",
    "overall_tone": "Preserve the exact color temperature and mood from reference images"
  },

  "angle_definition": {
    "rotation": "slight",
    "rotation_degree": "10_to_20",
    "rotation_axis": "vertical",
    "camera_facing_bias": "front_faces_camera_left",
    "keep_full_visibility": true
  },

  "model_pose": {
    "posture": "neutral_standing",
    "body_rotation": "right",
    "movement": "none",
    "fashion_pose": false
  },

  "framing": {
    "crop": "${framing}",
    "camera_angle": "eye_level",
    "lens_look": "50mm",
    "distortion": "none"
  },

  "lighting": {
    "type": "match_reference_lighting",
    "exposure": "same_as_reference",
    "shadow_style": "preserve_from_reference"
  },

  "background": {
    "source": "EXACT_uploaded_background_image",
    "modification": "NONE - use as-is",
    "color_change": "STRICTLY_FORBIDDEN"
  },

  "reference_policy": {
    "garment_details_source": "reference_images_only",
    "color_source": "reference_images_only",
    "pattern_source": "reference_images_only",
    "background_source": "uploaded_background_only",
    "hallucination": "strictly_disallowed",
    "creative_interpretation": "strictly_disallowed"
  },

  "detail_preservation": {
    "exact_colors": true,
    "exact_pattern": true,
    "exact_fabric_texture": true,
    "logos": { "preserve": true },
    "labels_and_text": {
      "legibility": "maximum",
      "no_warping": true,
      "no_mirroring": true
    },
    "stitching_and_hardware": {
      "exact_transfer": true
    }
  },

  "consistency_rules": {
    "angle_orientation": "locked",
    "color_consistency": "locked_to_reference",
    "reuse_orientation_on_rerender": true
  },

  "negative_constraints": [
    "DO NOT change garment color - keep exact color from reference",
    "DO NOT change stripe/pattern colors or widths",
    "DO NOT change background color or add new background",
    "DO NOT alter overall color temperature or mood",
    "no opposite rotation",
    "no random angle",
    "do not invert camera-facing direction",
    "no white t-shirt hallucination",
    "no extra garments",
    "no color grading or filters"
  ]
}
`;


export async function POST(req: NextRequest) {
  try {
    const {
      productName,
      workflowType, // upper, lower, dress
      uploadedImages,
      gender,
      detailView, // front, back, angled
      resolution = "4K", // DEFAULT 4K
      aspectRatio = "2:3", // DEFAULT 2:3
      tucked = false, // For LOWER body
      // UPPER BODY SPECIFIC OPTIONS
      upperTucked = false, // Is upper garment tucked into pants?
      innerwearTucked = true, // Is innerwear tucked into pants? (default: yes)
      frontOpen = false, // Is front open? (jackets, shirts with buttons)
      innerwearImage = null, // Undershirt/t-shirt reference image
      modelImage = null, // Model reference image (required for upper body)
      preview = false
    } = await req.json();

    // Enhancements: Smart Prompt Construction
    let finalProductName = productName;

    // WORKFLOW-SPECIFIC STYLING
    if (workflowType === "lower") {
      // Lower body: Add undershirt to prevent toplessness
      if (tucked) {
        finalProductName += ". The model is wearing a tight white undershirt completely tucked inside the pants. The waistband, button, and belt loops are fully visible and uncovered. No shirt fabric covering the waist line";
      } else {
        finalProductName += ". The model is wearing a white undershirt";
      }
    } else if (workflowType === "upper") {
      // UPPER BODY: Complex layering logic with SEPARATE tuck controls
      let upperPromptParts: string[] = [];

      // 1. Front open/closed handling
      if (frontOpen) {
        upperPromptParts.push("The garment front is OPEN, unbuttoned/unzipped, revealing what's underneath");
      } else {
        upperPromptParts.push("The garment front is fully CLOSED, all buttons buttoned/zipped up");
      }

      // 2. Upper garment tuck handling - VERY EXPLICIT
      if (upperTucked) {
        upperPromptParts.push("The MAIN OUTER GARMENT is FULLY TUCKED INTO the pants waistband. Waistband fully visible. Belt loops exposed. No fabric draping over waist");
      } else {
        // UNTUCKED - Need to be VERY explicit
        upperPromptParts.push("The top is worn COMPLETELY UNTUCKED");
        upperPromptParts.push("The shirt hangs ENTIRELY OUTSIDE the pants with the FULL hem visible below");
        upperPromptParts.push("ABSOLUTELY NO part of the shirt is inside the pants - NOT partially tucked, NOT half-tucked, NOT front-tucked");
        upperPromptParts.push("The shirt drapes naturally over the waistband, covering it completely");
      }

      // 3. Innerwear handling - SEPARATE from outer garment
      if (innerwearImage) {
        // User provided innerwear image
        if (frontOpen) {
          upperPromptParts.push("Underneath is an undershirt/t-shirt as shown in reference, visible through open front");
        } else {
          upperPromptParts.push("Underneath is an undershirt/t-shirt as shown in reference");
        }

        // Innerwear tuck state (INDEPENDENT from outer garment)
        if (innerwearTucked) {
          upperPromptParts.push("The UNDERSHIRT/INNERWEAR is TUCKED INTO the pants, waistband covers innerwear hem");
        } else {
          upperPromptParts.push("The undershirt/innerwear hangs OUTSIDE the pants, its hem visible below waistband");
        }
      }

      finalProductName += ". " + upperPromptParts.join(". ");
    }

    // 1. Determine FRAMING based on workflow type
    // Upper body = cowboy_shot (head to mid-thigh, shows full top garment with some pants visible)
    // Lower body / Dress = waist_to_above_knees (focuses on pants/skirts)
    const framing = workflowType === 'upper' ? 'cowboy_shot' : 'waist_to_above_knees';

    // 2. Select Template based on View (pass framing)
    let jsonPromptString = "";
    if (detailView === 'back') {
      jsonPromptString = BACK_DETAIL_TEMPLATE(finalProductName, gender, framing);
    } else if (detailView === 'angled') {
      jsonPromptString = ANGLED_DETAIL_TEMPLATE(finalProductName, gender, framing);
    } else {
      jsonPromptString = FRONT_DETAIL_TEMPLATE(finalProductName, gender, framing);
    }

    // 2. Select STRICT Assets (No heuristics, just logic)
    const assets: string[] = [];
    const imgs = uploadedImages;

    // MODEL IMAGE FIRST (Critical for upper body - provides pose/body reference)
    if (modelImage && workflowType === 'upper') {
      assets.push(modelImage);
    }

    // INNERWEAR IMAGE (for upper body - undershirt/t-shirt reference)
    if (innerwearImage && workflowType === 'upper') {
      assets.push(innerwearImage);
    }

    // Common Assets
    if (imgs.background) assets.push(imgs.background);
    if (imgs.detail_1) assets.push(imgs.detail_1);
    if (imgs.detail_2) assets.push(imgs.detail_2);
    if (imgs.detail_3) assets.push(imgs.detail_3);
    if (imgs.fit_pattern) assets.push(imgs.fit_pattern);
    // Shoes only for non-upper workflows (cowboy shot doesn't show feet)
    if (imgs.shoes && workflowType !== 'upper') assets.push(imgs.shoes);
    if (imgs.accessories) assets.push(imgs.accessories);
    // Specific accessories
    if (imgs.bag) assets.push(imgs.bag);
    if (imgs.hat) assets.push(imgs.hat);
    if (imgs.jewelry) assets.push(imgs.jewelry);
    if (imgs.glasses) assets.push(imgs.glasses);
    if (imgs.belt) assets.push(imgs.belt);

    // VIEW SPECIFIC ASSETS
    if (detailView === 'front') {
      // ONLY FRONT inputs
      if (imgs.top_front) assets.push(imgs.top_front);
      if (imgs.bottom_front) assets.push(imgs.bottom_front);
      if (imgs.main_product) assets.push(imgs.main_product); // If main is generic
      // NO BACK
    } else if (detailView === 'back') {
      // ONLY BACK inputs
      if (imgs.top_back) assets.push(imgs.top_back);
      if (imgs.bottom_back) assets.push(imgs.bottom_back);
      // NO FRONT
    } else {
      // ANGLED: BOTH
      if (imgs.top_front) assets.push(imgs.top_front);
      if (imgs.bottom_front) assets.push(imgs.bottom_front);
      if (imgs.top_back) assets.push(imgs.top_back);
      if (imgs.bottom_back) assets.push(imgs.bottom_back);
      if (imgs.main_product) assets.push(imgs.main_product);
    }


    // 3. IF PREVIEW MODE: Return the JSON text itself
    if (preview) {
      return NextResponse.json({
        status: "preview",
        previews: [{
          title: `Detail Spec (${detailView.toUpperCase()})`,
          prompt: jsonPromptString, // Send the JSON string as the "prompt" for preview
          assets: assets,
          settings: { resolution, aspect_ratio: aspectRatio }
        }]
      });
    }

    // 4. REAL GENERATION
    // Check key
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      console.error("Critical: FAL_KEY is missing in server environment.");
      return NextResponse.json({ error: "Configuration Error: FAL_KEY missing" }, { status: 500 });
    }

    // Check assets
    if (assets.length === 0) {
      return NextResponse.json({ error: "No relevant assets found for this view. Please upload at least one image (Top/Bottom/Main) matching the selected view." }, { status: 400 });
    }

    // We use the JSON string AS THE PROMPT.
    const finalPrompt = `Technical Generative Photography Task. Follow this JSON specification strictly:\n${jsonPromptString}`;

    // === BUILD DYNAMIC NEGATIVE PROMPT ===
    let negativePrompt = "low quality, blurry, distorted, white t-shirt hallucination, extra garments, ugly, deformed";

    // Add color/pattern preservation
    negativePrompt += ", " + NEGATIVE_PROMPTS.colorChange;
    negativePrompt += ", " + NEGATIVE_PROMPTS.backgroundChange;

    // Tuck-specific negatives (critical for upper body)
    if (workflowType === 'upper') {
      if (!upperTucked) {
        // UNTUCKED selected - PROHIBIT any tucking
        negativePrompt += ", " + NEGATIVE_PROMPTS.tucked;
      } else {
        // TUCKED selected - PROHIBIT untucked appearance
        negativePrompt += ", " + NEGATIVE_PROMPTS.untucked;
      }
    }

    console.log(`Negative prompt: ${negativePrompt}`);

    // Use Nano Banana Pro consistent with main app
    const endpoint = "fal-ai/nano-banana-pro/edit";

    console.log(`Sending request to ${endpoint} with ${assets.length} assets. Primary: ${assets[0]?.slice(0, 30)}...`);

    const falRes = await fetch(`https://fal.run/${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        negative_prompt: negativePrompt,
        image_urls: assets, // Send ALL assets as reference
        aspect_ratio: aspectRatio,
        resolution: resolution === "1K" ? undefined : resolution // Pass if strict
      }),
    });

    if (!falRes.ok) {
      const err = await falRes.text();
      console.error("FAL API Error:", err);
      // Try to parse JSON error if possible
      let errMsg = err;
      try {
        const eJson = JSON.parse(err);
        if (eJson.detail) errMsg = eJson.detail;
        if (eJson.message) errMsg = eJson.message;
      } catch { }

      return NextResponse.json({ error: `AI Service Error: ${errMsg}` }, { status: falRes.status });
    }

    const data = await falRes.json();
    return NextResponse.json(data);

  } catch (e: any) {
    console.error("Detail API Fatal Error:", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
