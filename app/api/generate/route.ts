import { NextRequest, NextResponse } from "next/server";

// Configure route config
export const maxDuration = 60; // 60 seconds max duration
export const dynamic = 'force-dynamic';

// Negative prompts for common issues
const NEGATIVE_PROMPTS = {
    shoes: "oversized shoes, chunky shoes, large footwear, clown shoes, big shoes, thick soles, platform shoes, bulky sneakers, exaggerated footwear, disproportionate shoes, cartoon shoes, huge feet, giant shoes, massive sneakers, wide shoes, puffy shoes, oversized feet, unrealistic shoe size, shoes too big for body, exaggerated shoe proportions",
    buttons: "open shirt, unbuttoned, open front, chest visible",
    tucked: "tucked in shirt, shirt inside pants, waistband visible, belt, belt loops, exposed pants button, high-waisted styling, shirt tucked in, shirt tucked into jeans, shirt inside waistband",
    untucked: "untucked shirt, loose hem, shirt over pants, hidden waistband, long shirt hanging out", // NEW negative
    flatFabric: "flat fabric, smooth texture, plain surface, digital print look, no texture, solid color fabric, printed stripes, screen print, no weave visible, uniform surface, plastic looking fabric",
    cropping: "cropped head, cut off head, missing head, partial face, close up, zoomed in, out of frame, cropped feet, missing shoes",
    wind: "strong wind hair, messy hair, disheveled hair, chaotic strands",
    equipment: "studio lighting equipment, softbox, flash, umbrella, reflector, camera tripod, photography gear, studio lamps, light stand, visible equipment",
    distorted_logo: "text, logo, branding, writing, watermark, signature, letters, words, print on back, brand name, typography",
    technicalDistortions: "bent body, rotated torso, angled stance, curved spine, wrinkled garment, folded hem, curled hemline, uneven hem, wavy fabric at bottom, diagonal hemline, distorted silhouette"
};

const EXPRESSIONS = [
    "Expression: calm confident neutral, slight squinch (lower eyelids gently raised), lips softly closed, tiny asymmetry (one mouth corner ~2% higher), relaxed brows.",
    "Expression: friendly-neutral, micro-smile only in one corner, jaw relaxed, cheeks subtly lifted, eyes engaged not wide.",
    "Expression: serious with intention, micro-squint, lips very lightly pressed (not tight), one brow a touch lower, no frown lines.",
    "Expression: subtle curiosity, inner brows slightly raised, lips parted 1–2 mm, eyes alert but soft, no exaggerated smile.",
    "Expression: thoughtful neutral, gaze steady, eyelids relaxed, lips gently together with a slight lower-lip softness, mild brow knit (very subtle).",
    "Expression: warm and professional, faint micro-smile, slight squinch, eyebrows relaxed (not arched), calm eyes.",
    "Expression: barely playful, eyes soften, no teeth, keep it understated and natural.",
    "Expression: tiny smirk (only one corner), micro-squint, chin neutral, keep symmetry imperfect and realistic.",
    "Expression: calm intensity, lower eyelids slightly tightened, lips neutral, minimal brow tension, ‘present’ look (not blank).",
    "Expression: relaxed neutral, slight asymmetry in brows and mouth, gentle squinch, avoid frozen lips and perfectly mirrored features."
];

const GAZES = [
    "Gaze: looking directly into the camera lens, eyes centered in the sockets, engaged.",
    "Gaze: looking at a point just to the right of the lens (tiny offset), eyes still centered, calm.",
    "Gaze: looking at a point just to the left of the lens (tiny offset), soft focus, not wide-eyed.",
    "Gaze: looking slightly above the lens (a few degrees), then settle back to neutral, composed.",
    "Gaze: looking slightly below the lens (a few degrees), relaxed eyelids, subtle confidence.",
    "Gaze: looking past the camera as if noticing something near the lens, eyes not cranked to the side.",
    "Gaze: ‘face this way, eyes back to camera’ look—head stays angled, eyes return toward lens without showing too much white.",
    "Gaze: near-camera contact (at the camera edge), soft and friendly, eyes centered.",
    "Gaze: short ‘micro-shift’—eyes slightly off-lens but still forward, like a candid in-between moment.",
    "Gaze: calm ‘present’ stare—steady focus, no startled look, eyelids gently relaxed."
];

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
            upperGarmentDescription,
            lowerGarmentDescription,
            innerWearDescription,
            shoesDescription, // NEW
            poseStickman = null, // Receive stickman image URL
            detailView = 'front', // 'front' | 'angled' | 'back' for Detail Shots
            editedPrompt = null,
            targetView = null,
            hairBehindShoulders = false,
            lookAtCamera = true, // Default to true
            socksType = 'none', // 'none' | 'white' | 'black'
            enableWind = false, // NEW: Subtle airflow toggle
            isStylingShot = true, // NEW: Flag to identify styling
            lightingPositive = null, // NEW
            lightingNegative = null, // NEW
            seed = null, // NEW
            enableWebSearch = false, // NEW
            enableExpression = false, // NEW: Expression variation toggle
            enableGaze = false, // NEW: Gaze variation toggle
            shotIndex = 1, // NEW: 1-indexed shot order in batch
            shotRole = null, // NEW: 'styling' (hero) or 'technical' (angles/detail)
            collarType = 'none',
            shoulderType = 'none',
            waistType = 'none',
            riseType = 'none',
            legType = 'none',
            hemType = 'none',
            sleevesRolled = false,
            excludeBeltAsset = false,
            excludeHatAsset = false,
            excludeShoesAsset = false,
            modelDescription = null // NEW
        } = await req.json();

        // One-time random seed for consistency across angles
        const requestSeed = (seed !== null && seed !== undefined) ? Number(seed) : Math.floor(Math.random() * 1000000000);

        // Determine derived shot role if not explicitly provided
        const effectiveRole = shotRole || (isStylingShot && !isAngles && poseFocus !== 'detail' && poseFocus !== 'closeup' ? 'styling' : 'technical');

        // === SAFETY: Ensure raw 'pose' image is NEVER included in input_images ===
        // We only use 'poseStickman' for pose control later.
        if (uploadedImages && uploadedImages.pose) {
            delete uploadedImages.pose;
        }

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

        // === SYNC detailView with targetView for Batch Mode ===
        let activeDetailView = detailView;
        if (targetView && poseFocus === 'detail') {
            if (targetView === 'back') activeDetailView = 'back';
            else if (targetView === 'side') activeDetailView = 'angled';
            else activeDetailView = 'front';
        }

        // === HELPER: Clean Description for Back View ===
        const cleanProductDescription = (desc: string, isBack: boolean): string => {
            if (!desc || !isBack) return desc;
            return desc.split(/[.!?]/).filter(s => {
                const lower = s.toLowerCase().trim();
                const mentionsFront = lower.includes('front') || lower.includes('chest') || lower.includes('frontal');
                const mentionsBack = lower.includes('back') || lower.includes('rear');
                if (mentionsFront && !mentionsBack) return false;
                return true;
            }).join('. ').trim();
        };

        // === HELPER: Build Asset List ===
        const buildAssetList = (view: string, imgs: any, focus: string, wfType: string): string[] => {
            const assets: string[] = [];

            // 1. Model always included
            if (imgs.model) assets.push(imgs.model);

            // Detail Assets Grouping
            const frontDetails = [imgs.detail_front_1, imgs.detail_front_2, imgs.detail_front_3, imgs.detail_front_4].filter(Boolean);
            const backDetails = [imgs.detail_back_1, imgs.detail_back_2, imgs.detail_back_3, imgs.detail_back_4].filter(Boolean);

            // 2. Garment Assets (Comprehensive Coverage for all views)
            // Added logic to handle view-specific asset visibility while ensuring main_product is present
            const isFront = view === 'front' || view === 'styling' || view.includes('front');
            const isBack = view === 'back' || view.includes('back');
            const isSide = view === 'side' || view.includes('side') || view.includes('angled');

            if (isFront || isSide) {
                if (imgs.main_product) assets.push(imgs.main_product);
                if (imgs.top_front) assets.push(imgs.top_front);
                if (imgs.dress_front) assets.push(imgs.dress_front);
                if (imgs.inner_wear) assets.push(imgs.inner_wear);
                if (imgs.bottom_front && focus !== 'closeup') assets.push(imgs.bottom_front);
                if (imgs.jacket) assets.push(imgs.jacket);
                assets.push(...frontDetails);
            }

            if (isBack || isSide) {
                if (imgs.main_product && !isFront) assets.push(imgs.main_product); // Ensure it's there if back-only
                if (imgs.top_back) assets.push(imgs.top_back);
                else if (imgs.top_front && !isFront) assets.push(imgs.top_front);

                if (imgs.bottom_back) assets.push(imgs.bottom_back);
                else if (imgs.bottom_front && !isFront) assets.push(imgs.bottom_front);

                if (imgs.jacket && !isFront) assets.push(imgs.jacket);
                if (imgs.backRefUpload) assets.push(imgs.backRefUpload);
                assets.push(...backDetails);
            }

            // 3. Shoes (Include if not explicitly excluded)
            // USER RULE: Shot 1 + Upper Body + Upper Workflow = NO SHOES (neither prompt nor asset)
            const isFirstUpperStyling = wfType === 'upper' && focus === 'upper' && shotIndex === 1;

            if (imgs.shoes && !excludeShoesAsset && !isFirstUpperStyling) {
                assets.push(imgs.shoes);
            }

            // 4. Common Assets
            if (imgs.background) assets.push(imgs.background);
            if (imgs.belt && !excludeBeltAsset) assets.push(imgs.belt);
            if (imgs.hat && !excludeHatAsset) assets.push(imgs.hat);
            if (imgs.bag) assets.push(imgs.bag);
            if (imgs.glasses) assets.push(imgs.glasses);
            if (imgs.lighting) assets.push(imgs.lighting);

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

                if (activeDetailView === 'front') {
                    // STRICT FRONT: Front assets + Front details
                    if (imgs.main_product) assets.push(imgs.main_product);
                    if (imgs.top_front) assets.push(imgs.top_front);
                    if (imgs.bottom_front) assets.push(imgs.bottom_front);
                    if (imgs.dress_front) assets.push(imgs.dress_front);
                    if (imgs.inner_wear) assets.push(imgs.inner_wear);
                    assets.push(...frontDetails);
                } else if (activeDetailView === 'back') {
                    // STRICT BACK: Back assets + Back details
                    if (imgs.top_back) assets.push(imgs.top_back);
                    if (imgs.bottom_back) assets.push(imgs.bottom_back);
                    if (imgs.backRefUpload) assets.push(imgs.backRefUpload);
                    assets.push(...backDetails);
                } else {
                    // ANGLED: All assets + All details
                    if (imgs.main_product) assets.push(imgs.main_product);
                    if (imgs.top_front) assets.push(imgs.top_front);
                    if (imgs.bottom_front) assets.push(imgs.bottom_front);
                    if (imgs.dress_front) assets.push(imgs.dress_front);
                    if (imgs.top_back) assets.push(imgs.top_back);
                    if (imgs.bottom_back) assets.push(imgs.bottom_back);
                    if (imgs.backRefUpload) assets.push(imgs.backRefUpload);
                    if (imgs.inner_wear) assets.push(imgs.inner_wear);
                    assets.push(...frontDetails);
                    assets.push(...backDetails);
                }
            }

            return assets;
        };

        // 2. Build Structured Prompt JSON for each view
        const buildStructuredPrompt = (view: 'styling' | 'front' | 'side' | 'back') => {
            const isBackView = view.includes('back') || (targetView === 'back' && view === 'back') || (activeDetailView === 'back' && view === 'back');

            // === STRUCTURED PROMPT OBJECT ===
            const structuredPrompt: any = {
                intent: "Fashion e-commerce photography",

                subject: {
                    type: gender === 'male' ? 'male_model' : gender === 'female' ? 'female_model' : 'model',
                    identity: uploadedImages.model ? "match_provided_model_image" : "generic_fashion_model",
                    hair_behind_shoulders: hairBehindShoulders, // Explicit boolean
                    look_at_camera: lookAtCamera, // NEW: Explicit boolean
                    body_description: modelDescription || null, // NEW: Custom physical traits
                    wind: (workflowType === 'lower' && isStylingShot && enableWind) ||
                        (workflowType === 'upper' && isStylingShot && enableWind && (shotIndex === 1 || shotIndex === 3))
                },

                garment: {
                    name: productName,
                    type: workflowType,
                    fabric: productDescription,
                    fit: fitDescription,
                    closure_type: closureType,
                    details: {
                        collar: (workflowType === 'upper' || workflowType === 'dress' || workflowType === 'set') && collarType !== 'none' ? collarType : null,
                        shoulder: (workflowType === 'upper' || workflowType === 'dress' || workflowType === 'set') && shoulderType !== 'none' ? shoulderType : null,
                        waist: (workflowType === 'lower' || workflowType === 'dress' || workflowType === 'set') && waistType !== 'none' ? waistType : null,
                        rise: (workflowType === 'lower' || workflowType === 'dress' || workflowType === 'set') && riseType !== 'none' ? riseType : null,
                        leg_style: (workflowType === 'lower' || workflowType === 'dress' || workflowType === 'set') && legType !== 'none' ? legType : null,
                        hem_finish: (workflowType === 'lower' || workflowType === 'dress' || workflowType === 'set') && hemType !== 'none' ? hemType : null
                    }
                },

                // LATEST ADDITION: Check if user provided an edited structured prompt (JSON)
                _is_user_edited: false,

                styling: {
                    buttons: buttonsOpen ? "open" : "closed",
                    tucked: tucked,
                    sleeves_rolled: sleevesRolled, // NEW
                    inner_wear: uploadedImages.inner_wear ? {
                        visible: true,
                        description: innerWearDescription
                    } : null,
                    layers: {
                        jacket: uploadedImages.jacket ? {
                            visible: true,
                            description: null // Add jacket analysis if needed later
                        } : null,
                        dress: !!uploadedImages.dress_front,
                        upper_garment: uploadedImages.top_front ? {
                            visible: true,
                            description: upperGarmentDescription
                        } : null,
                        bottom_garment: uploadedImages.bottom_front ? {
                            visible: true,
                            description: lowerGarmentDescription
                        } : null,
                    },
                    socks: socksType
                },

                accessories: {
                    shoes: null, // Will be set after framing is determined
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
                    lighting: lightingPositive || "soft_fashion_lighting"
                },

                // Removed duplicate pose block
            };

            // === JSON OVERRIDE CHECK ===
            // If the user provided an edited prompt that is actually valid JSON, 
            // merge it or replace the structured prompt entirely.
            if (editedPrompt && (editedPrompt.trim().startsWith('{') || editedPrompt.trim().startsWith('['))) {
                try {
                    const parsed = JSON.parse(editedPrompt);
                    // If it's the structured prompt format, merge it
                    if (parsed.intent || parsed.subject || parsed.garment) {
                        Object.assign(structuredPrompt, parsed);
                        structuredPrompt._is_user_edited = true;
                        console.log("Using USER-EDITED JSON structured prompt");
                    }
                } catch (e) {
                    // Not valid JSON or not our format, treat as plain text later
                }
            }

            // Only run baseline enrichment if NO user JSON was provided
            if (!structuredPrompt._is_user_edited) {
                // === ENRICH WITH ANALYSIS DATA ===
                // ... (existing enrichment logic) ...
            }


            // === SMART PRODUCT NAME OVERRIDE ===
            // If user typed specific keywords in product name, override the analysis
            let currentProductDesc = productDescription; // Use local variable

            if (!structuredPrompt._is_user_edited) {
                const nameLower = productName.toLowerCase();
                let descLower = currentProductDesc ? currentProductDesc.toLowerCase() : "";

                // 1. DENIM / JEANS Override
                if (nameLower.includes('denim') || nameLower.includes('jeans')) {
                    if (descLower.includes('twill') || descLower.includes('canvas')) {
                        // Force denim
                        currentProductDesc = currentProductDesc.replace(/twill/gi, "denim").replace(/canvas/gi, "denim");
                        // Add 'denim' if missing
                        if (!currentProductDesc.toLowerCase().includes('denim')) {
                            currentProductDesc = "Denim/Jean fabric. " + currentProductDesc;
                        }
                    }
                }

            }


            // Fabric/Texture from productDescription
            if (!structuredPrompt._is_user_edited) {
                if (currentProductDesc) {
                    const shouldFilter = workflowType === 'upper' && isBackView;
                    let fabricInfo = shouldFilter ? cleanProductDescription(currentProductDesc, true) : currentProductDesc;
                    if (fabricInfo.includes("undefined") || fabricInfo.includes("null")) {
                        fabricInfo = fabricInfo.replace(/Texture:\s*undefined\.?/gi, "").replace(/Pattern:\s*undefined\.?/gi, "").replace(/undefined/gi, "");
                    }
                    if (fabricInfo.trim().length > 5) {
                        structuredPrompt.garment.fabric = fabricInfo.trim();
                    }
                }

                // Also clean product name if it's too specific about front (Only for Upper)
                if (structuredPrompt.garment.name) {
                    const shouldFilter = workflowType === 'upper' && isBackView;
                    structuredPrompt.garment.name = shouldFilter ? cleanProductDescription(structuredPrompt.garment.name, true) : structuredPrompt.garment.name;
                }

                if (fitDescription && workflowType === 'lower') {
                    structuredPrompt.garment.fit = fitDescription;
                }
            }

            // === VIEW-SPECIFIC ADJUSTMENTS ===

            if (view === 'styling' || isStylingShot) {
                // Artistic mode
                structuredPrompt.pose.dynamic = true;
                if (poseStickman) {
                    structuredPrompt.pose.reference = "use stickman reference";
                }

                // Framing for Styling
                if (poseFocus === 'upper' && shotIndex === 1) {
                    structuredPrompt.camera.shot_type = 'cowboy_shot';
                    structuredPrompt.camera.framing = 'cowboy_shot';
                } else {
                    structuredPrompt.camera.shot_type = 'full_body';
                    structuredPrompt.camera.framing = 'head_to_toe';
                }
            } else {
                // Technical angles (front, side, back)
                structuredPrompt.camera.angle = view as string;
                structuredPrompt.pose.dynamic = false;

                // Only provide technical reference if no specific pose description is provided
                if (!poseDescription) {
                    structuredPrompt.pose.reference = (view as string) === 'front' ? "standing straight, arms at sides" :
                        (view as string) === 'side' ? "profile view, natural stance" :
                            "back view, straight posture";
                }

                if (poseStickman) {
                    structuredPrompt.pose.reference = "use stickman reference";
                }

                // Framing Logic for Technical Angles
                if (poseFocus === 'closeup') {
                    // CLOSEUP: Face to chest framing
                    structuredPrompt.camera.shot_type = 'close_up';
                    structuredPrompt.camera.framing = 'chest_and_face';
                } else if (poseFocus === 'full') {
                    structuredPrompt.camera.shot_type = 'full_body';
                    structuredPrompt.camera.framing = 'head_to_toe';
                } else if (poseFocus === 'upper') {
                    structuredPrompt.camera.shot_type = 'cowboy_shot';
                    structuredPrompt.camera.framing = 'cowboy_shot';
                } else {
                    // Default for 'full' and 'lower'
                    structuredPrompt.camera.shot_type = 'full_body';
                    structuredPrompt.camera.framing = 'head_to_toe';
                }
            }

            // === FINAL SHOE DETERMINATION (BASED ON FRAMING) ===
            if (structuredPrompt.camera.framing === 'head_to_toe') {
                structuredPrompt.accessories.shoes = {
                    style: shoesDescription || (uploadedImages.shoes ? "Footwear matching the provided reference image exactly in style and color" : "slim low-profile sneakers"),
                    size: "SMALL, thin, minimal, proportional to body - NOT chunky, NOT oversized"
                };
            } else {
                structuredPrompt.accessories.shoes = null;
            }

            // === DETAIL SHOT OVERRIDE (applies to any view) ===
            if (poseFocus === 'detail') {
                structuredPrompt.camera.shot_type = 'close_up';
                structuredPrompt.camera.framing = 'waist_to_above_knees';
                structuredPrompt.accessories.shoes = null;

                // Remove hair info for detail shots
                delete structuredPrompt.subject.hair_behind_shoulders;
                delete structuredPrompt.subject.look_at_camera;

                // Ensure upper garment is visible for lower body detail shots
                if (workflowType === 'lower' && !structuredPrompt.styling.layers.upper_garment) {
                    structuredPrompt.styling.layers.upper_garment = {
                        visible: true,
                        description: "a fitted professional top"
                    };
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
            if (!tucked && (workflowType === 'upper' || workflowType === 'set')) {
                negativePrompt += ", " + NEGATIVE_PROMPTS.tucked;
            } else if (tucked) {
                negativePrompt += ", " + NEGATIVE_PROMPTS.untucked;
            }

            // Styling shots should NOT be static
            if (isStylingShot || view === 'styling') {
                negativePrompt += ", stiff pose, mannequin pose, robotic stance, arms at sides, boring pose, static posture, cross-eyed, crossed eyes";
            }

            // ALWAYS add flatFabric negative prompt to enforce textured fabric
            negativePrompt += ", " + NEGATIVE_PROMPTS.flatFabric;
            negativePrompt += ", " + NEGATIVE_PROMPTS.equipment;

            if (workflowType !== 'upper') {
                negativePrompt += ", " + NEGATIVE_PROMPTS.cropping;
            }

            // Prevent hallucinated logos on back view if not explicitly requested
            if (view.includes('back') || structuredPrompt.camera.angle === 'back') {
                negativePrompt += ", " + NEGATIVE_PROMPTS.distorted_logo;
            }

            if (structuredPrompt.subject.wind) {
                negativePrompt += ", " + NEGATIVE_PROMPTS.wind;
            }

            if (effectiveRole === 'technical') {
                negativePrompt += ", " + NEGATIVE_PROMPTS.technicalDistortions;
            }

            // Add custom prompt OR use user-edited full prompt
            let finalPrompt = textPrompt;
            if (editedPrompt && !structuredPrompt._is_user_edited) {
                finalPrompt = editedPrompt;
            } else if (customPrompt) {
                finalPrompt += ` ${customPrompt}`;
            }


            // === ASSET FILTERING ===
            const activeAssets = buildAssetList(view, uploadedImages, poseFocus, workflowType);

            return {
                prompt: finalPrompt,
                negative_prompt: negativePrompt + (lightingNegative ? ", " + lightingNegative : ""),
                input_images: activeAssets,
                structured: structuredPrompt
            };
        };

        // === TEXT PROMPT CONVERTER ===
        function convertStructuredToText(sp: any, view: string, wf: string): string {
            const clean = (str: string) => str?.trim().replace(/\n{2,}/g, "\n").replace(/\s{3,}/g, " ").replace(/\.+$/, "") || "";
            const isBackView = view.includes('back') || sp.camera.angle === 'back' || sp.pose.description?.toLowerCase().includes('back to camera');
            const framing = sp.camera.framing;

            // === PROMPT CONSTRUCTION BASES ===
            const sections: string[] = [];

            // Visibility Flags based strictly on Mapping
            const canShowFootwear = framing === 'head_to_toe';
            const canShowLegHem = framing === 'head_to_toe';
            const canShowStance = framing === 'head_to_toe';
            const canShowWaistRiseFitTuck = ['cowboy_shot', 'head_to_toe', 'waist_to_above_knees'].includes(framing);
            const canShowCollarHairButtons = ['chest_and_face', 'cowboy_shot', 'head_to_toe'].includes(framing);
            const canShowFaceDetails = framing === 'chest_and_face';

            // === BLOCK: FRAMING DESCRIPTION ===
            const framingBlock: string[] = [];
            framingBlock.push(`[FRAMING_DESCRIPTION]`);
            if (framing === 'head_to_toe') {
                framingBlock.push("Shot Type: Head-to-toe full body photography.");
                framingBlock.push("Visible: Full model from head to feet.");
                framingBlock.push("Enabled Details: Leg silhouette, hem finish, footwear, and full body stance.");
                framingBlock.push("Constraint: Exclude close-up facial micro-expressions.");
            } else if (framing === 'cowboy_shot') {
                framingBlock.push("Shot Type: Cowboy shot (Medium shot).");
                framingBlock.push("Visible: Head to mid-thigh area.");
                framingBlock.push("Enabled Details: Garment fall, drape, and hemline over the pants.");
                framingBlock.push("Constraint: Exclude lower legs and footwear.");
            } else if (framing === 'chest_and_face') {
                framingBlock.push("Shot Type: Close-up beauty/fashion portrait.");
                framingBlock.push("Visible: Head, shoulders, and upper chest.");
                framingBlock.push("Enabled Details: Collar type, buttons, hair texture, gaze, and facial expression.");
                framingBlock.push("Constraint: Exclude waist, legs, and footwear.");
            } else if (framing === 'waist_to_above_knees') {
                framingBlock.push("Shot Type: Detail-oriented proximity shot.");
                framingBlock.push("Visible: Waist to just above the knees.");
                framingBlock.push("Enabled Details: Pocket details, waist fit, and fabric texture.");
                framingBlock.push("Constraint: Exclude face, upper chest, and feet.");
            }
            framingBlock.push(`[/FRAMING_DESCRIPTION]`);
            sections.push(framingBlock.join("\n"));

            // === PRIORITY 1: SUBJECT IDENTITY & PROPORTIONS ===
            // Moved to absolute top to ensure the AI locks onto the provided model identity immediately
            const subjectBlock: string[] = [];
            subjectBlock.push(`[SUBJECT_IDENTITY]`);
            if (sp.subject.identity === "match_provided_model_image") {
                subjectBlock.push(`Identity: MANDATORY - Match the provided model reference image exactly. Portrait and body features must be identical to the source model.`);
            } else {
                subjectBlock.push(`Identity: ${sp.subject.identity}.`);
            }

            if (sp.subject.body_description) {
                subjectBlock.push(`Physical Proportions & Body Description: ${clean(sp.subject.body_description)}`);
            } else {
                // Professional Default Measurements for E-Com consistency
                if (sp.subject.type === 'male_model') {
                    subjectBlock.push(`Physical Proportions & Body Description: Height 187 cm, Waist 79 cm (W32), Chest 97 cm (Size L / 50), Hips 97 cm, Inseam L34-L36. Lean and athletic build with long leg proportions.`);
                } else if (sp.subject.type === 'female_model') {
                    subjectBlock.push(`Physical Proportions & Body Description: Height 178 cm, Waist 62 cm (Size S / 36), Chest 86 cm, Hips 90 cm. Long legs with a slender, high-fashion slim build.`);
                }
            }
            subjectBlock.push(`[/SUBJECT_IDENTITY]`);
            sections.push(subjectBlock.join("\n"));

            // === PRIORITY 2: PRODUCT & UI TOGGLES ===
            const productBlock: string[] = [];
            productBlock.push(`[LOCKED_PRODUCT_CONSTRAINTS]`);
            productBlock.push(`Main Garment: ${clean(sp.garment.name)}.`);
            if (sp.garment.fabric) productBlock.push(`Fabric & Texture: ${clean(sp.garment.fabric)}.`);
            if (sp.garment.fit) productBlock.push(`Construction & Fit: ${clean(sp.garment.fit)}.`);

            // Detail checks using Visibility Rules
            if (canShowCollarHairButtons) {
                if (sp.garment.details?.collar) productBlock.push(`Collar: ${sp.garment.details.collar}.`);
                if (sp.garment.details?.shoulder) productBlock.push(`Shoulder: ${sp.garment.details.shoulder}.`);
            }
            if (canShowWaistRiseFitTuck) {
                if (sp.garment.details?.waist) productBlock.push(`Waist: ${sp.garment.details.waist}.`);
                if (sp.garment.details?.rise) productBlock.push(`Rise: ${sp.garment.details.rise}.`);
                if (sp.styling.tucked) {
                    productBlock.push("Style Adjustment: Tucked in, garment is tucked into the waistband, waistband is visible.");
                } else if (wf === 'upper' || wf === 'set') {
                    productBlock.push("Style Adjustment: MANDATORY - Untucked. The hem of the garment MUST hang loose OVER the pants, completely covering the waistband and belt area. The hem is fully visible and NOT tucked in.");
                }
            }
            if (canShowLegHem) {
                if (sp.garment.details?.leg_style) productBlock.push(`Leg Style: ${sp.garment.details.leg_style}.`);
                if (sp.garment.details?.hem_finish) productBlock.push(`Hem Finish: ${sp.garment.details.hem_finish}.`);
            }

            if (sp.styling.buttons === 'open' && canShowCollarHairButtons) {
                productBlock.push("Style Adjustment: Front is open and unbuttoned.");
            }

            productBlock.push(`Garment type, fabric, construction, fit and details are FINAL. The model's pose must complement these features while maintaining natural fashion movement.`);
            productBlock.push(`[/LOCKED_PRODUCT_CONSTRAINTS]`);
            sections.push(productBlock.join("\n"));

            // === PRIORITY 3: POSE GEOMETRY ===
            let subjectInfo = `POSE: Professional ${sp.subject.type} (Strictly match provided identity)`;
            if (isBackView) subjectInfo += " seen from BACK.";
            else if (sp.camera.angle === 'side' || sp.camera.angle === 'angled' || view.includes('angled')) subjectInfo += " in 3/4 ANGLED view.";
            else subjectInfo += " in FRONT view.";

            if (sp.pose.description) {
                let bio = clean(sp.pose.description);
                if (sp.pose.dynamic) {
                    bio = bio.replace(/arms (hang|stay|placed) (naturally )?at sides/gi, "arms in dynamic fashion placement");
                }
                subjectInfo += ` ${bio}.`;
            }
            if (sp.pose.reference && sp.pose.reference.includes("stickman")) {
                subjectInfo += " ControlNet: Strictly follow the provided stickman geometry.";
            }
            sections.push(subjectInfo);

            // === PRIORITY 4: STYLING & ENVIRONMENT ===
            const environmental: string[] = [];
            const stylingItems: string[] = [];

            // Atmosphere / Lighting
            if (lightingPositive) environmental.push(`Lighting: ${clean(lightingPositive)}.`);
            else if (sp.scene.lighting) environmental.push(`Lighting: ${clean(sp.scene.lighting)}.`);

            // Layering (Secondary Priority)
            if (sp.styling.layers.jacket?.visible && canShowCollarHairButtons) {
                const jacketDesc = clean(sp.styling.layers.jacket.description);
                stylingItems.push(`wearing a jacket over the main garment${jacketDesc ? ` (${jacketDesc})` : ""}`);
            }

            if (sp.styling.layers.upper_garment?.visible && wf === 'lower' && (canShowCollarHairButtons || canShowWaistRiseFitTuck)) {
                if (uploadedImages.top_front) {
                    stylingItems.push("wearing the provided top garment reference image");
                } else {
                    const upperDesc = clean(sp.styling.layers.upper_garment.description);
                    stylingItems.push(`wearing a ${upperDesc || 'top garment'} tucked in or as a layer`);
                }
            }

            if (sp.styling.layers.bottom_garment?.visible && wf === 'upper' && canShowWaistRiseFitTuck) {
                if (uploadedImages.bottom_front) {
                    stylingItems.push("wearing the provided bottom garment reference image");
                } else {
                    const bottomDesc = clean(sp.styling.layers.bottom_garment.description);
                    stylingItems.push(`paired with ${bottomDesc || 'bottom garment'}`);
                }
            }

            if (sp.styling.inner_wear?.visible && canShowCollarHairButtons) {
                const innerDesc = clean(sp.styling.inner_wear.description);
                stylingItems.push(`base layer${innerDesc ? ` (${innerDesc})` : ""} is visible`);
            }

            // Sleeves Logic
            if (wf === 'upper' || wf === 'set' || wf === 'dress' || uploadedImages.top_front || uploadedImages.jacket) {
                if (sp.styling.sleeves_rolled) {
                    stylingItems.push("sleeves are rolled up to the elbows");
                } else {
                    stylingItems.push("sleeves are straight down to the wrists");
                }
            }


            if (stylingItems.length > 0) {
                sections.push("Styling Strategy: " + stylingItems.join(", ") + ".");
            }

            // 5. Accessories & Extras
            const extras: string[] = [];
            if (canShowFootwear && sp.accessories.shoes) {
                let style = clean(sp.accessories.shoes.style);
                style = style.replace(/sneakers?/gi, "shoes");
                const size = clean(sp.accessories.shoes.size);

                if (uploadedImages.shoes) {
                    extras.push(`Footwear: **MANDATORY - MUST MATCH PROVIDED SHOE IMAGE EXACTLY** in color, texture, and silhouette. ${style}${size ? ` (${size})` : ""}`);
                } else {
                    extras.push(`Footwear: ${style}${size ? ` (${size})` : ""}`);
                }
            }

            if (canShowLegHem) {
                if (sp.styling.socks && sp.styling.socks !== 'none') extras.push(`wearing ${sp.styling.socks} socks`);
            }

            if (canShowCollarHairButtons) {
                if (sp.accessories?.glasses) extras.push("Wearing the provided sunglasses");
                if (sp.accessories?.hat) extras.push("Wearing the provided hat");
                if (sp.accessories?.bag) extras.push("Wearing the provided bag");
            }

            if (canShowWaistRiseFitTuck) {
                if (sp.accessories?.belt) extras.push("Wearing the provided belt");
            }

            if (extras.length > 0) sections.push(extras.join(", ") + ".");

            // 6. Background
            sections.push("Background: Use the provided reference background images to match environment perfectly.");

            // 7. Hair & Face (Visibility controlled)
            let hairFace = "";

            if (canShowCollarHairButtons || canShowFaceDetails) {
                if (isBackView) {
                    hairFace = "Model is looking away from the camera.";
                } else if (sp.subject.look_at_camera === true) {
                    hairFace = "Model is making direct eye contact with the camera.";
                } else if (sp.subject.look_at_camera === false) {
                    hairFace = "Model is looking slightly away from the camera, avoiding direct eye contact.";
                }

                if (sp.subject.type !== 'male_model') {
                    if (sp.subject.hair_behind_shoulders === true) {
                        hairFace += " Hair is neatly placed BEHIND the shoulders.";
                    } else {
                        hairFace += " Hair: Natural and well-groomed.";
                    }
                }
                if (sp.subject.wind) hairFace += " Dynamic studio airflow/wind effect is visible, hair and fabric suggest movement.";
            }

            // 8. Expressions & Gaze (Strict Role & Index Rules)
            const isTechnicalForGaze = effectiveRole === 'technical' || isBackView || view.includes('side') || view.includes('detail') || framing === 'chest_and_face' || framing === 'waist_to_above_knees';
            const isTechnicalForExpression = isTechnicalForGaze || view.includes('angled') || sp.camera.angle === 'angled';

            // Expression: enabled ONLY for FIRST styling shot AND not technical
            const canHaveExpression = effectiveRole === 'styling' && shotIndex === 1 && !isTechnicalForExpression && enableExpression;

            // Gaze: enabled for FIRST and SECOND styling shots AND not technical (Gaze allowed on Angled)
            const canHaveGaze = effectiveRole === 'styling' && (shotIndex === 1 || shotIndex === 2) && !isTechnicalForGaze && enableGaze;

            if (canHaveExpression) {
                const randomExpression = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)];
                sections.push(`Facial Expression: ${randomExpression}`);
            }
            if (canHaveGaze) {
                const randomGaze = GAZES[Math.floor(Math.random() * GAZES.length)];
                sections.push(`Gaze Direction: ${randomGaze}`);
            }

            if (hairFace) sections.push(hairFace);
            if (environmental.length > 0) sections.push(environmental.join(" "));

            return sections.map(s => s.trim()).filter(Boolean).join(" ");
        }

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
                enable_web_search: enableWebSearch,
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
                const reqData = buildStructuredPrompt(targetView || 'styling');
                return NextResponse.json({
                    status: "preview",
                    previews: [{
                        title: targetView ? `${targetView.charAt(0).toUpperCase() + targetView.slice(1)} View` : "Styling Shot",
                        prompt: reqData.prompt,
                        structured: reqData.structured,
                        assets: reqData.input_images,
                        settings: { resolution, aspect_ratio: aspectRatio }
                    }]
                });
            }
        }

        // === EXECUTION ===
        let results: { url: string, prompt: string }[] = [];

        if (isAngles) {
            if (targetView) {
                // SINGLE VIEW MODE
                const url = await generateOne(targetView as any);
                if (url) results.push({ url, prompt: "3-Angle View" });
            } else {
                // ALL 3 VIEWS
                const [frontUrl, sideUrl, backUrl] = await Promise.all([
                    generateOne('front'),
                    generateOne('side'),
                    generateOne('back')
                ]);
                if (frontUrl) results.push({ url: frontUrl, prompt: "Front View" });
                if (sideUrl) results.push({ url: sideUrl, prompt: "Side View" });
                if (backUrl) results.push({ url: backUrl, prompt: "Back View" });
            }
        } else {
            // Styling View
            const viewType = targetView || 'styling';
            const reqData = buildStructuredPrompt(viewType as any);
            const finalPrompt = reqData.prompt;
            const url = await generateOne(viewType as any);
            if (url) results.push({ url, prompt: finalPrompt });
        }

        return NextResponse.json({
            status: "completed",
            images: results.map(r => r.url),
            prompts: results.map(r => r.prompt)
        });

    } catch (error: any) {
        console.error("Generation error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
