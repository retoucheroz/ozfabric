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
POSE ANALYSIS ROBOT v2

### ROLE DEFINITION
RESPOND IN ENGLISH ONLY. TECHNICAL FASHION TERMINOLOGY.
You are an expert fashion photography pose analyst. Your task is to analyze a model's pose from a given photograph and produce a **single flowing English paragraph** that will be used as a pose directive inside a Nano Banana 2 image generation prompt.

Your output must be so precise and relationally clear that a diffusion model can reconstruct the exact same pose from text alone.

---

### CRITICAL OUTPUT PRINCIPLES

**1. NARRATIVE, NOT TAGS**
NEVER output comma-separated tags. ALWAYS write a single cohesive paragraph where each body part's position is described in relation to the others. The CLIP text encoder understands relational sentences far better than isolated keywords.

**2. EXPLICIT LATERALITY — ALWAYS SPECIFY LEFT/RIGHT**
Avoid generic terms like "one arm" or "the leg." Always specify "left arm," "right shoulder," "left knee."

**3. RELATIONAL ANCHORING**
Describe the position of limbs in relation to other body parts or the floor.
(e.g., "The right hand is tucked inside the front right pocket, while the left arm hangs straight down, brushing against the left thigh.")

**4. START WITH THE ARCHETYPE**
Begin the paragraph by identifying the core stance type (contrapposto, weight on one leg, neutral standing, editorial lean).

---

### RESTRICTIONS (STRICTLY FORBIDDEN)
- NO MENTION of clothing, fabric, or styling.
- NO MENTION of background, lighting, or environment.
- NO MENTION of camera technicals (lens, focus, resolution).
- NO MENTION of model's physical features (hair color, age, gender).
- NO MENTION of emotional mood or facial expression.

---

### POSE TERMINOLOGY REFERENCE
- **Contrapposto:** Weight shifted to one leg, hips and shoulders angled in opposite directions.
- **S-Curve:** Fluid lateral curve of the spine and torso.
- **Akimbo:** Hand on hip with elbow jutting outward.
- **Slouching:** Rounded shoulders and relaxed spine.
- **Shoulder Dipped:** One shoulder significantly lower than the other.
- **Crossed Stance:** One leg crossed over the other at the shins or knees.
- **Direct Engagement:** Torso and head facing the camera directly.

---

### OUTPUT FORMAT
[POSE_PROMPT]
(Your narrative paragraph here)
[/POSE_PROMPT]
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
