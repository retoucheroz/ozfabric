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
        promptAddition: 'candid moment between takes, natural resting expression with quiet confidence, eyes alive and present, as if the photographer caught a real unguarded moment',
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
            if (angleMeta.faceProminence === 'none' || angleId.toLowerCase().includes('back')) return null;

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
            socksType = 'none', // 'none' | 'white' | 'black' | 'grey' | 'navy' | 'beige' | 'brown' | 'red' | 'green' | 'blue' | 'anthracite'
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

        // Ensure pose image is an R2 URL if provided (but we typically delete it below)
        let uploadedImages = rawUploadedImages || {};

        if (!preview) {
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
            const isCloseupView = focus === 'closeup' || view.includes('closeup');

            // 1. Model always included
            if (imgs.model) assets.push(imgs.model);

            // Detail Assets Grouping (New logic based on user request)
            // 1,2: Upper Front, 3,4: Lower Front (from front details)
            // 1,2: Upper Back, 3,4: Lower Back (from back details)
            const upperFrontDetails = [imgs.detail_front_1, imgs.detail_front_2].filter(Boolean);
            const upperBackDetails = [imgs.detail_back_1, imgs.detail_back_2].filter(Boolean);
            const lowerFrontDetails = [imgs.detail_front_3, imgs.detail_front_4].filter(Boolean);
            const lowerBackDetails = [imgs.detail_back_3, imgs.detail_back_4].filter(Boolean);

            const frontDetails = [...upperFrontDetails, ...lowerFrontDetails];
            const backDetails = [...upperBackDetails, ...lowerBackDetails];

            // 2. Garment Assets (Comprehensive Coverage for all views)
            const isFront = view === 'front' || view === 'styling' || view.includes('front');
            const isBack = view === 'back' || view.includes('back');
            const isSide = view === 'side' || view.includes('side') || view.includes('angled') || view.includes('threequarter');

            const hasUpper = wfType === 'upper' || wfType === 'set' || wfType === 'dress' || !!imgs.top_front;
            const hasLower = wfType === 'lower' || wfType === 'set' || wfType === 'dress' || !!imgs.bottom_front;

            if (isFront || isSide) {
                if (imgs.main_product) assets.push(imgs.main_product);
                if (imgs.top_front) assets.push(imgs.top_front);
                if (imgs.dress_front) assets.push(imgs.dress_front);
                if (imgs.inner_wear && buttonsOpen) assets.push(imgs.inner_wear);
                if (imgs.bottom_front && !isCloseupView) assets.push(imgs.bottom_front);
                if (imgs.jacket) assets.push(imgs.jacket);
                if (imgs.belt && !excludeBeltAsset && !isCloseupView) assets.push(imgs.belt);
                if (imgs.bag && !isCloseupView) assets.push(imgs.bag);
                if (imgs.jewelry) assets.push(imgs.jewelry);
                if (imgs.glasses) assets.push(imgs.glasses);
                if (imgs.hat && !excludeHatAsset) assets.push(imgs.hat);

                // Selective Detail Inclusion
                if (hasUpper) assets.push(...upperFrontDetails);
                if (hasLower) assets.push(...lowerFrontDetails);
            }

            if (isBack || isSide) {
                if (imgs.top_back) assets.push(imgs.top_back);
                if (imgs.bottom_back) assets.push(imgs.bottom_back);
                if (imgs.jacket) assets.push(imgs.jacket);
                if (imgs.backRefUpload) assets.push(imgs.backRefUpload);

                // Selective Detail Inclusion
                if (hasUpper) assets.push(...upperBackDetails);
                if (hasLower) assets.push(...lowerBackDetails);
            }

            // 3. Shoes (Include if not explicitly excluded)
            // USER RULE: Shot 1 + Upper Body + Upper Workflow = NO SHOES (neither prompt nor asset)
            const isFirstUpperStyling = wfType === 'upper' && focus === 'upper' && shotIndex === 1;

            if (imgs.shoes && !excludeShoesAsset && !isFirstUpperStyling) {
                assets.push(imgs.shoes);
            }

            // 4. Common Assets
            if (imgs.background) assets.push(imgs.background);
            if (imgs.belt && !excludeBeltAsset && !isCloseupView) assets.push(imgs.belt);
            if (imgs.hat && !excludeHatAsset && !isCloseupView) assets.push(imgs.hat);
            if (imgs.bag && !isCloseupView) assets.push(imgs.bag);
            if (imgs.glasses) assets.push(imgs.glasses);
            if (imgs.jewelry) assets.push(imgs.jewelry);
            if (imgs.lighting) assets.push(imgs.lighting);

            // Note: We exclude original 'imgs.pose' to avoid leakage. Skip stickman entirely.

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
                        hem_finish: (workflowType === 'lower' || workflowType === 'dress' || workflowType === 'set') && hemType !== 'none' ? hemType : null,
                        pant_length: (workflowType === 'lower' || workflowType === 'dress' || workflowType === 'set') && pantLength !== 'none' ? pantLength : null
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
                    description: poseDescription || null, // Always use provided description if available
                    dynamic: isActiveStyling || !!poseDescription
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
                isStyling: isActiveStyling,

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
                // Technical shots should only be static if NO custom description is provided
                structuredPrompt.camera.angle = view as string;
                structuredPrompt.pose.dynamic = !!structuredPrompt.pose.description;
                // If structuredPrompt.pose.description is already set (from above), keep it. 
                // Otherwise it remains null or whatever it was.

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
                    style: shoesDescription || (uploadedImages.shoes ? "Professional footwear matching the reference" : "slim low-profile sneakers"),
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
            const clean = (str: string) => str?.trim().replace(/\n{2,}/g, "\n").replace(/\s{3,}/g, " ").replace(/"/g, "").replace(/\.+$/, "") || "";

            // Simple English Translation Map for Product Names
            const trEnMap: Record<string, string> = {
                'gömlek': 'shirt', 'tişört': 't-shirt', 'pantolon': 'pants', 'etek': 'skirt', 'elbise': 'dress',
                'kaban': 'coat', 'ceket': 'jacket', 'kazak': 'sweater', 'hırka': 'cardigan', 'yelek': 'vest',
                'şort': 'shorts', 'tayt': 'leggings', 'tulum': 'jumpsuit', 'pijama': 'pajamas', 'takım': 'suit',
                'mont': 'jacket', 'palto': 'coat', 'trençkot': 'trench coat', 'bluz': 'blouse', 'atlet': 'tank top'
            };

            let productNameEn = sp.garment.name || "";
            if (productNameEn) {
                Object.entries(trEnMap).forEach(([tr, en]) => {
                    const regex = new RegExp(`\\b${tr}\\b`, 'gi');
                    productNameEn = productNameEn.replace(regex, en);
                });
            }

            const isBackView = view.includes('back') || sp.camera.angle === 'back' || sp.pose.description?.toLowerCase().includes('back to camera');
            const isAngledView = view.includes('side') || view.includes('angled') || view.includes('threequarter') || sp.camera.angle === 'angled';
            const framing = sp.camera.framing;
            const isStyling = sp.isStyling;
            const effectiveRole = isStyling ? 'styling' : 'technical';
            const isUpperOrCloseup = view.includes('upper') || view.includes('closeup') || framing === 'cowboy_shot' || framing === 'chest_and_face' || view.includes('closeup') || view.includes('detail');

            // Visibility Flags
            const canShowFootwear = framing === 'head_to_toe';
            const canShowLegHem = framing === 'head_to_toe';
            const canShowWaistRiseFitTuck = ['cowboy_shot', 'head_to_toe', 'waist_to_above_knees'].includes(framing);
            const canShowCollarHairButtons = ['chest_and_face', 'cowboy_shot', 'head_to_toe'].includes(framing);
            const canShowFaceDetails = framing === 'chest_and_face';

            // 1. [SUBJECT_IDENTITY]
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
                    const isCowboyOrUpper = framing === 'cowboy_shot' || view.includes('upper');
                    if (sp.subject.type === 'male_model') {
                        const desc = isCowboyOrUpper
                            ? "Waist 79 cm (W32), Chest 97 cm (Size L / 50). Lean and athletic build."
                            : "Height 187 cm, Waist 79 cm (W32), Chest 97 cm (Size L / 50), Hips 97 cm, Inseam L34-L36. Lean and athletic build with long leg proportions.";
                        subjectBlock.push(`Physical Proportions & Body Description: ${desc}`);
                    } else if (sp.subject.type === 'female_model') {
                        const desc = isCowboyOrUpper
                            ? "Waist 62 cm (Size S / 36), Chest 86 cm. Slender, high-fashion slim build."
                            : "Height 178 cm, Waist 62 cm (Size S / 36), Chest 86 cm, Hips 90 cm. Long legs with a slender, high-fashion slim build.";
                        subjectBlock.push(`Physical Proportions & Body Description: ${desc}`);
                    }
                }
            }
            subjectBlock.push(`[/SUBJECT_IDENTITY]`);
            const subjectStr = subjectBlock.join("\n");

            const angleLabel = isBackView ? "BACK VIEW" : (isAngledView ? "THREE-QUARTER VIEW" : (view.includes('closeup') ? "CLOSE-UP FRONT VIEW" : (view.includes('detail') ? (view.includes('front') ? "DETAIL FRONT VIEW" : "DETAIL BACK VIEW") : "FRONT VIEW")));

            // 2. [FRAMING_DESCRIPTION]
            const framingBlock: string[] = [];
            framingBlock.push(`[FRAMING_DESCRIPTION]`);
            const safeAngleId = (angleId || view || "").toLowerCase();
            const isThreeQuarter = (safeAngleId.includes('threequarter') || safeAngleId.includes('angled') || view === 'side' || view === 'angled');
            const isTechFullFront = safeAngleId === 'std_tech_full_front';

            if (isThreeQuarter && effectiveRole === 'technical') {
                framingBlock.push("Shot Type: Full body editorial photography, three-quarter angle. The model's body is rotated approximately 45 degrees from the camera.");
                framingBlock.push("Visible: Full model from head to feet, shot from a diagonal perspective.");
            } else {
                // View Angle removed from framing desc as per user request
                if (framing === 'head_to_toe') {
                    framingBlock.push(`Shot Type: Head-to-toe full body photography.`);
                    framingBlock.push("Visible: Full model from head to feet.");
                } else if (framing === 'cowboy_shot') {
                    framingBlock.push("Shot Type: Cowboy shot (Medium shot).");
                    framingBlock.push("Visible: Head to mid-thigh area.");
                    framingBlock.push("FRAME LOCK: Strict medium cowboy crop.");
                    framingBlock.push("Image MUST crop between upper-thigh and mid-thigh.");
                    framingBlock.push("No knees visible.");
                    framingBlock.push("No lower legs visible.");
                    framingBlock.push("No full body.");
                    framingBlock.push("The frame must terminate above the knee line.");
                    framingBlock.push("Hem behavior must be visible within frame.");
                    framingBlock.push("Do not extend framing to show full body for hem clarification.");
                } else if (framing === 'chest_and_face') {
                    framingBlock.push("Shot Type: Close-up beauty/fashion portrait.");
                    framingBlock.push("Visible: Head, shoulders, and upper chest.");
                    framingBlock.push("Constraint: Exclude waist, legs, and footwear.");
                } else if (framing === 'waist_to_above_knees') {
                    framingBlock.push("Shot Type: Detail-oriented proximity shot. Strictly centered on the lower body.");
                    framingBlock.push("Visible: MANDATORY - Strict crop from the natural waistline down to the upper knees ONLY.");
                    framingBlock.push("Constraint: ABSOLUTELY EXCLUDE face, shoulders, upper chest, and feet from the frame.");
                }
            }
            framingBlock.push(`[/FRAMING_DESCRIPTION]`);
            const framingStr = framingBlock.join("\n");

            // 3. [POSE]
            const poseBlock: string[] = [];
            poseBlock.push(`[POSE]`);

            if (effectiveRole === 'technical') {
                if (isThreeQuarter) {
                    // NEW SPECIAL OVERRIDE FOR THREE-QUARTER TECHNICAL VIEW
                    poseBlock.push("View Angle: THREE-QUARTER VIEW (FULL BODY).");
                    poseBlock.push(`Subject: Professional ${sp.subject.type.replace('_', ' ')}.`);
                    poseBlock.push("Posture: Body angled 45 degrees to the camera, weight shifted slightly to the back foot.");
                    poseBlock.push("Limb Map:");
                    poseBlock.push("- Legs: Slightly staggered stance, front foot angled toward camera, back foot planted behind.");
                    poseBlock.push("- Arms: One arm visible at side, far arm partially obscured by torso rotation.");
                    if (framing !== 'waist_to_above_knees') poseBlock.push("- Head: Facing away from camera.");
                } else {
                    // RESTORE OLD STRUCTURED FORMAT FOR TECHNICAL SHOTS

                    // Construct enhanced angle label with framing info
                    let enhancedAngleLabel = angleLabel;

                    // Add framing info to the label
                    if (framing === 'head_to_toe') enhancedAngleLabel += " (FULL BODY)";
                    else if (framing === 'cowboy_shot') enhancedAngleLabel += " (COWBOY SHOT)";
                    else if (framing === 'chest_and_face') enhancedAngleLabel += " (CLOSE-UP)";
                    else if (framing === 'waist_to_above_knees') enhancedAngleLabel += " (LOWER BODY)";

                    poseBlock.push(`View Angle: ${enhancedAngleLabel}.`);
                    poseBlock.push(`Subject: The model ${sp.subject.type}.`);

                    if (!isBackView) {
                        poseBlock.push("Posture: Symmetrical straight-on standing posture. Weight evenly distributed on both feet.");
                        poseBlock.push("Limb Map:");
                        if (!isUpperOrCloseup) poseBlock.push("- Legs: Perfectly straight, feet parallel to each other.");
                        poseBlock.push("- Arms: Resting straight at sides, hands relaxed.");
                        if (framing !== 'waist_to_above_knees') poseBlock.push("- Head: Facing directly forward at camera.");
                    } else {
                        poseBlock.push("Posture: Perfectly straight standing posture with back to camera.");
                        poseBlock.push("Limb Map:");
                        poseBlock.push("- Legs: Straight and parallel.");
                        poseBlock.push("- Arms: Resting straight at sides.");
                        if (framing !== 'waist_to_above_knees') poseBlock.push("- Head: Facing away from camera.");
                    }
                }
            } else {
                // STYLING SHOTS: Use Pose Analysis Robot v2 narrative
                if (sp.pose.description) {
                    let bio = clean(sp.pose.description);
                    bio = bio.replace(/the figure/gi, "the model").replace(/figure stands/gi, "model stands").replace(/figure is/gi, "model is");
                    bio = bio.replace(/\[\/?POSE_PROMPT\]/gi, "").trim();
                    poseBlock.push(bio);
                } else {
                    // Fallback for styling
                    poseBlock.push(`The model ${sp.subject.type} stands in a relaxed, natural fashion posture.`);
                }
            }
            poseBlock.push(`[/POSE]`);
            const poseStr = poseBlock.join("\n");

            // 4. [LOCKED_PRODUCT_CONSTRAINTS]
            const productBlock: string[] = [];
            productBlock.push(`[LOCKED_PRODUCT_CONSTRAINTS]`);
            productBlock.push(`Main Garment: ${clean(productNameEn)}.`);
            if (sp.garment.fabric) {
                const firstSentence = sp.garment.fabric.split(/[.!?]/)[0].trim();
                productBlock.push(`Fabric & Texture: ${clean(firstSentence)}.`);
            }
            if (sp.garment.fit) {
                const firstSentence = sp.garment.fit.split(/[.!?]/)[0].trim();
                productBlock.push(`Construction & Fit: ${clean(firstSentence)}.`);
            }
            if (canShowCollarHairButtons) {
                if (sp.garment.details?.collar) productBlock.push(`Collar: ${sp.garment.details.collar}.`);
                if (sp.garment.details?.shoulder) productBlock.push(`Shoulder: ${sp.garment.details.shoulder}.`);
            }
            if (canShowWaistRiseFitTuck) {
                if (sp.garment.details?.waist) productBlock.push(`Waist: ${sp.garment.details.waist}.`);
                if (sp.styling.tucked === 'tucked') {
                    productBlock.push(`Style Adjustment:\n[TOP_GARMENT_TUCKED_RENDER_LOCK]\n\nThe top garment is inserted into the bottom garment at the waist.\n\nLayer order:\nBottom garment waistband is clearly visible.\nTop garment fabric enters the waistband opening.\n\nFabric behavior:\nFabric folds inward at the waist.\nUpper section remains smooth above the waist.\nLower section is secured inside the bottom garment.\n\nSilhouette:\nA visible separation line occurs at the waistband.\nThe top garment does not extend below the waistband.\n\n[/TOP_GARMENT_TUCKED_RENDER_LOCK]`);
                } else if (sp.styling.tucked === 'untucked') {
                    productBlock.push(`Style Adjustment:\n[TOP_GARMENT_OUTSIDE_RENDER_LOCK]\n\nThe top garment is worn fully outside the bottom garment.\n\nLayer order:\nTop garment is the outermost layer at the waist and hip region.\nBottom garment remains visually behind the top garment.\n\nFabric behavior:\nFabric falls vertically from shoulders to hem.\nGravity pulls the garment straight downward.\nNo upward pull, no inward folding at the waist.\nNo fabric insertion into waistband area.\n\nSilhouette:\nHemline remains continuous and clearly visible across the entire front.\nThe transition from top garment to bottom garment occurs below the waist level.\n\n[/TOP_GARMENT_OUTSIDE_RENDER_LOCK]`);
                }
                if (sp.garment.details?.rise) productBlock.push(`Rise: ${sp.garment.details.rise}.`);
            }
            if (canShowLegHem) {
                if (sp.garment.details?.leg_style) productBlock.push(`Leg Style: ${sp.garment.details.leg_style}.`);
                if (sp.garment.details?.hem_finish) productBlock.push(`Hem Finish: ${sp.garment.details.hem_finish}.`);
                if (sp.garment.details?.pant_length) {
                    const length = sp.garment.details.pant_length;
                    if (length === 'cropped') productBlock.push("Pant Length: cropped tapered pants ending above the ankle, bare ankles fully exposed, clear visible gap between hem and shoes, no fabric touching footwear.");
                    else if (length === 'standard') productBlock.push("Pant Length: straight-leg pants ending just below the ankle, hem hovering above the shoe without touching, clean single line at the bottom, no break no stacking no bunching.");
                    else if (length === 'classic') productBlock.push("Pant Length: pants with hem just touching the top of the shoe, fabric resting on the shoe with barely any fold, no sock visible, clean tailored look with minimal contact at the front crease.");
                    else if (length === 'covering') productBlock.push("Pant Length: long straight-leg pants with hem draping over the top of the shoes, fabric covering the shoe opening, visible soft break and slight stacking at the front, only the toe area of the shoe peeking out.");
                    else if (length === 'flare') productBlock.push("Pant Length: wide flared bell-bottom pants flaring out dramatically from the knee down, wide hem sweeping the floor and covering the shoes almost entirely, only the very toe tip of the shoe barely visible beneath the wide flared hem, vintage 70s flare silhouette.");
                }
            }
            if (sp.styling.buttons === 'open' && canShowCollarHairButtons) {
                productBlock.push("Style Adjustment: Front is open and unbuttoned.");
            }
            if (canShowFootwear && sp.accessories.shoes) {
                let shoeStyle = clean(sp.accessories.shoes.style).replace(/sneakers?/gi, "shoes");
                if (uploadedImages.shoes) {
                    productBlock.push(`Footwear: STRICTLY MATCH PROVIDED SHOE IMAGE. ${shoeStyle}`);
                } else {
                    productBlock.push(`Footwear: ${shoeStyle}`);
                }
            }
            productBlock.push(`[/LOCKED_PRODUCT_CONSTRAINTS]`);
            const productStr = productBlock.join("\n");

            // 5. [STYLING]
            const stylingBlock: string[] = [];
            stylingBlock.push(`[STYLING]`);
            if (sp.styling.layers.jacket?.visible && canShowCollarHairButtons) {
                const jacketDesc = clean(sp.styling.layers.jacket.description);
                stylingBlock.push(`wearing a jacket over the main garment${jacketDesc ? ` (${jacketDesc})` : ""}`);
            }
            if (sp.styling.layers.upper_garment?.visible && wf === 'lower' && (canShowCollarHairButtons || canShowWaistRiseFitTuck)) {
                if (uploadedImages.top_front) stylingBlock.push("wearing the provided top garment reference image");
                else stylingBlock.push(`wearing a ${clean(sp.styling.layers.upper_garment.description) || 'top garment'} tucked in or as a layer`);
            }
            if (sp.styling.inner_wear?.visible && canShowCollarHairButtons && sp.styling.buttons === 'open') {
                stylingBlock.push(`base layer (${clean(sp.styling.inner_wear.description) || 'minimalist layer'}) is visible under the open front`);
            }
            if (wf === 'upper' || wf === 'set' || wf === 'dress' || uploadedImages.top_front || uploadedImages.jacket) {
                if (sp.styling.sleeves_rolled) stylingBlock.push("sleeves are rolled up to the elbows");
                else if (wf !== 'lower') stylingBlock.push("sleeves are straight down to the wrists");
            }
            if (canShowLegHem && sp.styling.socks && sp.styling.socks !== 'none') {
                const len = sp.garment.details?.pant_length;
                if (len !== 'covering' && len !== 'flare') {
                    stylingBlock.push(`style accessory: wearing ${sp.styling.socks} colored socks.`);
                }
            }
            const accessoryItems = Object.entries(techAccessories || {}).filter(([_, v]) => !!v).map(([k]) => {
                const desc = techAccessoryDescriptions[k] || k;
                return `wearing ${clean(desc)} from reference image`;
            });
            if (accessoryItems.length > 0) stylingBlock.push(...accessoryItems);
            stylingBlock.push(`[/STYLING]`);
            const stylingStr = stylingBlock.length > 2 ? stylingBlock.join("\n") : "";

            // 6. [BACKGROUND]
            const backgroundStr = `[BACKGROUND]\nUse the provided reference background images to match environment perfectly.\n[/BACKGROUND]`;

            // 7. [LIGHTING]
            let lightingContent = "soft_fashion_lighting";
            if (lightingPositive) lightingContent = clean(lightingPositive);
            else if (sp.scene.lighting) lightingContent = clean(sp.scene.lighting);
            const lightingStr = `[LIGHTING]\n${lightingContent}\n[/LIGHTING]`;

            // 8. [MODEL_APPEARANCE]
            const appearanceBlock: string[] = [];
            appearanceBlock.push(`[MODEL_APPEARANCE]`);
            if (canShowCollarHairButtons || canShowFaceDetails) {
                if (isBackView) appearanceBlock.push("Model is looking away from the camera.");
                else if (sp.subject.look_at_camera === true) appearanceBlock.push("Model is making direct eye contact with the camera.");
                else if (sp.subject.look_at_camera === false) appearanceBlock.push("Model is looking slightly away from the camera.");
                if (sp.subject.type !== 'male_model') {
                    if (sp.subject.hair_behind_shoulders === true) appearanceBlock.push("Hair is neatly placed BEHIND the shoulders.");
                    else appearanceBlock.push("Hair: Natural and well-groomed.");
                }
                if (sp.subject.wind) appearanceBlock.push("Visible studio airflow movement.");
            }
            appearanceBlock.push(`[/MODEL_APPEARANCE]`);
            const appearanceStr = appearanceBlock.length > 2 ? appearanceBlock.join("\n") : "";

            // 9. [MODEL_MOOD]
            const resolvedMood = resolveMood(angleId, selectedMoodId, effectiveRole);
            const moodStr = (resolvedMood && resolvedMood.promptAddition) ? `[MODEL_MOOD]\nExpression & Vibe: ${clean(resolvedMood.promptAddition)}\n[/MODEL_MOOD]` : "";

            // Final Assembly 1-9
            const finalSections = [poseStr, subjectStr, framingStr, productStr, moodStr, lightingStr, stylingStr, backgroundStr, appearanceStr];
            return finalSections.map(s => s.trim()).filter(Boolean).join("\n\n");
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
            try {
                if (isAngles) {
                    // Check if targetView is specified (Single Angle Mode)
                    if (targetView) {
                        const reqData = buildStructuredPrompt(targetView);
                        return NextResponse.json({
                            status: "preview",
                            previews: [{
                                title: `${targetView.charAt(0).toUpperCase() + targetView.slice(1)} View`,
                                prompt: reqData.prompt || "Could not generate prompt text.",
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
                                prompt: frontData.prompt || "Could not generate prompt text.",
                                structured: frontData.structured,
                                assets: frontData.input_images,
                                settings: { resolution, aspect_ratio: aspectRatio }
                            },
                            {
                                title: "Side View",
                                prompt: sideData.prompt || "Could not generate prompt text.",
                                structured: sideData.structured,
                                assets: sideData.input_images,
                                settings: { resolution, aspect_ratio: aspectRatio }
                            },
                            {
                                title: "Back View",
                                prompt: backData.prompt || "Could not generate prompt text.",
                                structured: backData.structured,
                                assets: backData.input_images,
                                settings: { resolution, aspect_ratio: aspectRatio }
                            }
                        ]
                    });
                } else {
                    // Normal Styling Mode
                    const reqData = buildStructuredPrompt(targetView || 'styling');
                    const finalPromptStr = typeof reqData.prompt === 'string' && reqData.prompt.trim() !== ''
                        ? reqData.prompt
                        : `[PROMPT_ENGINE_FALLBACK] ${targetView ? targetView.toUpperCase() : 'STYLING'} SHOT.
[SUBJECT] ${body.gender || 'model'} identity from reference [/SUBJECT]
[PRODUCT] ${body.productName || 'garment'} as shown [/PRODUCT]`;

                    return NextResponse.json({
                        status: "preview",
                        previews: [{
                            title: targetView ? `${targetView.charAt(0).toUpperCase() + targetView.slice(1)} View` : "Styling Shot",
                            prompt: finalPromptStr,
                            structured: reqData.structured,
                            assets: reqData.input_images,
                            settings: { resolution, aspect_ratio: aspectRatio }
                        }]
                    });
                }
            } catch (err: any) {
                console.error("Preview generation fatal error:", err);
                return NextResponse.json({
                    status: "preview",
                    previews: [{
                        title: "Error in Preview",
                        prompt: `[ERROR] Failed to generate tags: ${err.message}. Please check your product description and assets.`,
                        structured: {},
                        assets: {},
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
