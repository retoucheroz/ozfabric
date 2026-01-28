import { NextRequest, NextResponse } from "next/server";

const DEFAULT_NEGATIVE_PROMPT = ""; // Negative prompt removed as per user request

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
            tucked = false, // NEW: Tuck Toggle
            productDescription, // NEW: Analyzed Fabric/Texture
            fitDescription, // NEW: Analyzed Fit/Pattern for pants
            editedPrompt = null
        } = await req.json();

        // One-time random seed for this entire request (Consistency across angles)
        const requestSeed = Math.floor(Math.random() * 1000000000);

        // 1. Determine Workflow Type
        // 1. Determine Workflow Type (Enhanced Logic)
        const lowerName = productName.toLowerCase();
        let workflowType = requestedWorkflowType || 'upper';

        // Keywords from User Request
        const lowerKeywords = ['pantolon', 'şort', 'etek', 'tayt', 'eşofman altı', 'salopet altı', 'jean', 'trousers', 'skirt', 'shorts', 'leggings', 'joggers'];
        const fullBodyKeywords = ['elbise', 'tulum', 'romper', 'bahçıvan', 'kaban', 'palto', 'trençkot', 'pardösü', 'mayo', 'mayokini', 'kaftan', 'sabahlık', 'gecelik', 'dress', 'jumpsuit', 'coat', 'trench', 'swimsuit', 'gown'];
        const setKeywords = ['takım', 'ikili takım', 'pijama', 'eşofman takımı', 'bikini', 'sütyen', 'zıbın', 'set', 'suit', 'bikini'];

        // Upper is default, but let's check others
        if (setKeywords.some(k => lowerName.includes(k))) {
            workflowType = 'set';
        } else if (fullBodyKeywords.some(k => lowerName.includes(k))) {
            workflowType = 'dress'; // Represents Full Body Group
        } else if (lowerKeywords.some(k => lowerName.includes(k))) {
            workflowType = 'lower';
        } else {
            workflowType = 'upper'; // Default fallback (Tişört, Gömlek, Ceket, vs.)
        }

        // 2. Helper to Build Prompt & Assets PER VIEW
        const buildRequestForView = (view: 'styling' | 'front' | 'side' | 'back') => {
            let garmentTerm = productName || "a stylish garment";
            const lowerTermCheck = garmentTerm.toLowerCase();

            // Only add suffix if product name doesn't already indicate the garment type
            const lowerKeywordsInName = ['pant', 'jean', 'denim', 'trouser', 'skirt', 'short', 'legging', 'jogger'];
            const dressKeywordsInName = ['dress', 'gown', 'jumpsuit', 'romper'];

            if (workflowType === 'lower' && !lowerKeywordsInName.some(k => lowerTermCheck.includes(k))) {
                garmentTerm += " (pants/trousers)";
            }
            if (workflowType === 'dress' && !dressKeywordsInName.some(k => lowerTermCheck.includes(k))) {
                garmentTerm += " (dress/gown)";
            }
            if (workflowType === 'set') garmentTerm = "matching set: " + garmentTerm;

            // INTEGRATE FABRIC ANALYSIS DIRECTLY INTO SUBJECT
            if (productDescription) {
                // productDescription format: "Light Wash Denim. Texture: diagonal twill..."
                // We already have the product name, so just add the texture/pattern details
                // Extract only texture and pattern info, skip the fabric name which is already in productName
                let cleanDesc = productDescription;
                // Remove "Fabric: X." or "X. Texture:" patterns to avoid duplication with productName
                cleanDesc = cleanDesc.replace(/^[^.]+\.\s*/, ''); // Remove first sentence (fabric name)
                if (cleanDesc.trim()) {
                    garmentTerm += `. ${cleanDesc}`;
                }
            }



            let modelTerm = "model";
            if (gender === 'male') modelTerm = "male model";
            if (gender === 'female') modelTerm = "female model";

            let finalPrompt = `Fashion photography of a ${modelTerm} wearing ${garmentTerm}. `;
            let finalNegativePrompt = DEFAULT_NEGATIVE_PROMPT;



            // FIT/PATTERN DESCRIPTION for pants - integrates analyzed silhouette
            if (fitDescription && workflowType === 'lower') {
                finalPrompt += ` PANTS FIT: ${fitDescription} `;
            }

            // SHOE SIZE CONTROL - Keep it simple, rely on negative prompt
            if (uploadedImages.shoes) {
                finalPrompt += ` Shoes: Small, sleek, low-profile sneakers. Realistic proportions. `;
                finalNegativePrompt += ", oversized shoes, chunky shoes, large footwear, clown shoes, exaggerated footwear, big shoes, thick soles";
            }

            // UPPER GARMENT/JACKET INSTRUCTION (for lower workflow with outfit combination)
            if (workflowType === 'lower' && uploadedImages.top_front) {
                finalPrompt += ` UPPER BODY: Model is ALSO wearing the jacket/top shown in the provided upper garment image. This is an outfit combination - the model wears BOTH the pants AND the jacket/top. Do NOT ignore the jacket. `;
            }



            // BACKGROUND
            if (uploadedImages.background) {
                finalPrompt += " BACKGROUND: Match the exact details, colors and texture of the provided background reference image. ";
            } else {
                finalPrompt += " BACKGROUND: Clean, professional fashion studio background. ";
            }

            // --- PROMPT SCENARIOS ---
            const techSuffix = " WEARING SNEAKERS/SHOES. FULL BODY SHOT FROM HEAD TO TOE. NO CROPPING. FACE MUST BE VISIBLE. ";

            // Face Visibility Enforcement (Only for front and styling views - side and back excluded)
            if (view === 'front' || view === 'styling') {
                finalPrompt += " FACE MUST BE CLEARLY VISIBLE. DO NOT CROP HEAD. No headless shots. ";
                finalPrompt += " Model looking directly at camera. ";
            }

            // Pose Description Injection
            if (poseDescription && view === 'styling') {
                finalPrompt += ` STRICTLY FOLLOW THIS POSE: ${poseDescription} `;
            }

            // Garment Logic
            const lowerName = productName.toLowerCase();
            const isShirt = lowerName.includes("gömlek") || lowerName.includes("shirt");
            const isOuterwear = lowerName.includes("ceket") || lowerName.includes("yelek") || lowerName.includes("mont") || lowerName.includes("jacket") || lowerName.includes("coat") || lowerName.includes("vest") || lowerName.includes("blazer");

            // Rules
            const shirtRule = " All buttons fully buttoned up. Closed front. ";
            const outerwearStylingRule = " Open front. Unbuttoned. Showing inner layers. ";
            const outerwearTechRule = " Fully buttoned up. Closed front. Symmetrical. ";
            const sleeveTechRule = " Long sleeves extending to wrist. Cuffs fully buttoned. No rolled up sleeves. ";

            // Button Logic (Dynamic)
            let buttonPrompt = "";
            let buttonNegative = "";

            if (view === 'styling') {
                if (buttonsOpen) {
                    buttonPrompt = " Open front. Unbuttoned. Showing inner t-shirt/layers. Casual open styling. ";
                } else {
                    buttonPrompt = " FULLY BUTTONED UP. All buttons closed from bottom to collar. CLOSED FRONT. No open chest. ";
                    // Strong Negative for Closed State
                    buttonNegative = ", open shirt, unbuttoned, open front, chest visible, undershirt visible";
                }
            } else {
                // Tech View -> ALWAYS CLOSED
                buttonPrompt = " FULLY BUTTONED UP. Closed front. Symmetrical. ";
                buttonNegative = ", open shirt, unbuttoned, open front";
            }

            finalNegativePrompt += buttonNegative;

            // Inner Wear Logic
            if (uploadedImages.inner_wear) {
                finalPrompt += " Wearing inner t-shirt under main garment. ";
                finalNegativePrompt += ", pocket on shirt, chest pocket, logo on shirt";
            }

            // Belt Logic
            // Rule: If Shirt is Untucked AND Closed, Belt is hidden. Do not include asset.
            // If Tucked OR Open, Belt might be visible.

            let includeBelt = true;
            if (workflowType === 'upper' && !tucked && !buttonsOpen && view === 'styling') {
                includeBelt = false;
            }

            if (uploadedImages.belt && includeBelt) {
                finalPrompt += " WEARING A BELT. ";
                if (view === 'back') {
                    finalPrompt += " BELT DETAILS: Belt must pass THROUGH belt loops. Do not cover brand labels on the waistband. ";
                }
            }

            // STRICT FIDELITY - Keep it short
            finalPrompt += " Replicate garment precisely. Match fabric texture exactly. ";

            // NOTE: detail_1 and detail_2 are NOT sent as images - their analysis is already in garmentTerm via productDescription

            // Lower Garment Force Logic (for Upper Workflow Styling)
            if (workflowType === 'upper' && uploadedImages.bottom_front) {
                finalPrompt += " LOWER BODY: Wearing the specific lower garment provided in input. Match color and style exactly. ";
            }

            // STYLING SHOT (Existing Logic)
            if (view === 'styling') {
                if (workflowType === 'upper') {
                    // Apply Garment Rules


                    if (isShirt || isOuterwear) {
                        finalPrompt += buttonPrompt;
                    }

                    // TUCK LOGIC (Controlled by UI toggle, default untucked)
                    if (tucked) {
                        finalPrompt += "Top garment is firmly TUCKED IN (inside the pants). Waistband visible. ";
                        finalPrompt += "Create distinct tuck lines and natural fabric bunching at the waist. ";
                    } else {
                        finalPrompt += "Top garment is worn UNTUCKED (hanging naturally outside the pants/skirt). ";
                        finalPrompt += "Full view of the hemline. ";
                        finalNegativePrompt += ", tucked in shirt, shirt inside pants, waistband visible, belt visible";
                    }

                    finalPrompt += "Dynamic professional fashion pose. ";
                    finalPrompt += "Model MUST MATCH THE IDENTITY OF THE 'Model' IMAGE. ";

                    // FRAMING LOGIC (Mutually Exclusive)
                    if (poseFocus === 'upper') {
                        finalPrompt += "CAMERA: MEDIUM SHOT, THIGH-UP FRAMING. Crop from mid-thigh to head. IGNORE LEGS/SHOES. ";
                        finalNegativePrompt += ", shoes, feet, full body, wide shot, far shot, boots, sneakers";
                    } else {
                        finalPrompt += "CAMERA: FULL BODY SHOT. Head-to-toe visibility. ";
                    }
                } else if (workflowType === 'lower') {
                    // TUCK STATE for lower workflow - based on user selection
                    if (tucked) {
                        finalPrompt += "Styling shot. Inner t-shirt is TUCKED INTO the pants. Waistband visible. ";
                    } else {
                        finalPrompt += "Styling shot. Inner t-shirt hangs LOOSE over pants waistband. Relaxed, casual look. ";
                    }

                    if (uploadedImages.top_front || uploadedImages.clothTopUpload) {
                        finalPrompt += "Wearing the provided upper garment. ";
                    }
                    finalPrompt += "Model identity must match the Model image. ";
                    finalPrompt += "FULL BODY shot. SHOW FULL PANTS. ";

                } else if (workflowType === 'dress' || workflowType === 'set') {
                    finalPrompt += "Full body styling shot. Dynamic pose. Model MUST MATCH THE IDENTITY OF THE 'Model' IMAGE. IGNORE FACE IN POSE REFERENCE. ";
                    // Full Body & Set Requirements: "hem tam boy hem de diz üzeri üst vücut"
                    // We can instruct the model to show full outfit clearly.
                    finalPrompt += "SHOW FULL LENGTH OF THE OUTFIT. DO NOT CROP FEET. ";
                    if (workflowType === 'set') finalPrompt += " MATCHING TOP AND BOTTOM SET. ";

                    // Specific logic for 'Outerwear (Heavy)' like coats in Full Body group
                    if (lowerName.includes("kaban") || lowerName.includes("palto") || lowerName.includes("trençkot") || lowerName.includes("coat")) {
                        finalPrompt += " WEARING LONG OUTERWEAR. ";
                    }
                }
            }

            // TECHNICAL ANGLES (Using logic from renderer.js Step 3, 4, 5)
            if (view !== 'styling') {
                // Common Tech base
                finalPrompt += "Technical Mannequin Style. ";

                // For Lower workflow, specific tuck-in logic for tech shots
                if (workflowType === 'lower') {
                    finalPrompt += "Model is wearing a simple WHITE BASIC T-SHIRT TUCKED IN (inside the waistband) to show product details. ";
                } else if (workflowType === 'upper') {
                    // Tech rules for Upper
                    // NEW PHASE 3 RULE: ALWAYS UNTUCKED for Upper Garments in 3-Angle View.
                    finalPrompt += "Top garment is worn UNTUCKED (hanging naturally outside the pants). ";
                    finalPrompt += "Full view of the hemline. ";

                    // Button Rule (Always Closed for Tech)
                    finalPrompt += buttonPrompt;

                    // Sleeve Rule
                    finalPrompt += sleeveTechRule;
                }

                if (view === 'front') {
                    finalPrompt += "Full Body FRONT view. Standing straight, arms at sides. " + techSuffix;
                } else if (view === 'side') {
                    finalPrompt += "Full Body SIDE profile view. " + techSuffix;
                    // Lower workflow side specific
                    if (workflowType === 'lower' && uploadedImages.backRefUpload) {
                        finalPrompt += " Use the Back reference image to define side/back pocket details. ";
                    }
                } else if (view === 'back') {
                    finalPrompt += "Full Body BACK view. " + techSuffix;
                    // Lower workflow back specific
                    if (workflowType === 'lower' && uploadedImages.backRefUpload) {
                        finalPrompt += " Use the Back reference image to match back pocket details and stitching EXACTLY. ";
                    }
                }
            }

            // POSE REF logic (Strictly for Styling usually, but if user wants Pose ref applied to Tech shots?? 
            // Usually Tech shots have standard poses "Arms at sides". 
            // If pose is provided, we only use it strictly for 'styling'.


            if (view === 'styling' && uploadedImages.pose) {
                finalPrompt += " POSE REFERENCE: Copy the body position from the uploaded pose image strictly. ";
                // Only add "Ignore Accessories" if pertinent
                finalPrompt += " IGNORE accessories (bags, hats) in the pose reference. ";
            }

            if (customPrompt) finalPrompt += ` ${customPrompt}`;

            // Override if user edited prompt (Phase 3)
            // But wait, Edited Prompt applies to WHICH view?
            // User edits ONE text. But we generate MULTIPLE views potentially.
            // If editedPrompt is provided, we should probably APPEND it to the logic, OR replace?
            // User said: "Ekleyeceğim prompt varolana ek olarak işlensin." -> Append.
            // So if `editedPrompt` comes, it MIGHT be the FULL prompt if frontend sent it back?
            // "prompt buna göre şekillensin" implies we might be editing the RESULT.
            // Let's assume `editedPrompt` is an APPEND string or full override.
            // If the user sends `editedPrompt` (array of strings mapped to views? or single string?)
            // Requirement: "Görsel oluşturmadan önce prompt kontrol ekranı olsun... Ekleyeceğim prompt varolana ek olarak işlensin."
            // So we treat `editedPrompt` as an EXTRA suffix if provided.
            if (editedPrompt) {
                finalPrompt += ` ${editedPrompt} `;
            }

            // --- ASSET FILTERING ---
            const activeAssets: string[] = [];
            // Model: Always include if available (except maybe back view if unknown? No, usually keep model consistent)
            if (uploadedImages.model) activeAssets.push(uploadedImages.model);

            // Product & Helper Assets Logic
            if (view === 'styling' || view === 'front') {
                // Use FRONT assets
                if (uploadedImages.main_product) activeAssets.push(uploadedImages.main_product);
                if (uploadedImages.top_front) activeAssets.push(uploadedImages.top_front);

                // ALWAYS include bottom_front if provided - user explicitly uploaded it
                // Even for 'upper' focus, user might want to see specific pants
                if (uploadedImages.bottom_front) activeAssets.push(uploadedImages.bottom_front);

                // Shoes only for full body focus
                if (poseFocus === 'full' || workflowType === 'lower' || workflowType === 'dress' || workflowType === 'set') {
                    if (uploadedImages.shoes) activeAssets.push(uploadedImages.shoes);
                }
            }
            else if (view === 'side') {
                // Side uses Front assets mostly, but maybe back ref if allowed? 
                // renderer.js uses front assets for side too mostly.
                if (uploadedImages.main_product) activeAssets.push(uploadedImages.main_product);
                if (uploadedImages.top_front) activeAssets.push(uploadedImages.top_front);
                if (uploadedImages.bottom_front) activeAssets.push(uploadedImages.bottom_front);

                // Add back ref for side?
                if (uploadedImages.backRefUpload) activeAssets.push(uploadedImages.backRefUpload);
            }
            else if (view === 'back') {
                // Use BACK assets
                // If Back product exists, use it. If not, fallback to main/front??
                // Ideally use specific back uploads if available.

                // DETAIL 2 ENFORCEMENT for Back View
                if (uploadedImages.detail_2) {
                    finalPrompt += " BACK DETAIL: Apply the provided Detail 2 image (Label/Logo/Tag) to the back of the garment. Place it realistically (e.g. waistband label for jeans, or neck label). ";
                }

                let hasBackAsset = false;
                if (uploadedImages.top_back) { activeAssets.push(uploadedImages.top_back); hasBackAsset = true; }
                if (uploadedImages.bottom_back) { activeAssets.push(uploadedImages.bottom_back); hasBackAsset = true; }
                if (uploadedImages.backRefUpload) { activeAssets.push(uploadedImages.backRefUpload); hasBackAsset = true; }

                // Fallback: If no back asset, use front? 
                if (!hasBackAsset) {
                    if (uploadedImages.main_product) activeAssets.push(uploadedImages.main_product);
                }
            }

            // Common
            if (uploadedImages.background) activeAssets.push(uploadedImages.background);
            if (uploadedImages.inner_wear) activeAssets.push(uploadedImages.inner_wear);

            // Allow shoes IF full body (already handled in styling/front logic above, but for side/back/common?)
            // If view is side/back, we generally want full body so include shoes unless Upper Focus?
            if (view !== 'styling' && view !== 'front') {
                // Side/Back tech shots are usually full body.
                // But if Upper Focus logic applies to Style, what about Tech?
                // Tech is usually Full Body.
                if (uploadedImages.shoes) activeAssets.push(uploadedImages.shoes);
            }

            // For SET workflow, we likely need both top/bottom assets if provided
            if (workflowType === 'set') {
                if (uploadedImages.top_front) activeAssets.push(uploadedImages.top_front);
                if (uploadedImages.bottom_front) activeAssets.push(uploadedImages.bottom_front);
            }
            if (uploadedImages.inner_wear) activeAssets.push(uploadedImages.inner_wear); // NEW: Include inner wear

            // Accessories: Strict View Filtering
            // "Üst vücut seçtiğimde... ayakkabıyı dahil etmemeli... arka açıları göndermemeli"
            // We already handled shoes/bottoms.
            // Now handle others: Bag, Glasses, Jewelry.
            // If Upper Focus, Bag usually hidden or irrelevant? Keep if user uploaded.
            // BUT Back view -> Hide Bag/Glasses/Jewelry usually?
            if (view === 'styling' || view === 'front' || view === 'side') {
                if (uploadedImages.glasses) activeAssets.push(uploadedImages.glasses);
                if (uploadedImages.bag) activeAssets.push(uploadedImages.bag);
                if (uploadedImages.jewelry) activeAssets.push(uploadedImages.jewelry);
            }
            // Back View -> Generally accessories like glasses/bag are not visible or distracting.
            // Jewelry (Necklace) might be visible if backless? Keep simple: Exclude for back.
            if (uploadedImages.hat) activeAssets.push(uploadedImages.hat);
            if (uploadedImages.jacket) activeAssets.push(uploadedImages.jacket);
            if (uploadedImages.belt && includeBelt) activeAssets.push(uploadedImages.belt); // Include Belt only if visible

            // NOTE: detail_1, detail_2, and fit_pattern are NOT included as assets
            // They are only used for ANALYSIS - their descriptions are already in the prompt
            // This reduces payload size significantly

            // Log asset count for debugging
            console.log(`Asset count for ${view}: ${activeAssets.length}`);
            if (activeAssets.length > 8) {
                console.warn(`WARNING: High asset count (${activeAssets.length}). Consider reducing.`);
            }

            return { prompt: finalPrompt, negative_prompt: finalNegativePrompt, input_images: activeAssets };
        };

        // --- GENERATION HELPER ---
        const generateOne = async (view: 'styling' | 'front' | 'side' | 'back') => {
            const reqData = buildRequestForView(view);
            console.log(`\n=== SENT PROMPT (${view.toUpperCase()}) ===\n${reqData.prompt}\n==============================\n`);

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
                seed: requestSeed, // Enforce consistency
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


        // --- PREVIEW MODE (DISABLED AS REQUESTED, but logic remains if needed later) ---
        if (preview && !isAngles) {
            const reqData = buildRequestForView('styling');
            return NextResponse.json({
                status: "preview",
                previews: [{
                    prompt: reqData.prompt,
                    assets: reqData.input_images,
                    settings: {
                        resolution,
                        aspect_ratio: aspectRatio
                    }
                }]
            });
        }

        // --- EXECUTION ---
        let results: string[] = [];

        if (isAngles) {
            // Generate Front, Side, Back in parallel
            const [frontUrl, sideUrl, backUrl] = await Promise.all([
                generateOne('front'),
                generateOne('side'),
                generateOne('back')
            ]);
            results = [frontUrl, sideUrl, backUrl].filter(Boolean);
        } else {
            // Standard Styling Shot
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
