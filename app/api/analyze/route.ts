import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const ANALYZE_COST = 20;
        if ((user.credits || 0) < ANALYZE_COST) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
        }

        // Deduct credits
        await deductCredits(user.id, ANALYZE_COST, "Analyze");

        const body = await req.json();
        const { image, images, language, type = 'techPack', workflowType, productName } = body; // type: 'techPack' | 'pose'

        if (!image && (!images || !Array.isArray(images) || images.length === 0)) {
            return NextResponse.json({ error: "Image or images array required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Prioritize Gemini 2.5/2.0 for all analysis tasks
        let modelsToTry = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest"
        ];

        if (type === 'techPack' || type === 'fabric' || type === 'fit' || type === 'pose') {
            modelsToTry = [
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-flash-latest"
            ];
        }

        let analysis = null;
        let usedModel = "";
        const errors: string[] = [];

        // Pre-process images
        const { getAbsoluteUrl } = await import("@/lib/s3");
        const inputImages = images && Array.isArray(images) ? images : [image];
        const processedImages = await Promise.all(inputImages.map(async (img: string) => {
            let base64Data = img;
            let mimeType = "image/png";

            if (img.startsWith("http") || img.startsWith("/")) {
                const absoluteUrl = getAbsoluteUrl(img);
                try {
                    const response = await fetch(absoluteUrl);
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        base64Data = Buffer.from(arrayBuffer).toString('base64');
                        mimeType = response.headers.get("content-type") || "image/png";
                    }
                } catch (e) {
                    console.error("Failed to fetch image for analysis:", absoluteUrl, e);
                }
            } else if (img.includes(",")) {
                const parts = img.split(",");
                const match = parts[0].match(/:(.*?);/);
                if (match) mimeType = match[1];
                base64Data = parts[1];
            }

            return {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };
        }));

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: type === 'pose' ? "text/plain" : "application/json" },
                    // Critical: Disable safety filters to prevent blocking fashion images
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    ]
                });

                // FORCE ENGLISH for TechPack, Fabric, Fit AND POSE analysis regardless of UI language. 
                // All AI prompts must be in English for best adherence.
                const langInstruction = (type === 'techPack' || type === 'fabric' || type === 'fit' || type === 'pose')
                    ? "RESPOND IN ENGLISH ONLY. TECHNICAL FASHION TERMINOLOGY."
                    : (language === "tr" ? "RESPOND IN TURKISH. Translate Technical Terms to professional Turkish fashion terminology." : "Respond in English.");

                let prompt = "";
                const multiImageContext = processedImages.length > 1 ? "You are shown multiple images of the same garment (front, back, details). Analyze them collectively for a single accurate description." : "";


                if (type === 'pose') {
                    prompt = `${langInstruction}
# POSE & FRAMING ANALYSIS ROBOT v3

**CRITICAL INSTRUCTION:** YOU MUST RESPOND WITH THE FOLLOWING EXACT TAGGED STRUCTURE. EACH SECTION IS MANDATORY. 
USE NARRATIVE PARAGRAPHS ONLY. NO LISTS. NO BULLETS. RESPOND IN ENGLISH.

---

### OUTPUT FORMAT (MANDATORY)

[POSE]
(Detailed narrative paragraph about body position, weight shift, and limb arrangement)
[/POSE]

[CAMERA]
(Narrative paragraph about camera height, angle, and lens perspective effect)
[/CAMERA]

[FRAMING]
(Narrative paragraph about shot type and exact crop boundaries)
[/FRAMING]

[FRAME_PLACEMENT]
(Narrative paragraph about model's 2D position in the frame and negative space)
[/FRAME_PLACEMENT]

[EXPRESSION_GAZE]
(Narrative paragraph about facial expression, gaze direction, and head tilt)
[/EXPRESSION_GAZE]

[PROP_INTERACTION]
(Narrative paragraph about interaction with furniture/walls. If none, write "The model stands in open space with no physical prop interaction.")
[/PROP_INTERACTION]

---

### SCOPE & RULES
This is for **Styling/Editorial** shots only. Reconstruction must be pixel-perfect in spatial arrangement.

**SECTION 1: [POSE]**
- Start with archetype (Contrapposto, Weight-shifted, Editorial lean).
- **MANDATORY LATERALITY:** Always specify "left arm," "right knee," etc.
- **TORSO ROTATION:** Describe direction and approximate degree (e.g., "torso rotated 30 degrees to camera-right").
- No clothing or physical features. Relational descriptions only.

**SECTION 2: [CAMERA]**
- Describe height: Low (worm's eye), Slight low (waist level), Eye level, High.
- Describe angle: Frontal, 3/4 angle, Profile.
- Describe Lens Effect: Compressed/Telephoto feel, Natural, or Wide/Exaggerated perspective. No focal lengths.

**SECTION 3: [FRAMING]**
- Vocabulary: Close-up, Bust shot, MCU, Cowboy, Medium, Full Body.
- Crop: Specify exactly where the frame cuts (e.g., "cuts at mid-thigh," "head fully visible with 10% headroom").

**SECTION 4: [FRAME_PLACEMENT]**
- Horizontal: Dead center, Offset left, Offset right.
- Ratio: How much % of frame model occupies.
- Negative Space: Distribution of empty space.

**SECTION 5: [EXPRESSION_GAZE]**
- Gaze: Direct to lens, Past camera, Away, Downward.
- Expression: Use physical descriptions (e.g., "parted lips," "relaxed jaw") instead of moods.

**SECTION 6: [PROP_INTERACTION]**
- Describe contact with furniture, walls, or floors.
- Describe weight distribution on the object.

---

### FINAL CHECK BEFORE OUTPUT:
1. Did I use all 6 tags?
2. Is it in narrative paragraph form?
3. Did I specify Left/Right for everything?
4. Is it technical fashion terminology?
`;
                } else if (type === 'background') {
                    prompt = `${langInstruction} ${multiImageContext}
                    You are an expert location scout and set designer.
                    Analyze the given background environment image. Ignore any people in the foreground.
                    Describe the setting, lighting, atmosphere, time of day, architecture, nature, color palette, and textures explicitly in a single highly detailed prompt. 
                    CRITICAL: This prompt will be the primary source for the visual style, color harmony, and lighting of the entire generation. Capturing the precise color vibe is essential as the product analysis will be color-neutral.
                    
                    JSON Response Format:
                    {
                        "prompt": "[Your highly detailed background prompt]"
                    }`;
                } else {
                    // TECH PACK MODE - Comprehensive Technical Analysis
                    const workflowStr = workflowType || 'upper';
                    const productNameContext = productName ? `CRITICAL RULE: The user is analyzing a specific product: "${productName}". 
                    - Your task is to describe ONLY the "${productName}". 
                    - ABSOLUTELY IGNORE any other garments visible in the image (e.g. if you are analyzing pants, ignore the shirt; if you are analyzing a jacket, ignore the inner t-shirt).
                    - If the user explicitly mentions "${productName}" and it is a ${workflowStr} product, DO NOT provide descriptions for any other category.
                    - If the image contains a full outfit, focus 100% of your technical analysis on the ${productName}.`
                        : `CRITICAL RULE: Focus EXCLUSIVELY on the main garment (the ${workflowStr} piece). DO NOT describe base layers, innerwear, pants, or footwear unless they are the product being analyzed.`;

                    prompt = `${langInstruction} ${multiImageContext} You are a Senior Textile Engineer and Technical Designer. 
                    Analyze the garment in the image(s) to create a professional Technical Specification (Tech Pack).
                    
                    CRITICAL GLOBAL RULE: All text descriptions (productName, visualPrompt, innerBrief, upperBrief, lowerBrief, shoesBrief) MUST BE COLOR-NEUTRAL. DO NOT include color names (e.g., 'blue', 'red', 'navy') in these specific fields. Focus strictly on texture, fabric properties, construction, and fit. This is essential so the AI generation can adapt to the reference image context without color conflict.
                    
                    ${productNameContext}
                    
                    The analysis must be EXTREMELY PRECISE for manufacturing. 
                    
                    FIELD REQUIREMENTS:
                    - "productName": Concise English corporate name. CRITICAL: DO NOT include any color names in the product name.
                    - "sku": Generate a realistic SKU (e.g., OZ-2024-XP-01).
                    - "category": Garment category (e.g., Mens Outwear, Womens Denim).
                    - "fabric": Detailed main material analysis.
                    - "measurements": Provide at least 5 key measurement points (POM) for a sample size 36 (small).
                    - "colors": Extract 2-3 primary colors with precise HEX codes and matching PANTONE numbers.
                    - "constructionDetails": List 4-5 specific manufacturing assembly notes (seams, stitches, hardware).
                    
                    JSON Response Structure:
                    {
                        "productName": "...",
                        "sku": "...",
                        "category": "...",
                        "visualPrompt": "One paragraph highly detailed technical script focusing EXCLUSIVELY on the target garment's fabric, construction, texture, and fit. CRITICAL: If you are analyzing pants, DO NOT describe the shirt. Describe only its shape, material properties, and design details. This allows the reference image and lighting to define the final color palette.",
                        "innerBrief": "Detailed description of the inner layer (like a sweater, t-shirt) if present.",
                        "upperBrief": "Detailed description of the upper garment (like a coat or jacket) if present.",
                        "lowerBrief": "Detailed description of the lower garment (like pants/skirt) if present.",
                        "shoesBrief": "Detailed description of the shoes if present.",
                        "fit": "Specific fit description (e.g., Oversized Boxy Fit)",
                        "fitDescription": "Detailed explanation of the silhouette.",
                        "fabric": {
                            "main": "Primary material name",
                            "composition": "Percentage breakdown (e.g., 98% Cotton 2% Elastane)",
                            "weight": "GSM or oz (e.g., 320 GSM / 11.5 oz)",
                            "finish": "Fabric treatment (e.g., Enzyme Wash, Silicone Finish)"
                        },
                        "measurements": {
                            "points": [
                                { "label": "Chest Width", "value": "52" },
                                { "label": "Body Length", "value": "68" }
                            ]
                        },
                        "colors": [
                            { "name": "Raw Indigo", "hex": "#1A237E", "pantone": "19-4025 TCX" }
                        ],
                        "constructionDetails": [
                            "Twin needle topstitching on seams",
                            "Nickel-free copper rivets at stress points"
                        ],
                        "designNotes": "General aesthetic and functional overview.",
                        "closureType": "buttons OR zipper OR none",
                        "pattern": "Solid / Striped / etc."
                    }`;
                }

                // FIT/PATTERN ANALYSIS for ALL GARMENTS - shirts, jackets, pants, etc.
                if (type === 'fit') {
                    prompt = `${langInstruction} ${multiImageContext} You are an EXPERT Garment Pattern & Fit Analyst. Your analysis will be used to recreate this EXACT fit in AI image generation. BE EXTREMELY PRECISE about silhouette details.

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
                    ...processedImages
                ]);

                let responseText = result.response.text();
                responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

                if (type === 'pose') {
                    analysis = { description: responseText.trim() };
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
