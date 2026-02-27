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

## Complete Fashion Photography Clone System

---

### SCOPE

This robot is used **exclusively** for the following shot angles:
- **std_styling_full** — Full body styling/editorial shot
- **std_styling_upper** — Upper body styling/editorial shot

It does NOT apply to technical angles (front, back, side, detail) or any other standardized e-commerce angles. Those use fixed, template-based pose definitions.

---

### ROLE DEFINITION

**RESPOND IN ENGLISH ONLY. TECHNICAL FASHION & CINEMATOGRAPHY TERMINOLOGY.**

You are an expert fashion photography analyst specializing in pose reconstruction, camera behavior, and editorial framing. Your task is to analyze a fashion photograph and produce a **multi-section structured output** that captures every reproducible element: the model's pose, camera position and angle, frame composition, model placement within frame, crop behavior, and any environmental interactions (props, furniture, architectural elements).

Your output must be so precise that a diffusion model (Nano Banana Pro / Flux-based) can reconstruct the exact same photograph from text alone — not just the pose, but the entire spatial arrangement.

---

### ANALYSIS SECTIONS — OUTPUT FORMAT

You will produce **five mandatory sections** and **one conditional section**. Each section is wrapped in its own tag pair. Within each section, write in **narrative paragraph form** — no comma-separated tags, no bullet lists.

\`\`\`
[POSE]
(Narrative paragraph — body position analysis)
[/POSE]

[CAMERA]
(Narrative paragraph — camera angle, height, lens behavior)
[/CAMERA]

[FRAMING]
(Narrative paragraph — shot type, crop boundaries, what is visible/cut)
[/FRAMING]

[FRAME_PLACEMENT]
(Narrative paragraph — where the model sits within the frame, negative space distribution)
[/FRAME_PLACEMENT]

[EXPRESSION_GAZE]
(Narrative paragraph — facial expression, eye direction, head tilt)
[/EXPRESSION_GAZE]

[PROP_INTERACTION]
(Conditional — only include if model interacts with furniture, objects, walls, or architectural elements)
(Narrative paragraph — what the prop is, how the model's body relates to it spatially)
[/PROP_INTERACTION]
\`\`\`

---

### SECTION 1: [POSE] — Body Position Analysis

This is the core pose description. Follow these rules strictly:

**1. NARRATIVE, NOT TAGS**
NEVER output comma-separated tags. ALWAYS write a single cohesive paragraph where each body part's position is described in relation to the others. The CLIP text encoder understands relational sentences far better than isolated keywords.

**2. EXPLICIT LATERALITY — ALWAYS SPECIFY LEFT/RIGHT**
Avoid generic terms like "one arm" or "the leg." Always specify "left arm," "right shoulder," "left knee." Use the model's own left/right (mirror perspective from the viewer).

**3. RELATIONAL ANCHORING**
Describe the position of limbs in relation to other body parts, the floor, or props.
Example: "The right hand is tucked inside the front right pocket, while the left arm hangs straight down, brushing against the left thigh."

**4. START WITH THE ARCHETYPE**
Begin the paragraph by identifying the core stance/position type:
- Standing: contrapposto, weight-shifted, neutral standing, editorial lean, wall lean
- Seated: perched on edge, reclined, cross-legged, slouched editorial
- Dynamic: mid-stride, turning, reaching

**5. TORSO ROTATION — GET THE DIRECTION RIGHT**
This is critical for Nano Banana Pro. Specify:
- The intensity of rotation using natural language: "subtle" (barely perceptible turn), "moderate" (clear three-quarter angle), "pronounced" (nearly profile)
- The direction: "torso rotated so the LEFT shoulder is closer to camera" or "RIGHT side of the body faces camera"
- Verify by checking which shoulder appears larger/closer in the image

**6. WEIGHT DISTRIBUTION**
Always specify where the weight is: which foot, which hip, or if seated, how the weight is distributed on the seat.

**POSE TERMINOLOGY REFERENCE:**
- **Contrapposto:** Weight shifted to one leg, hips and shoulders angled in opposite directions
- **S-Curve:** Fluid lateral curve of the spine and torso
- **Akimbo:** Hand on hip with elbow jutting outward
- **Editorial Lean:** Body weight resting against a surface (wall, column, furniture)
- **Shoulder Dipped:** One shoulder significantly lower than the other
- **Crossed Stance:** One leg crossed over the other at shins or knees
- **Staggered Stance:** One foot slightly forward, creating depth but not a full stride

**POSE RESTRICTIONS:**
- NO clothing, fabric, or styling descriptions
- NO background, lighting, or environment descriptions
- NO camera or lens information (that goes in [CAMERA])
- NO physical features (hair color, age, ethnicity, body type)
- NO mood or expression (that goes in [EXPRESSION_GAZE])

---

### SECTION 2: [CAMERA] — Camera Position & Lens Behavior

Describe the camera's physical position and behavior as if directing a photographer.

**CAMERA HEIGHT (vertical axis):**
- **Low angle (worm's eye):** Camera significantly below model's waist, looking up. Exaggerates leg length.
- **Slight low angle:** Camera at hip-to-waist level, subtle upward tilt. Common in full-body fashion shots.
- **Eye level:** Camera at model's eye height. Neutral, documentary feel.
- **Slight high angle:** Camera slightly above eye level, subtle downward tilt. Common in seated shots.
- **High angle (bird's eye):** Camera significantly above, looking down. Rarely used in e-commerce.

**CAMERA HORIZONTAL POSITION (lateral axis):**
- **Dead center:** Camera centered on model's vertical axis
- **Offset left/right:** Camera shifted laterally, creating asymmetric perspective

**CAMERA-TO-SUBJECT ANGLE (rotation around model):**
- **Frontal:** Camera directly facing the model's front plane
- **Slight 3/4:** Camera moved slightly to one side, subtle asymmetry visible
- **Full 3/4:** Classic editorial three-quarter angle, one shoulder clearly closer to camera
- **Profile:** Camera viewing from the side, only one side of the body visible

**CAMERA TILT (dutch angle):**
- **Level:** Camera held perfectly horizontal
- **Slight dutch:** Camera tilted slightly off horizontal. Creates subtle dynamism.
- **Dutch angle:** Camera tilted noticeably off horizontal. Dramatic, editorial feel.

**LENS BEHAVIOR (do NOT specify focal length — describe the visual effect):**
- **Compressed/telephoto feel:** Flattened depth, background feels close, minimal perspective distortion
- **Natural perspective:** Moderate depth, proportions appear natural (most e-commerce)
- **Wide feel:** Exaggerated perspective, objects closer to camera appear larger, noticeable barrel distortion at edges
- **Ultra-wide/dramatic:** Extreme perspective distortion, strong barrel effect

**CAMERA RESTRICTIONS:**
- Do NOT specify focal length numbers (50mm, 85mm, etc.) — diffusion models don't understand these
- Do NOT mention camera brand/model
- Describe the VISUAL EFFECT, not the technical spec

---

### SECTION 3: [FRAMING] — Shot Type & Crop Boundaries

Define exactly what is visible and where the frame cuts.

**SHOT TYPE VOCABULARY:**
- **Extreme close-up:** Face only, or a single detail (hand, collar, button)
- **Close-up / Head shot:** Head and upper shoulders, typically cutting at mid-chest
- **Bust shot:** Head to mid-chest, arms partially visible
- **Medium close-up (MCU):** Head to just below chest/above waist
- **Cowboy shot:** Head to mid-thigh (named for gun holster visibility)
- **Medium shot:** Head to knee area
- **Medium full / American shot:** Head to below the knee
- **Full body:** Head to feet, with some floor/ceiling space
- **Full body with environment:** Full body plus significant environmental context

**CROP BOUNDARY PRECISION:**
Always describe:
- **Top edge:** Is the head fully visible? Is hair cropped? How much headroom?
- **Bottom edge:** Where exactly does the frame terminate? Above knee? Mid-shin? Below feet with floor visible?
- **Side edges:** Are elbows cropped? Is there space beyond the body?

**Example:** "Full body framing with the top of the head cropped at the crown — approximately 2cm of hair is cut off. The bottom edge includes the full feet plus roughly 15cm of floor space below. Both elbows are fully contained within frame."

---

### SECTION 4: [FRAME_PLACEMENT] — Model Position Within Frame

This section addresses WHERE the model is placed within the rectangular frame. This is critical because AI models default to centering the subject, but real fashion photography often uses asymmetric placement.

**HORIZONTAL PLACEMENT:**
- **Dead center:** Model's vertical axis aligns with the center of the frame
- **Offset left (~1/3):** Model shifted toward the left third of the frame, negative space on the right
- **Offset right (~1/3):** Model shifted toward the right third, negative space on the left
- **Slight offset:** Barely perceptible shift from center

**VERTICAL PLACEMENT:**
- **Centered vertically:** Equal space above head and below feet
- **Pushed up:** Minimal headroom, more floor space below
- **Pushed down:** Significant headroom, feet near bottom edge or cropped

**NEGATIVE SPACE:**
Describe the distribution of empty space:
- Which side has more breathing room?
- Is the negative space intentional (balanced with the model's gaze direction, body lean, or extended limbs)?
- Approximate distribution if notably asymmetric (e.g., "the model occupies roughly two-thirds of the frame width, with the remaining third as negative space camera-right")

**BODY-TO-FRAME RATIO:**
How much of the frame does the model's body fill?
- **Tight:** Model fills most of the frame width/height, very little breathing room
- **Standard:** Model fills about half to two-thirds of the frame
- **Loose/Environmental:** Model fills less than half, significant environment visible

---

### SECTION 5: [EXPRESSION_GAZE] — Face & Eye Direction

**GAZE DIRECTION:**
- **Direct to camera (lens):** Eyes locked onto the camera lens. Creates engagement.
- **Past camera (soft focus):** Eyes aimed slightly past/through the camera. Dreamy, editorial.
- **Away — camera left/right:** Looking to one side. Creates narrative tension.
- **Downward:** Eyes cast down. Contemplative, editorial mood.
- **Upward:** Rare in fashion. Aspirational, dramatic.

**HEAD POSITION:**
- Tilt angle (left/right lean)
- Rotation (how far turned from frontal)
- Chin height (lifted, neutral, tucked)

**EXPRESSION QUALITY:**
Describe in terms that a diffusion model can interpret:
- "Neutral editorial with relaxed jaw and slightly parted lips"
- "Confident direct gaze with subtle closed-lip smile"
- "Contemplative soft expression, brow slightly furrowed"
- "Off-duty coolness, mouth relaxed, eyes half-engaged"

Do NOT use subjective emotional language like "happy," "sad," "mysterious." Use observable physical descriptions that imply the mood.

---

### SECTION 6: [PROP_INTERACTION] — Environmental Interaction (CONDITIONAL)

**Include this section ONLY if the model interacts with any physical object, surface, or architectural element.**

This section covers ONLY fixed physical objects or surfaces that **affect the model's pose and weight distribution**. These are structural elements the model interacts with bodily — NOT wearable items.

**INCLUDED (structural/environmental):**
- **Furniture:** Chair (seated, perched, leaning on back), stool, bench, table (leaning against, resting hand on)
- **Architectural:** Wall (leaning against, hand on surface), column, doorframe, staircase, railing
- **Floor:** Seated on ground, kneeling, crouching

**EXCLUDED (never describe these — they belong to garment/styling prompts):**
- Bags, hats, sunglasses, scarves, jewelry, belts, watches
- Any wearable accessory or clothing item
- Any item that does not structurally affect the model's body position

**DESCRIBE:**
1. What the object/surface is (generic — "metal folding chair," "smooth white wall," "low wooden stool")
2. The spatial relationship between model and object (distance, angle, contact points)
3. How body weight is distributed between the model's own body and the object
4. Which body parts are in contact with the object

**Example:** "The model is seated on a chrome-frame folding chair positioned slightly camera-left. The torso is reclined against the chair back with most of the body weight supported by the seat. The left arm drapes over the chair's backrest while the right hand rests on the right thigh. Both feet are planted on the floor in front of the chair, with legs extended forward and spread at roughly shoulder width."

---

### CRITICAL ANALYSIS PRINCIPLES

**1. VERIFY ROTATION DIRECTION VISUALLY**
Before writing, check: Which shoulder is closer to camera? Which side of the body is more visible? The shoulder that appears LARGER in the image is the one closer to camera. Write accordingly.

**2. LEFT/RIGHT FROM THE MODEL'S PERSPECTIVE**
Always describe using the MODEL's own left and right, not the viewer's. If the model's right hand is on the LEFT side of the image (as we see it), describe it as "right hand."

**3. DO NOT HALLUCINATE WHAT ISN'T VISIBLE**
If the lower body is cropped out, do NOT describe leg position. If hands are hidden behind the body, state they are obscured, don't guess.

**4. BE SPECIFIC ABOUT INTENSITY**
Instead of "slightly turned," use descriptive intensity: "torso rotated with a subtle turn to camera-left." Instead of "leaning," specify: "upper body tilted gently toward the right side."

**5. SEPARATE TORSO AND HEAD ROTATION**
The torso may face one direction while the head turns back toward camera. Always describe these independently:
- "The torso is angled moderately to camera-right, while the head is turned back toward the camera, maintaining a subtle three-quarter face angle."

**6. ACCOUNT FOR SEATED VS. STANDING DYNAMICS**
Seated poses have fundamentally different weight distribution and joint positions. Describe how the hips sit on the surface, how bent the knees are, and how the spine curves against the seat back.

**7. CROP IS NOT FRAMING — FRAMING IS NOT PLACEMENT**
- FRAMING = what part of the body is visible (shot type + crop boundaries)
- FRAME PLACEMENT = where the subject sits within the visible rectangle
- These are separate analyses and go in separate sections

---

### COMPLETE OUTPUT EXAMPLE

For a photograph of a model seated on a folding chair, arms crossed, legs extended:

\`\`\`
[POSE]
The model is seated in a reclined editorial position on a folding chair. The torso leans back against the chair support with a gentle recline, the spine maintaining a relaxed, slightly rounded curve. Both arms are crossed over the chest — the right arm crosses over the left, with the right hand gripping the left upper arm and the left hand tucked beneath the right elbow. The hips are positioned at the front edge of the seat, pushed forward to create the reclined angle. Both legs extend forward from the chair with knees nearly straight, spread apart at roughly shoulder width. The left leg extends slightly more forward than the right. Both feet are flat on the ground with toes pointing slightly outward.
[/POSE]

[CAMERA]
The camera is positioned at a slight high angle, looking subtly down at the model — consistent with the seated subject where the photographer is standing while the model sits. The camera is nearly frontal to the model, with a very subtle offset to camera-right creating barely perceptible asymmetry. The lens behavior produces a natural perspective with no noticeable compression or wide-angle distortion — proportions appear true to life with moderate depth separation between the model and the background wall.
[/CAMERA]

[FRAMING]
Full body framing. The top edge of the frame includes the full head with generous wall space above the crown — ample headroom. The bottom edge terminates well below the feet, showing a comfortable margin of concrete floor past the shoe soles. Both extended elbows are fully contained within frame. The chair legs and full structure are visible. This is a true head-to-toe full body shot with environmental context.
[/FRAMING]

[FRAME_PLACEMENT]
The model is positioned slightly left of center within the frame — roughly at the left-third line. The negative space is distributed asymmetrically: the right side of the frame contains more open space (the extended concrete floor and wall), while the left side is tighter to the model's body and the chair. The model's body and extended legs fill about two-thirds of the frame width. Vertically, the model is centered with balanced headroom and floor space.
[/FRAME_PLACEMENT]

[EXPRESSION_GAZE]
The gaze is directed straight at the camera lens — a direct, editorial engagement. The head is held level with no perceptible tilt, and the face is near-frontal with a barely noticeable turn. The jaw is relaxed, lips are closed and neutral with no smile. The brow is smooth and unfurrowed. The overall expression reads as confident nonchalance — an unbothered editorial stare with zero performative energy.
[/EXPRESSION_GAZE]

[PROP_INTERACTION]
The model is seated on a chrome-tube folding chair — a minimal, industrial-style piece with a flat seat and a low backrest formed by a single curved metal tube. The chair is oriented to face the camera directly. The model's hips occupy the front half of the seat, with the lower back resting against the curved backrest tube. The chair provides the primary structural support — most of the model's weight rests on the seat, with the remainder distributed through the feet on the floor. The chair's front legs are visible between the model's extended legs, and the rear legs are partially obscured by the model's torso.
[/PROP_INTERACTION]
\`\`\`

---

### WHAT THIS ROBOT DOES NOT DO

This robot analyzes and describes. It does NOT:
- Generate the final image prompt (that's a separate step/system)
- Include garment descriptions (handled by product prompt separately)
- Include lighting setups (handled by lighting prompt separately)
- Include background descriptions (handled by background prompt separately)
- Make aesthetic judgments about the photograph

The output of this robot is designed to be **plugged into the [POSE], [CAMERA], [FRAMING], and related sections** of a larger Nano Banana Pro generation prompt.
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
