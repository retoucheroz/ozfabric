import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
        }

        const body = await req.json();
        const { image, language, type = 'techPack' } = body; // type: 'techPack' | 'pose'

        if (!image) {
            return NextResponse.json({ error: "Image is required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Prioritize Gemini 1.5 Pro for TechPack (Fabric Details) as requested for better texture analysis
        // Prioritize Gemini 2.0 Flash for Pose (Speed/Spatial reasoning)
        let modelsToTry = [
            "gemini-2.0-flash",
            "gemini-1.5-pro",
            "gemini-1.5-flash"
        ];

        if (type === 'techPack' || type === 'pose') {
            // User Request: Use 1.5 Pro for BOTH Fabric & Pose Analysis for max fidelity
            modelsToTry = [
                "gemini-1.5-pro",
                "gemini-2.0-flash",
                "gemini-2.0-flash-exp"
            ];
        } else {
            // Fallback
            modelsToTry = [
                "gemini-2.0-flash",
                "gemini-1.5-flash",
                "gemini-1.5-pro"
            ];
        }

        let analysis = null;
        let usedModel = "";
        const errors: string[] = [];

        // Helper to extract base64
        let base64Data = image;
        let mimeType = "image/png";

        if (image.includes(",")) {
            const parts = image.split(",");
            const match = parts[0].match(/:(.*?);/);
            if (match) mimeType = match[1];
            base64Data = parts[1];
        }

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json" },
                    // Critical: Disable safety filters to prevent blocking fashion images
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    ]
                });

                // FORCE ENGLISH for TechPack, Fit AND POSE analysis regardless of UI language. 
                // All AI prompts must be in English for best adherence.
                const langInstruction = (type === 'techPack' || type === 'fit' || type === 'pose')
                    ? "RESPOND IN ENGLISH ONLY. TECHNICAL FASHION TERMINOLOGY."
                    : (language === "tr" ? "RESPOND IN TURKISH. Translate Technical Terms to professional Turkish fashion terminology." : "Respond in English.");

                let prompt = "";

                if (type === 'pose') {
                    prompt = `${langInstruction} You are an expert Fashion Pose Director for AI Image Generation.
                    Your task is to describe the pose in this image with EXTREME PRECISION so that an AI can replicate it EXACTLY without seeing the image.
                    
                    ANALYZE THESE SPECIFIC POINTS:
                    1. HEAD & EYES: Exact head tilt and facing direction. Where are eyes looking?
                    2. SHOULDERS & TORSO: Body angle relative to camera (front, 3/4, side). Leaning forward/back? Shoulders lifted or relaxed?
                    3. ARMS & HANDS (CRITICAL): Precise position of EACH arm. Elbow bend angles. Hand gestures (in pockets, crossed, holding object, touching face).
                    4. LEGS & FEET: Stance width. Weight distribution (on which leg?). Knee bends. Crossed legs?
                    5. MOVEMENT: Is it static or dynamic (walking, running, jumping)?
                    
                    OUTPUT REQUIREMENTS:
                    - Create a dense, instructional paragraph starting with "Model is...".
                    - Use anatomical terms if helpful (e.g. "hands akimbo").
                    - DISREGARD clothing details. Focus ONLY on biomechanics and posture.
                    
                    JSON Response Format:
                    {
                        "description": "Full detailed instructional prompt describing the pose."
                    }`;
                } else {
                    // TECH PACK MODE - Fabric & Detail Analysis
                    prompt = `${langInstruction} You are a Textile Expert analyzing fabric details for AI image generation.

                    ANALYZE THIS FABRIC/GARMENT IMAGE:
                    
                    1. FABRIC TYPE: What is the main material? (Cotton, Linen, Denim, Polyester, Wool, etc.)
                    2. TEXTURE: How does it feel? (Smooth, Rough, Soft, Crisp, Textured, Puckered, etc.)
                    3. PATTERN: What pattern does it have? (Solid, Striped, Checkered, Printed, etc.)
                       - IF CHECKED/STRIPED: Describe direction, width, colors.
                       - IF SOLID: State "Solid color".
                    4. COLOR: What are the exact colors? Be specific.
                    5. SURFACE FINISH: How does light interact? (Matte, Shiny, Semi-gloss, etc.)
                    6. SPECIAL FEATURES: Any unique details? (Visible stitching, logo, buttons, texture variation)
                    7. CLOSURE TYPE: Does this garment have BUTTONS, ZIPPER, or NO CLOSURE (pullover/open)?

                    OUTPUT a clean, prompt-ready description.
                    
                    EXAMPLE OUTPUT (FORMAT REFERENCE ONLY - DO NOT COPY CONTENT):
                    "Medium-wash indigo denim fabric with subtle cross-hatch texture. Solid blue color with natural fading at seams. Heavyweight cotton twill weave. Matte finish with contrast orange stitching."
                    
                    JSON Response:
                    {
                        "visualPrompt": "Clean, detailed fabric description as shown in example (ONE paragraph, DESCRIBE ACTUAL IMAGE ONLY)",
                        "productName": "Generic English Product Name (NO BRANDS)",
                        "fabric": {
                            "main": "Primary fabric type",
                            "finish": "Surface finish"
                        },
                        "pattern": "Pattern description",
                        "colors": "Color description",
                        "closureType": "buttons OR zipper OR none"
                    }`;
                }

                // FIT/PATTERN ANALYSIS for ALL GARMENTS - shirts, jackets, pants, etc.
                if (type === 'fit') {
                    prompt = `${langInstruction} You are an EXPERT Garment Pattern & Fit Analyst. Your analysis will be used to recreate this EXACT fit in AI image generation. BE EXTREMELY PRECISE about silhouette details.

                    FIRST: Identify the garment type:
                    - Is it a TOP (shirt, blouse, t-shirt, sweater, jacket, coat)?
                    - Is it a BOTTOM (pants, jeans, trousers, shorts, skirt)?

                    FOR TOP GARMENTS (Shirt/Jacket/Coat/Sweater):
                    1. FIT TYPE: Slim-fit, Regular-fit, Relaxed-fit, Oversized
                    2. SHOULDER: Natural shoulder, Dropped shoulder, Structured shoulder
                    3. CHEST/BODY: Fitted, Comfortable, Loose, Boxy
                    4. SLEEVE LENGTH: Short, 3/4, Long
                    5. SLEEVE FIT: Fitted, Regular, Wide
                    6. HEM LENGTH: Cropped, Hip-length, Mid-thigh, Long
                    7. COLLAR/NECKLINE TYPE: Point collar, Spread collar, Mandarin, V-neck, Crew, etc.
                    8. CLOSURE: Button-front, Zip, Pullover

                    FOR BOTTOM GARMENTS (Pants/Jeans/Shorts) - BE EXTREMELY DETAILED:
                    1. FIT TYPE: Skinny, Slim, Slim-tapered, Regular/Straight, Relaxed, Wide-leg, Bootcut, Mom-fit, Baggy, Oversized-Baggy, Tapered-Leg, High-Waisted, High-Waisted-Baggy, High-Waisted-Tapered
                    2. RISE: Low-rise, Mid-rise, High-rise, Extreme High-rise (waistband position relative to navel)
                    3. HEM LENGTH (CRITICAL FOR NANO BANANA): 
                       - Floor-length: Touching the floor, covering shoes.
                       - Full-length: Hitting the floor but not pooling.
                       - Ankle-length: Precise hit at the ankle bone.
                       - Cropped: 2-4 inches above the ankle.
                       - Culotte: Mid-calf.
                    4. THIGH FIT (CRITICAL): 
                       - Is it TIGHT against the thigh (like leggings)?
                       - FITTED (follows shape but not tight)?
                       - COMFORTABLE (some room)?
                       - LOOSE/RELAXED (visible ease)?
                       - VERY LOOSE (baggy at thigh)?
                    5. KNEE AREA: Does the pant fit snug at knee, or is there room?
                    6. LEG SHAPE & TAPER (VERY CRITICAL):
                       - STRAIGHT: Same width from thigh to ankle, NO taper.
                       - TAPERED: Where does taper BEGIN? (From hip? From knee? From mid-calf?)
                       - How MUCH taper? (Minor 10%, Moderate 25%, Significant 40%+)
                    7. LEG OPENING / ANKLE (CRITICAL):
                       - VERY NARROW (skinny, less than 14cm)
                       - NARROW (slim, 14-16cm)
                       - STANDARD (regular, 17-19cm)
                       - WIDE (relaxed, 20-22cm)
                       - VERY WIDE (wide-leg, 23cm+)
                    8. FABRIC BEHAVIOR: Does it STACK at the ankle? Puddle on the floor? Bunches at knee? Clean straight lines?
                    9. OVERALL PROPORTION: How does the garment relate to body proportions in the image?
                    
                    CRITICAL: If the pants appear WIDER or LOOSER than typical slim-fit jeans, EXPLICITLY STATE THIS. If they are NARROWER or TIGHTER than typical straight-leg, STATE THIS. Use combinations like "High-Waisted Baggy Tapered-Leg".

                    OUTPUT: Generate a PRECISE, PROMPT-READY fit description. Include ALL relevant details.

                    Examples:
                    - Shirt: "Regular-fit cotton shirt with natural shoulders, comfortable body fit, long sleeves with standard cuff. Point collar. Hip-length hem."
                    - Baggy Pants: "Extreme High-Waisted Baggy Tapered-Leg pants. Loose thigh fit, significant taper beginning from the knee. Narrow leg opening at the ankle. Floor-length hem with slight pooling/stacking."
                    - Regular Straight: "Mid-rise regular straight-leg jeans. Comfortable thigh fit, NO taper, consistent width from thigh to ankle. Standard leg opening. Full-length hem hitting the top of the shoes."

                    JSON Response:
                    {
                        "fitDescription": "Complete prompt-ready fit description with ALL silhouette details",
                        "garmentType": "Top / Bottom",
                        "fitType": "Specific combination (e.g., High-Waisted Baggy Tapered-Leg)",
                        "keyFeatures": "Most important silhouette characteristics",
                        "silhouetteNotes": "Additional visual notes for AI reproduction - include WHERE garment is tight vs loose",
                        "proportionNotes": "How the garment appears relative to body - is it WIDER or NARROWER than typical? Be explicit about lengths."
                    }`;
                }

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType
                        }
                    }
                ]);

                let responseText = result.response.text();
                responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

                if (type === 'pose') {
                    analysis = { description: responseText }; // Wrap plain text in object
                } else {
                    analysis = JSON.parse(responseText);
                }
                usedModel = modelName;
                break; // Success

            } catch (error) {
                console.warn(`Model ${modelName} failed:`, (error as Error).message);
                errors.push((error as Error).message);
            }
        }

        if (!analysis) {
            console.error("All models failed:", errors);
            // Return detailed error so user knows if it's Quota or API Key issue
            return NextResponse.json({ error: "Analysis failed. Details: " + errors.join(" | "), details: errors }, { status: 500 });
        }

        return NextResponse.json({
            status: "success",
            data: analysis,
            modelUsed: usedModel
        });

    } catch (error) {
        console.error("Analysis API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
