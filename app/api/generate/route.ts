import { NextRequest, NextResponse } from "next/server";
import { ensureS3Url } from "@/lib/s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// Configure route config
export const maxDuration = 300; // 300 seconds max duration (5 minutes)
export const dynamic = 'force-dynamic';

// Negative prompts for common issues
const NEGATIVE_PROMPTS = {
    shoes: "oversized shoes, chunky shoes, large footwear, clown shoes, big shoes, thick soles, platform shoes, bulky sneakers, exaggerated footwear, disproportionate shoes, cartoon shoes, huge feet, giant shoes, massive sneakers, wide shoes, puffy shoes, oversized feet, unrealistic shoe size, shoes too big for body, exaggerated shoe proportions",
    buttons: "open shirt, unbuttoned, open front, chest visible",
    tucked: "untucked shirt, loose hem, shirt over pants, hidden waistband, long shirt hanging out, shirt outside pants, partial tuck, half tuck, french tuck, shirt over waistband, any hem below waistband",
    untucked: "tucked in shirt, shirt inside pants, waistband visible, partial tuck, half tuck, french tuck, fabric entering waistband, shirt in waistband, any part of shirt inside pants, exposed pants button",
    flatFabric: "flat fabric, smooth texture, plain surface, digital print look, no texture, solid color fabric, printed stripes, screen print, no weave visible, uniform surface, plastic looking fabric",
    cropping: "cropped head, cut off head, missing head, partial face, close up, zoomed in, out of frame, cropped feet, missing shoes",
    wind: "strong wind hair, messy hair, disheveled hair, chaotic strands",
    equipment: "studio lighting equipment, softbox, flash, umbrella, reflector, camera tripod, photography gear, studio lamps, light stand, visible equipment",
    distorted_logo: "text, logo, branding, writing, watermark, signature, letters, words, print on back, brand name, typography",
    technicalDistortions: "bent body, rotated torso, angled stance, curved spine, wrinkled garment, folded hem, curled hemline, uneven hem, wavy fabric at bottom, diagonal hemline, distorted silhouette"
};

interface MoodPreset {
    id: string;
    promptAddition: string;
    negativePromptAddition: string;
}

const MOOD_PRESETS: Record<string, MoodPreset> = {
    natural: {
        id: 'natural',
        promptAddition: 'captured in a candid moment between takes, natural resting expression with quiet confidence, eyes alive and present, as if the photographer caught a real unguarded moment, shot on 35mm film',
        negativePromptAddition: 'stiff expression, dead eyes, blank stare, mannequin-like, forced smile, robotic gaze, vacant look, overly posed, plastic skin, doll-like, uncanny valley, wax figure',
    },
    warm: {
        id: 'warm',
        promptAddition: 'as if just noticed someone familiar across the room, genuine subtle warmth in expression, approachable and relaxed energy, the ease of a real person who happens to be beautiful, natural soft expression',
        negativePromptAddition: 'toothy grin, exaggerated smile, stiff, dead eyes, mannequin-like, forced happiness, plastic skin, doll-like, uncanny valley, overly enthusiastic, fake smile',
    },
    powerful: {
        id: 'powerful',
        promptAddition: 'editorial confidence, powerful self-assured gaze commanding the frame, the magnetic intensity of a supermodel mid-editorial shoot for Vogue, owning the space with effortless authority',
        negativePromptAddition: 'aggressive, angry, stiff, dead eyes, blank stare, mannequin-like, timid, uncertain, vacant, robotic, forced intensity, over-dramatic',
    },
    relaxed: {
        id: 'relaxed',
        promptAddition: 'off-duty model moment, effortlessly cool and casual, the ease of someone completely comfortable in their own skin, caught mid-thought in a beautiful way, unstudied natural beauty',
        negativePromptAddition: 'stiff, posed, dead eyes, mannequin-like, forced expression, rigid posture, robotic, uncanny valley, overly styled, trying too hard',
    },
    professional: {
        id: 'professional',
        promptAddition: 'professional e-commerce model pose, calm neutral expression with natural life in the eyes, the quiet confidence of a professional catalog model, present and engaged, clean commercial photography',
        negativePromptAddition: 'dead eyes, blank stare, mannequin-like, robotic, stiff, vacant, doll-like, uncanny valley, wax figure, lifeless, zombie-like, glazed over eyes',
    },
    subtle: {
        id: 'subtle',
        promptAddition: 'natural relaxed demeanor, subtle calm presence, composed and at ease',
        negativePromptAddition: 'dead eyes, stiff, mannequin-like, robotic, forced, blank stare, uncanny valley',
    },
};

type FaceProminence = 'full' | 'partial' | 'none';
type ShotType = 'styling' | 'technical';

const ANGLE_METADATA: Record<string, { shotType: ShotType; faceProminence: FaceProminence }> = {
    // Styling
    'styling_front': { shotType: 'styling', faceProminence: 'full' },
    'styling_angled': { shotType: 'styling', faceProminence: 'full' },
    'std_styling_full': { shotType: 'styling', faceProminence: 'full' },
    'std_styling_upper': { shotType: 'styling', faceProminence: 'full' },

    // Technical, full face
    'technical_front': { shotType: 'technical', faceProminence: 'full' },
    'std_tech_full_front': { shotType: 'technical', faceProminence: 'full' },
    'std_tech_upper_front': { shotType: 'technical', faceProminence: 'full' },

    // Technical, partial face
    'std_closeup_front': { shotType: 'technical', faceProminence: 'partial' },

    // Technical, no face
    'technical_back': { shotType: 'technical', faceProminence: 'none' },
    'detail_front': { shotType: 'technical', faceProminence: 'none' },
    'detail_back': { shotType: 'technical', faceProminence: 'none' },
    'std_tech_full_back': { shotType: 'technical', faceProminence: 'none' },
    'std_tech_upper_back': { shotType: 'technical', faceProminence: 'none' },
    'std_detail_front': { shotType: 'technical', faceProminence: 'none' },
    'std_detail_back': { shotType: 'technical', faceProminence: 'none' },
};

function resolveMood(angleId: string | null | undefined, userMoodId?: string, shotRole?: 'styling' | 'technical' | null): MoodPreset | null {
    if (angleId) {
        const angleMeta = ANGLE_METADATA[angleId];
        if (angleMeta) {
            if (angleMeta.faceProminence === 'none') return null;

            if (angleMeta.shotType === 'technical') {
                return angleMeta.faceProminence === 'partial' ? MOOD_PRESETS['subtle'] : MOOD_PRESETS['professional'];
            }

            if (angleMeta.shotType === 'styling') {
                const moodKey = userMoodId && MOOD_PRESETS[userMoodId] ? userMoodId : 'natural';
                return MOOD_PRESETS[moodKey];
            }
        }
    }

    // Fallback for single generations where angleId might be missing or generic
    if (shotRole === 'styling') {
        const moodKey = userMoodId && MOOD_PRESETS[userMoodId] ? userMoodId : 'natural';
        return MOOD_PRESETS[moodKey];
    } else if (shotRole === 'technical') {
        // Assume front technical shot by default for fallback unless angleId explicitly says back
        if (angleId && (angleId.includes('back') || angleId.includes('detail'))) return null;
        return MOOD_PRESETS['professional'];
    }

    return null;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        let {
            productName,
            workflowType: requestedWorkflowType,
            uploadedImages: rawUploadedImages,
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
            socksType = 'none', // 'none' | 'white' | 'black' | 'grey' | 'navy'
            enableWind = false, // NEW: Subtle airflow toggle
            isStylingShot = true, // NEW: Flag to identify styling
            lightingPositive = null, // NEW
            lightingNegative = null, // NEW
            seed = null, // NEW
            enableWebSearch = false, // NEW
            selectedMoodId = 'natural', // NEW: Mood Selector
            shotIndex = 1, // NEW: 1-indexed shot order in batch
            shotRole = null, // NEW: 'styling' (hero) or 'technical' (angles/detail)
            angleId = null, // NEW: ID of the angle/shot being generated
            collarType = 'none',
            shoulderType = 'none',
            waistType = 'none',
            riseType = 'none',
            legType = 'none',
            hemType = 'none',
            pantLength = 'none',
            techAccessories = {},
            techAccessoryDescriptions = {},
            sleevesRolled = false,
            excludeBeltAsset = false,
            excludeHatAsset = false,
            excludeShoesAsset = false,
            modelDescription = null // NEW
        } = body;

        // Credit Deduction Logic
        if (!preview) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { id: true, credits: true, role: true }
            });
            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

            if (user.role !== 'admin') {
                const singleCost = resolution === "4K" ? 100 : 50;
                const isMultiAngle = isAngles && !targetView;
                const totalCost = isMultiAngle ? singleCost * 3 : singleCost;

                if ((user.credits || 0) < totalCost) {
                    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
                }
                await deductCredits(user.id, totalCost, `Photoshoot Generation (${isMultiAngle ? '3-Angles' : 'Single Shot'})`);
            }
        }

        // One-time random seed for consistency across angles
        const requestSeed = (seed !== null && seed !== undefined) ? Number(seed) : Math.floor(Math.random() * 1000000000);

        // Ensure poseStickman is an R2 URL
        // Ensure poseStickman is an R2 URL
        let uploadedImages = rawUploadedImages || {};

        if (!preview) {
            if (poseStickman) {
                let { ensureR2Url } = await import("@/lib/s3");
                poseStickman = await ensureR2Url(poseStickman, "poses");
            }

            // === R2 INPUT SANITIZATION ===
            let { ensureR2Url: ensureS3R2 } = await import("@/lib/s3");
            const sanitizedData = await Promise.all(
                Object.entries(rawUploadedImages || {}).map(async ([key, value]) => {
                    if (typeof value === 'string' && value) {
                        return [key, await ensureS3R2(value, "inputs")];
                    }
                    return [key, value];
                })
            );
            uploadedImages = Object.fromEntries(sanitizedData);
        }

        // Determine derived shot role if not explicitly provided
        // Check if angleId is a technical angle (starts with std_tech_)
        const isTechnicalAngle = angleId && angleId.startsWith('std_tech_');
        const effectiveRole = shotRole || ((isStylingShot && !isAngles && poseFocus !== 'detail' && poseFocus !== 'closeup' && !isTechnicalAngle) ? 'styling' : 'technical');

        // === SAFETY: Ensure raw 'pose' image is NEVER included in input_images ===
        // We only use 'poseStickman' for pose control later.
        if (uploadedImages && uploadedImages.pose) {
            delete uploadedImages.pose;
        }

        // 1. Determine Workflow Type
        const lowerName = (productName || "").toLowerCase();
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
            const isSide = view === 'side' || view.includes('side') || view.includes('angled') || view.includes('threequarter');

            if (isFront || isSide) {
                if (imgs.main_product) assets.push(imgs.main_product);
                if (imgs.top_front) assets.push(imgs.top_front);
                if (imgs.dress_front) assets.push(imgs.dress_front);
                if (imgs.inner_wear && buttonsOpen) assets.push(imgs.inner_wear);
                if (imgs.bottom_front && focus !== 'closeup') assets.push(imgs.bottom_front);
                if (imgs.jacket) assets.push(imgs.jacket);
                if (imgs.belt && !excludeBeltAsset && focus !== 'closeup') assets.push(imgs.belt);
                if (imgs.bag && focus !== 'closeup') assets.push(imgs.bag);
                if (imgs.jewelry) assets.push(imgs.jewelry);
                if (imgs.glasses) assets.push(imgs.glasses);
                if (imgs.hat && !excludeHatAsset) assets.push(imgs.hat);
                assets.push(...frontDetails);
            }

            if (isBack || isSide) {
                if (imgs.top_back) assets.push(imgs.top_back);
                if (imgs.bottom_back) assets.push(imgs.bottom_back);
                if (imgs.jacket) assets.push(imgs.jacket);
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
            if (imgs.belt && !excludeBeltAsset && focus !== 'closeup') assets.push(imgs.belt);
            if (imgs.hat && !excludeHatAsset && focus !== 'closeup') assets.push(imgs.hat);
            if (imgs.bag && focus !== 'closeup') assets.push(imgs.bag);
            if (imgs.glasses) assets.push(imgs.glasses);
            if (imgs.jewelry) assets.push(imgs.jewelry);
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
                    if (imgs.jewelry) assets.push(imgs.jewelry);
                    if (imgs.glasses) assets.push(imgs.glasses);
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
                    if (imgs.jewelry) assets.push(imgs.jewelry);
                    if (imgs.glasses) assets.push(imgs.glasses);
                    assets.push(...frontDetails);
                    assets.push(...backDetails);
                }
            }

            return assets.filter(a => a && a.startsWith("http"));
        };

        // 2. Build Structured Prompt JSON for each view
        const buildStructuredPrompt = (view: 'styling' | 'front' | 'side' | 'back'): { prompt: string, structured: any, input_images: any, negative_prompt: string } => {
            const isBackView = view.includes('back') || (targetView === 'back' && view === 'back') || (activeDetailView === 'back' && view === 'back');

            // Determine if this specific execution is a styling shot
            const isActiveStyling = effectiveRole === 'styling';

            // === STRUCTURED PROMPT OBJECT ===
            const structuredPrompt: any = {
                intent: "Fashion e-commerce photography",

                subject: {
                    type: gender === 'male' ? 'male_model' : gender === 'female' ? 'female_model' : 'model',
                    identity: uploadedImages.model ? "match_provided_model_image" : "generic_fashion_model",
                    hair_behind_shoulders: hairBehindShoulders ?? true, // Explicit boolean
                    look_at_camera: lookAtCamera ?? true, // NEW: Explicit boolean
                    body_description: modelDescription || null, // NEW: Custom physical traits
                    wind: isActiveStyling && enableWind
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
                    tucked: tucked ? 'tucked' : 'untucked',
                    sleeves_rolled: sleevesRolled, // NEW
                    "inner_wear": uploadedImages.inner_wear ? {
                        visible: true,
                        description: innerWearDescription || "a clean minimalist inner layer garment"
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
                    reference: null,
                    description: isActiveStyling ? poseDescription : null, // STYLING ONLY
                    dynamic: isActiveStyling
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
                // NEW: Analysis block for detailed descriptions
                analysis: {
                    "fabric": {
                        "main": "Primary material name",
                        "composition": "Percentage breakdown",
                        "weight": "GSM or oz",
                        "finish": "Fabric treatment"
                    },
                    "innerBrief": innerWearDescription || "Detailed visual description of the inner layer",
                    "upperBrief": upperGarmentDescription || "Detailed visual description of the upper garment",
                    "lowerBrief": lowerGarmentDescription || "Detailed visual description of the lower garment",
                    "shoesBrief": shoesDescription || "Detailed visual description of footwear",
                    "measurements": {
                        "chest": "cm", "waist": "cm", "hips": "cm", "inseam": "cm", "height": "cm"
                    }
                }
            };

            // === JSON OVERRIDE CHECK ===
            // If the user provided an edited prompt that is actually valid JSON,
            // merge it or replace the structured prompt entirely.
            if (editedPrompt && (editedPrompt.trim().startsWith('{') || editedPrompt.trim().startsWith('['))) {
                try {
                    const parsed = JSON.parse(editedPrompt);
                    // 1. Structured Prompt Format (Internal)
                    if (parsed.intent || parsed.subject || parsed.garment) {
                        Object.assign(structuredPrompt, parsed);
                        structuredPrompt._is_user_edited = true;
                        console.log("Using USER-EDITED JSON structured prompt");
                    }
                    // 2. Batch Spec Format (Frontend)
                    else if (parsed.productName || parsed.productDescription || parsed.pose) {
                        if (parsed.productName) structuredPrompt.garment.name = parsed.productName;
                        if (parsed.productDescription) structuredPrompt.garment.fabric = parsed.productDescription;
                        if (parsed.fitDescription) structuredPrompt.garment.fit = parsed.fitDescription;
                        if (parsed.view) structuredPrompt.camera.angle = parsed.view.includes('front') ? 'front' : parsed.view.includes('side') ? 'side' : parsed.view.includes('back') ? 'back' : parsed.view;

                        // Handle pose with role-based restrictions
                        if (isActiveStyling) {
                            if (parsed.pose) structuredPrompt.pose.description = parsed.pose;
                        } else {
                            structuredPrompt.pose.description = null;
                        }

                        if (parsed.camera) {
                            if (parsed.camera.shot_type) structuredPrompt.camera.shot_type = parsed.camera.shot_type;
                            if (parsed.camera.framing) structuredPrompt.camera.framing = parsed.camera.framing;
                        }

                        structuredPrompt._is_user_edited = true;
                        console.log("Mapped Frontend Batch JSON to Structured Prompt");
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
                const nameLower = (productName || "").toLowerCase();
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

            if (isActiveStyling) {
                // Artistic mode
                structuredPrompt.pose.dynamic = true;
                if (poseStickman) {
                    structuredPrompt.pose.reference = "use stickman reference";
                }

                // Framing for Styling
                if (poseFocus === 'upper') {
                    structuredPrompt.camera.shot_type = 'cowboy_shot';
                    structuredPrompt.camera.framing = 'cowboy_shot';
                } else if (poseFocus === 'closeup') {
                    structuredPrompt.camera.shot_type = 'close_up';
                    structuredPrompt.camera.framing = 'chest_and_face';
                } else {
                    structuredPrompt.camera.shot_type = 'full_body';
                    structuredPrompt.camera.framing = 'head_to_toe';
                }
            } else {
                // Technical angles (front, side, back)
                structuredPrompt.camera.angle = view as string;
                // Technical shots should NEVER have complex descriptions or stickman influence
                structuredPrompt.pose.dynamic = false;
                structuredPrompt.pose.description = null;

                structuredPrompt.pose.reference = (view as string) === 'front' ? "standing perfectly straight in attention posture, feet touching and strictly parallel facing forward, arms resting straight at sides, neutral gaze" :
                    (view as string) === 'side' ? "strict profile view, standing straight, feet positioned close together and parallel, arms at sides" :
                        (view as string) === 'back' ? "back view, standing perfectly straight, feet touching and parallel, arms at sides" :
                            "standing straight, rigid attention posture, feet together and parallel";

                // Framing Logic for Technical Angles
                if (poseFocus === 'closeup') {
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
            if (isBackView) {
                negativePrompt += ", " + NEGATIVE_PROMPTS.distorted_logo;
                negativePrompt += ", face, eyes, gaze, lips, nose, chest, breast, frontal view, looking at camera, making eye contact";
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

            let combinedNegative = negativePrompt + (lightingNegative ? ", " + lightingNegative : "");

            // Ensure facial symmetry and realism for shots with faces
            if (!view.includes('back') && !view.includes('detail') && structuredPrompt.camera.framing !== 'waist_to_above_knees') {
                const faceRealismNegatives = "symmetrical face, perfectly mirrored features, wax figure, CGI face, 3D render face, AI generated look";
                if (!combinedNegative.includes("symmetrical face")) {
                    combinedNegative += ", " + faceRealismNegatives;
                }
            }

            // === MOOD NEGATIVE INJECTION ===
            const resolvedMood = resolveMood(angleId, selectedMoodId, effectiveRole);
            if (resolvedMood) {
                if (resolvedMood.negativePromptAddition) {
                    combinedNegative += ", " + resolvedMood.negativePromptAddition;
                }
            }

            // === ASSET FILTERING ===
            const activeAssets = buildAssetList(view, uploadedImages, poseFocus, workflowType);

            return {
                prompt: finalPrompt,
                negative_prompt: combinedNegative,
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
            } else if (framing === 'cowboy_shot') {
                framingBlock.push("Shot Type: Cowboy shot (Medium shot).");
                framingBlock.push("Visible: Head to mid-thigh area.");
                framingBlock.push("Enabled Details: Garment fall, drape, and hemline over the pants.");
                framingBlock.push("Constraint: Exclude footwear.");
            } else if (framing === 'chest_and_face') {
                framingBlock.push("Shot Type: Close-up beauty/fashion portrait.");
                framingBlock.push("Visible: Head, shoulders, and upper chest.");
                framingBlock.push("Enabled Details: Collar type, buttons, hair texture, gaze, and facial expression.");
                framingBlock.push("Constraint: Exclude waist, legs, and footwear.");
            } else if (framing === 'waist_to_above_knees') {
                framingBlock.push("Shot Type: Detail-oriented proximity shot. Strictly centered on the lower body.");
                framingBlock.push("Visible: MANDATORY - Strict crop from the natural waistline down to the upper knees ONLY.");
                framingBlock.push("Enabled Details: Pocket details, waistband construction, waist fit, and fabric texture.");
                framingBlock.push("Constraint: ABSOLUTELY EXCLUDE face, shoulders, upper chest, and feet from the frame.");
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

            if (framing !== 'chest_and_face' && framing !== 'close_up') {
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
                // Tucking / Untucked (Highest Priority for fit/silhouette)
                if (sp.styling.tucked === 'tucked') {
                    productBlock.push(`Style Adjustment: Tucked in, waistband is visible.`);
                } else if (sp.styling.tucked === 'untucked') {
                    productBlock.push(`Style Adjustment: MANDATORY - Untucked. The hem of the garment MUST hang loose OVER the pants, completely covering the waistband and belt area. The hem is fully visible and NOT tucked in.`);
                }

                if (wf === 'lower' && sp.styling.layers.upper_garment?.visible) {
                    if (sp.styling.tucked === 'tucked') {
                        productBlock.push(`Style Adjustment: Tucked in, waistband is visible.`);
                    } else if (sp.styling.tucked === 'untucked') {
                        productBlock.push(`Style Adjustment: MANDATORY - Untucked. The hem of the garment MUST hang loose OVER the pants, completely covering the waistband and belt area. The hem is fully visible and NOT tucked in.`);
                    }
                }

                // Length constraints (if any)
                if (wf === 'lower' || wf === 'set') {
                    if (pantLength === 'full') {
                        productBlock.push(`LENGTH CONSTRAINT: Pant legs extend to the floor/heel level, slightly breaking over the shoes. This 'Full Length' style means the hem sits exactly where the shoe meets the floor at the back, with a single minimal fold at the front. MUST conceal any socks.`);
                    } else if (pantLength === 'cropped' || pantLength === 'ankle') {
                        productBlock.push(`LENGTH CONSTRAINT: The pant hem must clear the ankle bone, showing a gap between the hem and the footwear. No stacking or break in the fabric at the ankle.`);
                    }
                }


                if (sp.garment.details?.rise) productBlock.push(`Rise: ${sp.garment.details.rise}.`);
            }
            if (canShowLegHem) {
                if (sp.garment.details?.leg_style) productBlock.push(`Leg Style: ${sp.garment.details.leg_style}.`);
                if (sp.garment.details?.hem_finish) productBlock.push(`Hem Finish: ${sp.garment.details.hem_finish}.`);
            }

            if (sp.styling.buttons === 'open' && canShowCollarHairButtons) {
                productBlock.push("Style Adjustment: Front is open and unbuttoned.");
            }

            productBlock.push(`[/LOCKED_PRODUCT_CONSTRAINTS]`);
            sections.push(productBlock.join("\n"));

            // === ACCESSORIES ===
            const accEntries = Object.entries(techAccessories || {}).filter(([_, v]) => !!v);

            // Helper to translate common Turkish accessory terms to English
            const translateAcc = (text: string, defaultType: string) => {
                if (!text) return `Model is wearing ${defaultType} from the reference image.`;
                const lower = text.toLowerCase();
                let enType = defaultType;
                if (lower.includes('küpe')) enType = 'earrings';
                else if (lower.includes('bileklik')) enType = 'bracelet';
                else if (lower.includes('kolye')) enType = 'necklace';
                else if (lower.includes('yüzük')) enType = 'ring';
                else if (lower.includes('gözlük')) enType = 'glasses';
                else if (lower.includes('şapka')) enType = 'hat';
                else if (lower.includes('çanta')) enType = 'bag';
                else if (lower.includes('kemer')) enType = 'belt';
                else if (lower.includes('ceket')) enType = 'jacket';

                // If it's already in English or custom, use it
                return `Model is wearing ${enType} (${text}) strictly as shown in the reference accessory image.`;
            };

            const accMapping: Record<string, string> = {
                jacket: translateAcc(techAccessoryDescriptions.jacket, 'a jacket'),
                bag: translateAcc(techAccessoryDescriptions.bag, 'a bag'),
                glasses: translateAcc(techAccessoryDescriptions.glasses, 'glasses'),
                hat: translateAcc(techAccessoryDescriptions.hat, 'a hat'),
                jewelry: translateAcc(techAccessoryDescriptions.jewelry, 'jewelry (earrings/bracelet)'),
                belt: translateAcc(techAccessoryDescriptions.belt, 'a belt'),
                watch: "Model is wearing a premium minimalist smartwatch on the wrist.",
                phone: "Model is naturally holding a modern slim smartphone.",
                laptop: "A sleek modern laptop is visible in the scene, held or placed naturally.",
                headphones: "Model is wearing modern minimalist over-ear headphones."
            };
            const matchedAccs = accEntries.map(([k]) => accMapping[k]).filter(Boolean);

            if (matchedAccs.length > 0) {
                const accBlock: string[] = [];
                accBlock.push(`[ACCESSORIES_DESCRIPTION]`);
                accBlock.push(`CRITICAL: For any accessories listed below, strictly follow the provided reference images for their specific design, shape, and placement. Do not hallucinate generic versions.`);
                matchedAccs.forEach(text => accBlock.push(text));
                accBlock.push(`[/ACCESSORIES_DESCRIPTION]`);
                sections.push(accBlock.join("\n"));
            }

            // === PRIORITY 3: POSE GEOMETRY (structured [POSE] block) ===
            const angleLabel = view.includes('back') ? "BACK VIEW" : (view.includes('side') || view.includes('angled') ? "THREE-QUARTER FRONT VIEW" : (view.includes('closeup') ? "CLOSE-UP FRONT VIEW" : (view.includes('detail') ? (view.includes('front') ? "DETAIL FRONT VIEW" : "DETAIL BACK VIEW") : "FRONT VIEW")));
            const poseBlock: string[] = [];
            poseBlock.push(`[POSE]`);
            poseBlock.push(`View Angle: ${angleLabel}.`);
            poseBlock.push(`Subject: Professional ${sp.subject.type} (Strictly match provided identity).`);

            if (sp.pose.description) {
                let bio = clean(sp.pose.description);
                // Standardize "figure" to "model"
                bio = bio.replace(/the figure/gi, "the model").replace(/figure stands/gi, "model stands").replace(/figure is/gi, "model is");

                if (!sp.pose.dynamic && !isBackView) {
                    bio += ". Model stands perfectly still and symmetrical with feet parallel and shoulder-width apart, facing the camera directly. Arms hang straight down at the sides with fingers relaxed. No weight shift in the hips. Eyes looking directly into the camera lens.";
                } else if (!sp.pose.dynamic && isBackView) {
                    bio += ". Model stands perfectly straight with back to camera, head facing away, arms at sides, feet parallel.";
                }

                if (sp.pose.dynamic) {
                    bio = bio.replace(/arms (hang|stay|placed) (naturally )?at sides/gi, "arms in dynamic fashion placement");
                }
                poseBlock.push(bio);
            }
            if (sp.pose.reference && sp.pose.reference.includes("stickman")) {
                poseBlock.push("POSE REFERENCE: Use the provided reference stickman image to match pose.");
            }
            poseBlock.push(`[/POSE]`);
            sections.push(poseBlock.join("\n"));

            // === PRIORITY 4: STYLING & ENVIRONMENT (structured blocks) ===
            const stylingItems: string[] = [];

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

            if (sp.styling.inner_wear?.visible && canShowCollarHairButtons && sp.styling.buttons === 'open') {
                const innerDesc = clean(sp.styling.inner_wear.description);
                stylingItems.push(`base layer${innerDesc ? ` (${innerDesc})` : ""} is visible under the open front`);
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
                sections.push(`[STYLING]\n${stylingItems.join(". ")}.\n[/STYLING]`);
            }

            // 5. Footwear & Accessories (structured)
            const extras: string[] = [];
            if (canShowFootwear && sp.accessories.shoes) {
                let style = clean(sp.accessories.shoes.style);
                style = style.replace(/sneakers?/gi, "shoes");
                const size = clean(sp.accessories.shoes.size);

                if (uploadedImages.shoes) {
                    extras.push(`[FOOTWEAR]\n**MANDATORY - MUST MATCH PROVIDED SHOE IMAGE EXACTLY** in color, texture, and silhouette. ${style}${size ? ` (${size})` : ""}\n[/FOOTWEAR]`);
                } else {
                    extras.push(`[FOOTWEAR]\n${style}${size ? ` (${size})` : ""}\n[/FOOTWEAR]`);
                }
            }

            if (canShowLegHem && !['full_length', 'deep_break'].includes(pantLength)) {
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

            if (extras.length > 0) sections.push(extras.join(" "));

            // 6. Background (structured)
            sections.push(`[BACKGROUND]\nUse the provided reference background images to match environment perfectly.\n[/BACKGROUND]`);

            // 7. Hair & Face (structured)
            const hairFaceItems: string[] = [];

            if (canShowCollarHairButtons || canShowFaceDetails) {
                if (isBackView) {
                    hairFaceItems.push("Model is looking away from the camera.");
                } else if (sp.subject.look_at_camera === true) {
                    hairFaceItems.push("Model is making direct eye contact with the camera.");
                } else if (sp.subject.look_at_camera === false) {
                    hairFaceItems.push("Model is looking slightly away from the camera, avoiding direct eye contact.");
                }

                if (sp.subject.type !== 'male_model') {
                    if (sp.subject.hair_behind_shoulders === true) {
                        hairFaceItems.push("Hair is neatly placed BEHIND the shoulders.");
                    } else {
                        hairFaceItems.push("Hair: Natural and well-groomed.");
                    }
                }
                if (sp.subject.wind) hairFaceItems.push("Dynamic studio airflow/wind effect is visible, hair and fabric suggest movement.");
            }

            if (hairFaceItems.length > 0) {
                sections.push(`[MODEL_APPEARANCE]\n${hairFaceItems.join(" ")}\n[/MODEL_APPEARANCE]`);
            }

            // 8. Expressions & Gaze -> Modern Mood System
            const resolvedMood = resolveMood(angleId, selectedMoodId, effectiveRole);
            if (resolvedMood && resolvedMood.promptAddition) {
                sections.push(`[MODEL_MOOD]\nExpression & Vibe: ${resolvedMood.promptAddition}\n[/MODEL_MOOD]`);
            }

            // 9. Lighting (structured - ALWAYS included when available)
            if (lightingPositive) {
                sections.push(`[LIGHTING]\n${clean(lightingPositive)}\n[/LIGHTING]`);
            } else if (sp.scene.lighting) {
                sections.push(`[LIGHTING]\n${clean(sp.scene.lighting)}\n[/LIGHTING]`);
            } else {
                sections.push(`[LIGHTING]\nsoft_fashion_lighting\n[/LIGHTING]`);
            }

            const finalPrompt = sections.map(s => s.trim()).filter(Boolean).join(" ");

            return finalPrompt;
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

            let { generateWithNanoBanana } = await import('@/lib/nano-banana');
            return await generateWithNanoBanana({
                prompt: reqData.prompt,
                image_urls: reqData.input_images,
                aspect_ratio: aspectRatio,
                resolution: finalRes,
                negative_prompt: reqData.negative_prompt,
                seed: requestSeed,
                enable_web_search: enableWebSearch
            });
        };

        // === PREVIEW MODE ===
        if (preview) {
            if (isAngles) {
                // Check if targetView is specified (Single Angle Mode)
                if (targetView) {
                    const reqData = buildStructuredPrompt(targetView);
                    return NextResponse.json({
                        status: "preview",
                        previews: [{
                            title: `${targetView.charAt(0).toUpperCase() + targetView.slice(1)} View`,
                            prompt: reqData.prompt,
                            structured: reqData.structured,
                            assets: reqData.input_images,
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

        const finalImages = await Promise.all(results.map(r => ensureS3Url(r.url, "generated")));

        return NextResponse.json({
            status: "completed",
            images: finalImages,
            prompts: results.map(r => r.prompt)
        });

    } catch (error: any) {
        console.error("Generation error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
