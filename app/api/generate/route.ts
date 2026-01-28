import { NextRequest, NextResponse } from "next/server";

// Configure route config
export const maxDuration = 60; // 60 seconds max duration
export const dynamic = 'force-dynamic';

// Negative prompts for common issues
const NEGATIVE_PROMPTS = {
    shoes: "oversized shoes, chunky shoes, large footwear, clown shoes, big shoes, thick soles, platform shoes, bulky sneakers, exaggerated footwear, disproportionate shoes, cartoon shoes, huge feet, giant shoes, massive sneakers, wide shoes, puffy shoes, oversized feet, unrealistic shoe size, shoes too big for body, exaggerated shoe proportions",
    buttons: "open shirt, unbuttoned, open front, chest visible",
    tucked: "tucked in shirt, shirt inside pants, waistband visible",
    flatFabric: "flat fabric, smooth texture, plain surface, digital print look, no texture, solid color fabric, printed stripes, screen print, no weave visible, uniform surface, plastic looking fabric",
    cropping: "cropped head, cut off head, missing head, partial face, close up, zoomed in, out of frame, cropped feet, missing shoes"
};

export async function POST(req: NextRequest) {
    try {
        const {
            productName,
            workflowType: requestedWorkflowType,
            uploadedImages,
            gender,
            prompt: customPrompt,
            poseFocus,
            resolution = "1K",
            aspectRatio = "3:4",
            isAngles,
            preview = false,
            poseDescription,
            buttonsOpen = false,
            tucked = false,
            closureType = 'buttons', // buttons, zipper, or none
            productDescription,
            fitDescription,
            poseStickman = null, // Receive stickman image URL
            detailView = 'front', // 'front' | 'angled' | 'back' for Detail Shots
            editedPrompt = null,
            targetView = null,
            hairBehindShoulders = false
        } = await req.json();

        // One-time random seed for consistency across angles
        const requestSeed = Math.floor(Math.random() * 1000000000);

        // 1. Determine Workflow Type
        const lowerName = productName.toLowerCase();
        let workflowType = requestedWorkflowType || 'upper';

        const lowerKeywords = ['pantolon', 'şort', 'etek', 'tayt', 'jean', 'trousers', 'skirt', 'shorts', 'leggings', 'joggers', 'denim'];
        const fullBodyKeywords = ['elbise', 'tulum', 'romper', 'kaban', 'palto', 'trençkot', 'dress', 'jumpsuit', 'coat', 'gown'];
        const setKeywords = ['takım', 'pijama', 'eşofman takımı', 'bikini', 'set', 'suit'];

        if (setKeywords.some(k => lowerName.includes(k))) {
            workflowType = 'set';
        } else if (fullBodyKeywords.some(k => lowerName.includes(k))) {
            workflowType = 'dress';
        } else if (lowerKeywords.some(k => lowerName.includes(k))) {
            workflowType = 'lower';
        } else {
            workflowType = 'upper';
        }

        // === HELPER: Build Asset List ===
        const buildAssetList = (view: string, imgs: any, focus: string, wfType: string): string[] => {
            const assets: string[] = [];

            // 1. Model always included
            if (imgs.model) assets.push(imgs.model);

            // 2. Garment Assets (Layering Logic)
            if (view === 'styling' || view === 'front') {
                if (imgs.main_product) assets.push(imgs.main_product);
                if (imgs.top_front) assets.push(imgs.top_front);
                if (imgs.bottom_front) assets.push(imgs.bottom_front);
                if (imgs.dress_front) assets.push(imgs.dress_front);
                if (imgs.jacket) assets.push(imgs.jacket);
                // Details
                if (imgs.detail_1) assets.push(imgs.detail_1);
                if (imgs.detail_2) assets.push(imgs.detail_2);
                if (imgs.detail_3) assets.push(imgs.detail_3);
            } else if (view === 'side') {
                if (imgs.main_product) assets.push(imgs.main_product);
                if (imgs.top_front) assets.push(imgs.top_front);
                if (imgs.bottom_front) assets.push(imgs.bottom_front);
                if (imgs.dress_front) assets.push(imgs.dress_front); // Include dress in side view
                if (imgs.jacket) assets.push(imgs.jacket);
                if (imgs.backRefUpload) assets.push(imgs.backRefUpload);
                // Details often help side view too (fabric, pockets)
                if (imgs.detail_1) assets.push(imgs.detail_1);
                if (imgs.detail_2) assets.push(imgs.detail_2);
                if (imgs.detail_3) assets.push(imgs.detail_3);
            } else if (view === 'back') {
                if (imgs.top_back) assets.push(imgs.top_back);
                else if (imgs.top_front) assets.push(imgs.top_front);

                if (imgs.bottom_back) assets.push(imgs.bottom_back);
                else if (imgs.bottom_front) assets.push(imgs.bottom_front);

                if (imgs.jacket) assets.push(imgs.jacket);
                if (imgs.backRefUpload) assets.push(imgs.backRefUpload);
            }

            // 3. Shoes (Only for full body / lower focus)
            if (focus !== 'upper' && focus !== 'closeup' && imgs.shoes) {
                assets.push(imgs.shoes);
            }

            // 4. Common Assets
            if (imgs.background) assets.push(imgs.background);
            if (imgs.inner_wear) assets.push(imgs.inner_wear);
            if (imgs.belt) assets.push(imgs.belt);
            if (imgs.hat) assets.push(imgs.hat);
            if (imgs.bag) assets.push(imgs.bag);
            if (imgs.glasses) assets.push(imgs.glasses);

            if (imgs.glasses) assets.push(imgs.glasses);

            // 5. POSE REFERENCE (Stickman)
            // If stickman exists, we include it as an asset because it's clean and won't leak texture.
            if (poseStickman) {
                assets.push(poseStickman);
            }
            // Note: We still exclude original 'imgs.pose' to avoid leakage.

            // 6. DETAIL SHOT - SPECIAL ASSET FILTERING
            if (focus === 'detail') {
                // Clear previous assets and rebuild STRICTLY
                assets.length = 0;
                if (imgs.model) assets.push(imgs.model);
                if (imgs.background) assets.push(imgs.background);

                // Details are crucial
                if (imgs.detail_1) assets.push(imgs.detail_1);
                if (imgs.detail_2) assets.push(imgs.detail_2);
                if (imgs.detail_3) assets.push(imgs.detail_3);

                if (detailView === 'front') {
                    // STRICT FRONT: Front assets only
                    if (imgs.main_product) assets.push(imgs.main_product);
                    if (imgs.top_front) assets.push(imgs.top_front);
                    if (imgs.bottom_front) assets.push(imgs.bottom_front);
                    if (imgs.dress_front) assets.push(imgs.dress_front);
                    if (imgs.jacket) assets.push(imgs.jacket);
                    if (imgs.inner_wear) assets.push(imgs.inner_wear);
                    if (imgs.belt) assets.push(imgs.belt);
                } else if (detailView === 'back') {
                    // STRICT BACK: Back assets only
                    if (imgs.top_back) assets.push(imgs.top_back);
                    if (imgs.bottom_back) assets.push(imgs.bottom_back);
                    if (imgs.backRefUpload) assets.push(imgs.backRefUpload);
                    // Jacket usually visible from back
                    if (imgs.jacket) assets.push(imgs.jacket);
                } else {
                    // ANGLED: All assets
                    if (imgs.main_product) assets.push(imgs.main_product);
                    if (imgs.top_front) assets.push(imgs.top_front);
                    if (imgs.bottom_front) assets.push(imgs.bottom_front);
                    if (imgs.dress_front) assets.push(imgs.dress_front);
                    if (imgs.jacket) assets.push(imgs.jacket);
                    if (imgs.top_back) assets.push(imgs.top_back);
                    if (imgs.bottom_back) assets.push(imgs.bottom_back);
                    if (imgs.backRefUpload) assets.push(imgs.backRefUpload);
                    if (imgs.inner_wear) assets.push(imgs.inner_wear);
                    if (imgs.belt) assets.push(imgs.belt);
                }
            }

            return assets;
        };

        // 2. Build Structured Prompt JSON for each view
        const buildStructuredPrompt = (view: 'styling' | 'front' | 'side' | 'back') => {

            // === STRUCTURED PROMPT OBJECT ===
            const structuredPrompt: any = {
                intent: "Fashion e-commerce photography",

                subject: {
                    type: gender === 'male' ? 'male_model' : gender === 'female' ? 'female_model' : 'model',
                    identity: uploadedImages.model ? "match_provided_model_image" : "generic_fashion_model",
                    hair: hairBehindShoulders ? "behind_shoulders" : "natural"
                },

                garment: {
                    name: productName,
                    type: workflowType,
                    fabric: null as string | null,
                    fit: null as string | null
                },

                styling: {
                    buttons: buttonsOpen ? "open" : "closed",
                    tucked: tucked,
                    inner_wear: uploadedImages.inner_wear ? true : false,
                    layers: {
                        jacket: !!uploadedImages.jacket,
                        dress: !!uploadedImages.dress_front,
                        upper_garment: !!uploadedImages.top_front, // NEW: Track upper garment
                    }
                },

                accessories: {
                    shoes: uploadedImages.shoes ? {
                        style: "slim low-profile sneakers",
                        size: "SMALL, thin, minimal, proportional to body - NOT chunky, NOT oversized"
                    } : null,
                    belt: uploadedImages.belt ? true : false,
                    hat: uploadedImages.hat ? true : false,
                    glasses: uploadedImages.glasses ? true : false,
                    bag: uploadedImages.bag ? true : false
                },

                pose: {
                    reference: null, // No image ref, only text
                    description: poseDescription, // Analyzed text description
                    dynamic: true
                },
                camera: {
                    shot_type: "full_body",
                    angle: view,
                    framing: "head_to_toe"
                },

                scene: {
                    background: uploadedImages.background ? "match_provided_background" : "clean_studio",
                    lighting: "soft_fashion_lighting"
                },

                // Removed duplicate pose block
            };

            // === ENRICH WITH ANALYSIS DATA ===

            // Fabric/Texture from productDescription
            // Fabric/Texture from productDescription
            if (productDescription) {
                // Clean up any potential "undefined" or garbage text
                let fabricInfo = productDescription;

                // If the description contains "Texture: undefined" or similar errors, try to salvage or clear it
                if (fabricInfo.includes("undefined") || fabricInfo.includes("null")) {
                    fabricInfo = fabricInfo.replace(/Texture:\s*undefined\.?/gi, "")
                        .replace(/Pattern:\s*undefined\.?/gi, "")
                        .replace(/undefined/gi, "");
                }

                // Don't remove first sentence blindy. Usage determines context.
                // Just use the full description as it contains rich details.
                if (fabricInfo.trim().length > 5) {
                    structuredPrompt.garment.fabric = fabricInfo.trim();
                }
            }

            // Fit from fitDescription (for pants)
            if (fitDescription && workflowType === 'lower') {
                structuredPrompt.garment.fit = fitDescription;
            }

            // === VIEW-SPECIFIC ADJUSTMENTS ===

            if (view === 'styling') {
                // Handle 4 framing options: closeup, upper, full, lower
                if (poseFocus === 'closeup') {
                    structuredPrompt.camera.shot_type = 'close_up';
                    structuredPrompt.camera.framing = 'chest_and_face'; // Focus on upper details
                    structuredPrompt.accessories.shoes = null; // No shoes in close-up
                } else if (poseFocus === 'upper') {
                    structuredPrompt.camera.shot_type = 'cowboy_shot'; // Explicitly cowboy_shot
                    structuredPrompt.camera.framing = 'cowboy_shot';
                    structuredPrompt.accessories.shoes = null; // No shoes
                } else if (poseFocus === 'lower') {
                    structuredPrompt.camera.shot_type = 'medium_shot';
                    structuredPrompt.camera.framing = 'waist_down'; // Waist to feet
                } else { // full
                    structuredPrompt.camera.shot_type = 'full_body';
                    structuredPrompt.camera.framing = 'head_to_toe';
                }

                // DETAIL SHOT LOGIC
                if (poseFocus === 'detail') {
                    structuredPrompt.camera.shot_type = 'close_up';
                    structuredPrompt.camera.framing = 'waist_to_above_knees'; // Focus on lower/detail
                    structuredPrompt.accessories.shoes = null; // No shoes

                    if (detailView === 'front') structuredPrompt.pose.angle = "front";
                    else if (detailView === 'back') structuredPrompt.pose.angle = "back";
                    else if (detailView === 'angled') structuredPrompt.pose.angle = "slight_rotation_15_deg";
                }

                // Pose reference type
                if (poseStickman) {
                    structuredPrompt.pose.reference = "use reference stickman image";
                }
            } else {
                // Technical angles (front, side, back)
                structuredPrompt.pose.dynamic = false;
                structuredPrompt.pose.reference = view === 'front' ? "standing straight, arms at sides" :
                    view === 'side' ? "profile view, natural stance" :
                        "back view, straight posture";

                // Framing Logic for Technical Angles
                // Upper -> Cowboy Shot
                // Lower/Full/Set -> Full Body
                if (workflowType === 'upper') {
                    structuredPrompt.camera.shot_type = 'cowboy_shot'; // Explicitly cowboy_shot
                    structuredPrompt.camera.framing = 'cowboy_shot';
                } else {
                    structuredPrompt.camera.shot_type = 'full_body';
                    structuredPrompt.camera.framing = 'head_to_toe';
                }
            }

            // === CONVERT TO TEXT PROMPT ===
            const textPrompt = convertStructuredToText(structuredPrompt, view, workflowType);

            // === BUILD NEGATIVE PROMPT ===
            let negativePrompt = "";
            if (structuredPrompt.accessories.shoes) {
                negativePrompt += NEGATIVE_PROMPTS.shoes;
            }
            if (!buttonsOpen) {
                negativePrompt += ", " + NEGATIVE_PROMPTS.buttons;
            }
            if (!tucked && workflowType === 'upper') {
                negativePrompt += ", " + NEGATIVE_PROMPTS.tucked;
            }

            // ALWAYS add flatFabric negative prompt to enforce textured fabric
            // This is critical for striped/textured fabrics
            negativePrompt += ", " + NEGATIVE_PROMPTS.flatFabric;

            // Enforce framing for Full Body shots
            if (workflowType !== 'upper') {
                negativePrompt += ", " + NEGATIVE_PROMPTS.cropping;
            }

            // Add custom prompt OR use user-edited full prompt
            let finalPrompt = textPrompt;
            if (editedPrompt) {
                // User edited the prompt directly - use their version instead
                finalPrompt = editedPrompt;
            } else if (customPrompt) {
                finalPrompt += ` ${customPrompt}`;
            }

            // === ASSET FILTERING ===
            const activeAssets = buildAssetList(view, uploadedImages, poseFocus, workflowType);

            console.log(`\n=== STRUCTURED PROMPT (${view.toUpperCase()}) ===`);
            console.log(JSON.stringify(structuredPrompt, null, 2));
            console.log(`\n=== TEXT PROMPT ===\n${finalPrompt}\n`);

            return {
                prompt: finalPrompt,
                negative_prompt: negativePrompt,
                input_images: activeAssets,
                structured: structuredPrompt // For debugging
            };
        };

        // === HELPER: Convert Structured JSON to Text - SIMPLIFIED & NATURAL ===
        const convertStructuredToText = (sp: any, view: string, wfType: string): string => {
            const parts: string[] = [];

            // 1. Core Subject & Action (Natural Language)
            // 1. Core Subject & Action (Natural Language)
            // Add MODEL HEIGHT and SHOE SIZE for realistic proportions
            // Fix: Check for 'male_model' (underscore) as defined in line 174
            const modelHeight = (sp.subject.type === 'male_model' || sp.subject.type === 'male') ? '190cm tall, wearing EU size 43 shoes' : '175cm tall, wearing EU size 38 shoes';

            let openingSentence = "Medium format fashion photography.";
            if (wfType === 'upper') {
                openingSentence = "Cowboy Shot (Head to Mid-Thigh) fashion photography.";
            }

            parts.push(`${openingSentence} A professional ${sp.subject.type.replace('_', ' ')} (${modelHeight}) is posing wearing ${sp.garment.name}. Realistic body proportions, correctly sized footwear.`);

            // 2. Shot Styling & Framing
            if (view === 'styling') {
                if (sp.camera.framing === 'chest_and_face') {
                    parts.push("Camera framing is close-up on chest and face, focusing on upper garment details.");
                } else if (sp.camera.framing === 'waist_up') {
                    // Deprecated but kept for fallback
                    parts.push("Camera framing is waist-up medium shot.");
                } else if (sp.camera.framing === 'cowboy_shot') {
                    // NEW: Cowboy shot framing
                    parts.push("Camera framing is Cowboy Shot (Head to Mid-Thigh). Hands fully visible. Focus on upper body garment with some pants visible.");
                } else if (sp.camera.framing === 'waist_down') {
                    parts.push("Camera framing is waist-down, focusing on pants and shoes.");
                } else if (sp.camera.framing === 'waist_to_above_knees') {
                    // NEW: Detail Shot logic
                    parts.push("Detail shot. Framing: Waist to Above Knees (Lower Body Detail). Focus on garment construction and fabric.");
                } else {
                    parts.push("Camera framing is full body, head to toe visible.");
                }
                parts.push("Dynamic fashion pose.");
            } else {
                // Technical angles framing enforcement
                let shotDesc = `Technical ${view} view`;

                if (workflowType === 'upper') {
                    shotDesc += ", Cowboy Shot framing (Head to Mid-Thigh). Hands fully visible.";
                } else {
                    shotDesc += ", FULL BODY shot, Head to Toe visible, shoes visible.";
                }

                if (view === 'side') {
                    shotDesc += " Side profile view, full outfit and shoes visible.";
                } else if (view === 'front') {
                    shotDesc += " Front facing. Neutral standing pose, arms hanging straight down at sides. NOT hands on hips. Symmetrical stance.";
                } else if (view === 'back') {
                    shotDesc += " Back view.";
                    if (workflowType === 'upper') {
                        shotDesc += " Cowboy Shot framing from behind (Head to Mid-Thigh). Hands fully visible. Camera cuts off at thigh level. DO NOT show full legs or shoes.";
                    } else {
                        // STRICT FULL BODY for Lower/Set/Dress
                        shotDesc += " FULL BODY BACK VIEW. Head, torso, legs, and shoes MUST be fully visible from behind. Do not crop head. Do not crop feet.";
                    }
                }

                parts.push(shotDesc);
                parts.push("Standing straight pose.");
            }

            // 3. Clothing Details (Fabric & Fit)
            if (sp.garment.fabric) {
                // Add fabric description significantly
                parts.push(`The garment material is ${sp.garment.fabric}.`);
            }
            if (sp.garment.fit) {
                // ENHANCED FIT & LENGTH LOGIC
                parts.push(`FIT & SILHOUETTE (CRITICAL): ${sp.garment.fit}.`);

                // Explicitly translate length terms to Nano Banana visual constraints
                const fitLower = sp.garment.fit.toLowerCase();
                if (fitLower.includes("floor-length")) {
                    parts.push("LENGTH CONSTRAINT: The pants MUST touch the floor and cover the shoes entirely. Long pooling hem.");
                } else if (fitLower.includes("full-length")) {
                    parts.push("LENGTH CONSTRAINT: The pants MUST hit the floor exactly. Full length silhouette.");
                } else if (fitLower.includes("ankle-length")) {
                    parts.push("LENGTH CONSTRAINT: The hem MUST end precisely at the ankle bone. DO NOT extend to the floor. Visible gap between hem and shoes.");
                } else if (fitLower.includes("cropped")) {
                    parts.push("LENGTH CONSTRAINT: Cropped fit. The hem is 3 inches above the ankle. High-water style. Clear visibility of ankles and socks/shoes.");
                } else if (fitLower.includes("culotte")) {
                    parts.push("LENGTH CONSTRAINT: Mid-calf length. Wide leg opening ending halfway down the shin.");
                }

                parts.push("Maintain these exact proportions relative to the model's height.");
            }

            // Fabric/Texture - CRITICAL: Match reference image texture EXACTLY
            if (sp.garment.fabric) {
                let fabricDesc = sp.garment.fabric;

                // CRITICAL: Enforce texture matching from reference images
                parts.push(`FABRIC TEXTURE (CRITICAL - MUST MATCH REFERENCE IMAGE EXACTLY):`);
                parts.push(`${fabricDesc}`);

                // Generic texture enforcement without hallucinations
                parts.push('TEXTURE REQUIREMENTS: The fabric must show realistic textile structure consistent with the description. Maintain visible thread texture and material depth. DO NOT render as flat/smooth digital print.');
            } else {
                // Even without analysis, enforce texture awareness
                parts.push('Fabric should show realistic textile texture - visible weave, thread structure, material depth. NOT flat or digitally printed look.');
            }

            // 4. Styling Details (Buttons, Tucks)
            // Enable logic if Upper workflow, OR if garment name implies top, OR if an upper garment layer exists
            if (wfType === 'upper' || sp.garment.name.toLowerCase().includes('shirt') || sp.garment.name.toLowerCase().includes('jacket') || sp.styling.layers.upper_garment) {
                if (sp.styling.buttons === 'closed') {
                    parts.push("Buttons: CLOSED. The garment is FULLY BUTTONED UP. Front opening is closed. Inner wear is visible ONLY at the neckline/collar.");
                } else {
                    parts.push("The garment is worn open.");
                }
            }

            // Layering & Additional Garments Logic
            if (sp.styling.layers?.jacket) {
                parts.push("Wearing a jacket/coat as an OUTER layer over the main outfit. The jacket is the outermost layer.");
            } else if (sp.styling.layers.upper_garment && wfType !== 'upper') {
                // If we are showcasing pants (lower) but have a top_front image, mention it
                parts.push("Wearing upper garment matching the provided upper front reference image.");
            }

            // Tuck logic
            if (wfType === 'upper') {
                if (sp.styling.tucked) {
                    parts.push("The top is tucked into the pants.");
                } else {
                    parts.push("The top is worn untucked.");
                }
            } else if (wfType === 'lower') {
                if (sp.styling.tucked) {
                    parts.push("The upper garment/inner wear is tightly tucked into the pants waistband. Waistband fully visible. No shirt draping over waist.");
                } else {
                    parts.push("The upper garment hangs loose over the waistband.");
                }
            }

            // Inner wear interaction
            if (sp.styling.inner_wear) {
                if (uploadedImages.top_front || sp.styling.layers?.jacket || wfType === 'upper') {
                    parts.push("Wearing inner item (t-shirt/tank) UNDER the main upper garment.");
                } else {
                    parts.push("Wearing an inner wear top.");
                }
            }

            // Inner wear - EXPLICIT REFERENCE
            if (sp.styling.inner_wear) {
                parts.push("Wearing inner t-shirt/undershirt. CRITICAL: The inner wear MUST EXACTLY match the provided inner wear reference image in color, style, and fabric.");
            }

            // Shoes - EXPLICIT REFERENCE
            if (sp.accessories.shoes) {
                parts.push(`Shoes: CRITICAL: Model is wearing the EXACT shoes shown in the provided shoe reference image. Copy shoe color, style, and shape EXACTLY. Proportional slim footwear, NOT oversized.`);
            }

            // 5. Model Source (Identity)
            if (sp.subject.identity === 'match_provided_model_image') {
                parts.push("Model identity (face and body) must strictly match the provided model reference image.");
            }

            // Hair position instruction
            if (sp.subject.hair === "behind_shoulders") {
                parts.push("STYLING: The model's hair is neatly tucked behind her shoulders and back. The hair MUST NOT cover the garment, shoulders, or neckline. Full visibility of the product front.");
            }

            // 6. Pose Source (Pose Description OR Pose Reference)
            if (view === 'styling') {
                if (sp.pose.description) {
                    // Use the analyzed description
                    parts.push(`POSE INSTRUCTION: ${sp.pose.description}`);
                }

                if (poseStickman) {
                    // Stickman exists, rely on structured JSON reference and asset input.
                } else if (sp.pose.reference) {
                    // Fallback
                    parts.push("The model is mimicking the pose from the pose reference image. Use ONLY the body position (arms, legs, stance) from the pose reference.");
                }

                // DETAIL PROMPT INJECTION (User Specific Logic)
                if (poseFocus === 'detail') {
                    if (detailView === 'angled') {
                        parts.push("View: Angled (Canonical). Rotation: Slight 10-20 degrees vertical axis. Camera facing bias: front_faces_camera_left. Keep full visibility.");
                    } else if (detailView === 'back') {
                        parts.push("View: Back. Camera Angle: Eye Level. Lighting: Soft Diffused Studio.");
                    } else {
                        parts.push("View: Front. Camera Angle: Eye Level. Lighting: Soft Diffused Studio.");
                    }
                    parts.push("Detail Preservation: Maximize label legibility, exact stitching transfer. Hallucination strictly disallowed.");
                }

            }

            // 7. Background Source
            if (sp.scene.background === 'match_provided_background') {
                parts.push("Background matches the provided background reference image exactly.");
            } else {
                parts.push("Clean studio background.");
            }

            // 8. Face Visibility
            if (view === 'front' || view === 'styling') {
                parts.push("The model is looking at the camera.");
            }

            return parts.join(" ");
        };

        // NOTE: detail_1, detail_2, fit_pattern are NOT sent - only used for analysis

        // === GENERATION HELPER ===
        const generateOne = async (view: 'styling' | 'front' | 'side' | 'back') => {
            const reqData = buildStructuredPrompt(view);

            let finalRes = '1K';
            if (typeof resolution === 'string') {
                if (resolution.includes('2K')) finalRes = '2K';
                if (resolution.includes('4K')) finalRes = '4K';
            }

            const falPayload = {
                prompt: reqData.prompt,
                negative_prompt: reqData.negative_prompt,
                image_urls: reqData.input_images,
                aspect_ratio: aspectRatio,
                resolution: finalRes,
                seed: requestSeed,
                output_format: "png"
            };

            const falKey = process.env.FAL_KEY;
            if (!falKey) throw new Error("FAL_KEY missing");

            const response = await fetch("https://fal.run/fal-ai/nano-banana-pro/edit", {
                method: "POST",
                headers: {
                    "Authorization": `Key ${falKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(falPayload),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Fal API Error (${view}): ${err}`);
            }
            const data = await response.json();
            return data.images?.[0]?.url;
        };

        // === PREVIEW MODE ===
        if (preview) {
            if (isAngles) {
                // Check if targetView is specified (Single Angle Mode)
                if (targetView) {
                    const promptData = buildStructuredPrompt(targetView);
                    return NextResponse.json({
                        status: "preview",
                        previews: [{
                            title: `${targetView.charAt(0).toUpperCase() + targetView.slice(1)} View`,
                            prompt: promptData.prompt,
                            structured: promptData.structured,
                            assets: promptData.input_images,
                            settings: { resolution, aspect_ratio: aspectRatio }
                        }]
                    });
                }

                // Return ALL 3 PROMPTS for 3-Angle Mode
                const frontData = buildStructuredPrompt('front');
                const sideData = buildStructuredPrompt('side');
                const backData = buildStructuredPrompt('back');

                return NextResponse.json({
                    status: "preview",
                    previews: [
                        {
                            title: "Front View",
                            prompt: frontData.prompt,
                            structured: frontData.structured,
                            assets: frontData.input_images,
                            settings: { resolution, aspect_ratio: aspectRatio }
                        },
                        {
                            title: "Side View",
                            prompt: sideData.prompt,
                            structured: sideData.structured,
                            assets: sideData.input_images,
                            settings: { resolution, aspect_ratio: aspectRatio }
                        },
                        {
                            title: "Back View",
                            prompt: backData.prompt,
                            structured: backData.structured,
                            assets: backData.input_images,
                            settings: { resolution, aspect_ratio: aspectRatio }
                        }
                    ]
                });
            } else {
                // Normal Styling Mode
                const reqData = buildStructuredPrompt('styling');
                return NextResponse.json({
                    status: "preview",
                    previews: [{
                        title: "Styling Shot",
                        prompt: reqData.prompt,
                        structured: reqData.structured,
                        assets: reqData.input_images,
                        settings: { resolution, aspect_ratio: aspectRatio }
                    }]
                });
            }
        }

        // === EXECUTION ===
        let results: string[] = [];

        if (isAngles) {
            if (targetView) {
                // SINGLE VIEW MODE (within 3-Angle context)
                const url = await generateOne(targetView as any);
                if (url) results.push(url);
            } else {
                // ALL 3 VIEWS
                const [frontUrl, sideUrl, backUrl] = await Promise.all([
                    generateOne('front'),
                    generateOne('side'),
                    generateOne('back')
                ]);
                results = [frontUrl, sideUrl, backUrl].filter(Boolean);
            }
        } else {
            const url = await generateOne('styling');
            if (url) results.push(url);
        }

        return NextResponse.json({
            status: "completed",
            images: results
        });

    } catch (error: any) {
        console.error("Generation error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
