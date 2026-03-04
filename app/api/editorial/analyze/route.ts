import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

        const {
            camera,
            lens,
            focalLength,
            aperture,
            locationPrompt,
            outfitImage,
            backgroundImage,
            poseStickman,
            posePrompt,
            modelType = "full_body",
            modelDescription,
            modelImage,
            useReferencePose,
            resolution = "1K",
            aspectRatio: camelAspectRatio,
            aspect_ratio: snakeAspectRatio,
            hairStyle = "original",
            language = "tr"
        } = await req.json();

        const aspectRatio = snakeAspectRatio || camelAspectRatio || "3:4";

        // Find hair style prompt
        const hairStyleObj = [
            { id: "original", prompt: "" },
            { id: "slicked_back", prompt: "hair slicked back, sleek swept-back hair, polished and tight" },
            { id: "straight_silky", prompt: "straight silky hair, smooth glossy hair, pin-straight" },
            { id: "glamour_waves", prompt: "glamorous Hollywood waves, soft voluminous curls, old Hollywood style" },
            { id: "messy_bun", prompt: "messy bun with bangs, loose updo with face-framing bangs, casual bun" },
            { id: "long_layered", prompt: "long layered hair with bangs, layered haircut with curtain bangs" },
            { id: "high_bun", prompt: "elegant high bun, sleek top knot, polished updo" },
            { id: "voluminous", prompt: "voluminous highlighted hair, balayage highlights, full-bodied layered hair" },
            { id: "textured_bob", prompt: "textured bob haircut, choppy bob, edgy bob with layers" },
            { id: "natural_afro", prompt: "natural afro hair, big fluffy afro, coily natural hair" },
            { id: "hijab", prompt: "wearing hijab, modest headscarf, colorful hijab style" }
        ].find(h => h.id === hairStyle);

        const hairPrompt = hairStyleObj?.prompt || "";

        // Deduct credits
        await deductCredits(user.id, ANALYZE_COST, "Editorial Analyze");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Helper to get image parts (Base64 or URL)
        const getImagePart = async (input: string) => {
            if (input.startsWith("data:")) {
                const parts = input.split(",");
                return {
                    inlineData: {
                        data: parts[1],
                        mimeType: parts[0].match(/:(.*?);/)?.[1] || "image/jpeg"
                    }
                };
            } else if (input.startsWith("http")) {
                const response = await fetch(input);
                const buffer = await response.arrayBuffer();
                return {
                    inlineData: {
                        data: Buffer.from(buffer).toString("base64"),
                        mimeType: response.headers.get("content-type") || "image/jpeg"
                    }
                };
            }
            return null;
        };

        // Build the Super Prompt
        const superPrompt = `
            You are a Master Performance Fashion Director. 
            Your task is to analyze the provided components and generate a "MASTER PRODUCTION PROMPT".

            ### INPUT SOURCE DEFINITIONS (STRICT HIERARCHY):
            1. "IMAGE FOR IDENTITY": This is the Model Image. Use it ONLY for the face, bone structure, skin tone, and hair.
            2. "IMAGE FOR OUTFIT": This is the EXCLUSIVE source for the entire look. 
               - NOTE: This image may be a COMPOSITE/COLLAGE of multiple separate items. 
               - MISSION: CAREFULLY SCAN the entire outfit image area to identify every single garment, pair of shoes, and ACCESSORY (glasses, hats, jewelry, bags, etc.). DO NOT MISS SMALL ITEMS.
            3. "IMAGE FOR SCENE": This is the Background/Reference Image. Use it ONLY for the physical environment and the POSE/FRAMING.

            ### COMPONENT 1: SUBJECT & IDENTITY
            - SOURCE: Use the "IMAGE FOR IDENTITY".
            - ${hairStyle !== "original" ? `- HAIR STYLE OVERRIDE: ${hairPrompt}. (MISSION: Replicate the EXACT hair color, highlights, and texture from the "IMAGE FOR IDENTITY" portrait, but apply this NEW style).` : "- Preserve the hair from the image."}
            - RULE: ABSOLUTELY IGNORE the identity/face and hair color of any person in the "IMAGE FOR SCENE".

            ### COMPONENT 1.5: OUTFIT & ACCESSORIES (CRITICAL)
            ${outfitImage
                ? `- SOURCE: Use the "IMAGE FOR OUTFIT" collage. 
                   - MISSION: You MUST describe the EXACT clothing AND every accessory (eyewear, hats, etc.) found in the collage.
                   - INTEGRATION: Accessories must be realistically styled on the model: 
                      * GLASSES/SUNGLASSES MUST BE ON THE FACE.
                      * HATS MUST BE ON THE HEAD.
                      * JEWELRY must be on ears/neck/wrists.
                   - MICRO-DETAIL REPLICATION: Map the PRECISE features, frame shapes, and distress patterns.
                   - RULE: COMPLETELY REPLACE any clothing/accessories seen in the Model Image or Background Image with THIS specific ensemble from the collage.`
                : `- SOURCE: Use the garments visible in the "IMAGE FOR IDENTITY".`
            }
            - MANDATORY: ABSOLUTELY IGNORE any clothing/accessories worn by the person in the "IMAGE FOR SCENE".

            ### COMPONENT 2: LOCATION & SCENE
            - SOURCE: Use the "IMAGE FOR SCENE".
            - MISSION: REPLICATE the environment, architecture, and lighting (direction, intensity, color) EXACTLY.
            
            ### COMPONENT 3: POSE & COMPOSITION
            - SOURCE: Use the "IMAGE FOR SCENE".
            - Mirror the body position and shot type exactly. 

            ### YOUR TASK:
            1. Identify the subject from "IMAGE FOR IDENTITY".
            2. Meticulously analyze the "IMAGE FOR OUTFIT" collage for ALL items including CLOTHING and ACCESSORIES (glasses, etc.).
            3. Identify the SCENE & POSE from "IMAGE FOR SCENE".
            4. Synthesize into a cohesive [MASTER PROMPT].
            5. CRITICAL: Ensure accessories like glasses are specifically described as being worn by the subject.

            ### OUTPUT FORMAT:
            Generate a single cohesive paragraph. 
            Include the following bracketed headers internally: [SUBJECT SOURCE], [OUTFIT], [ENVIRONMENT], [PHYSICAL INTEGRATION].
        `.trim();

        let finalPrompt = "";
        try {
            const parts: any[] = [{ text: superPrompt }];

            // 1. OUTFIT (Send if exists, regardless of modelType)
            if (outfitImage) {
                const part = await getImagePart(outfitImage);
                if (part) {
                    parts.push({ text: "--- IMAGE FOR OUTFIT FOLLOWS ---" });
                    parts.push(part);
                }
            }

            // 2. IDENTITY (Model)
            if (modelImage && modelType !== 'prompt') {
                const part = await getImagePart(modelImage);
                if (part) {
                    parts.push({ text: "--- IMAGE FOR IDENTITY FOLLOWS ---" });
                    parts.push(part);
                }
            }

            // 3. SCENE (Background)
            if (backgroundImage) {
                const part = await getImagePart(backgroundImage);
                if (part) {
                    parts.push({ text: "--- IMAGE FOR SCENE FOLLOWS ---" });
                    parts.push(part);
                }
            }

            const result = await model.generateContent({
                contents: [{ role: "user", parts }],
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                ],
            });
            finalPrompt = result.response.text().trim();
        } catch (err: any) {
            console.error("Super Analysis Error:", err);
            return NextResponse.json({ error: `Analysis failed: ${err.message}` }, { status: 500 });
        }

        return NextResponse.json({ analysis: finalPrompt });
    } catch (error: any) {
        console.error("Gemini Analysis Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
