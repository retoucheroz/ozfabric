import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const POSE_ANALYZE_COST = 20;
        if (user.role !== 'admin' && (user.credits || 0) < POSE_ANALYZE_COST) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        const { imageUrl } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        // Deduct credits
        if (user.role !== 'admin') {
            await deductCredits(user.id, POSE_ANALYZE_COST, "Pose Analysis");
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY mismatch" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Fetch the image and convert to base64
        const imageResp = await fetch(imageUrl);
        const imageBuffer = await imageResp.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString("base64");

        const prompt = `
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

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg" // Assuming jpeg for simplicity, or we can detect
                }
            }
        ]);

        const text = result.response.text();
        console.log("Pose Analysis Result:", text);

        return NextResponse.json({ description: text.trim() });

    } catch (error: any) {
        console.error("Pose analysis error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
