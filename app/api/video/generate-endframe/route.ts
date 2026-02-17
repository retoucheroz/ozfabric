import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const falKey = process.env.FAL_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
        }
        if (!falKey) {
            return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 });
        }

        const body = await req.json();
        const {
            firstFrameImage,    // base64 string of the first frame
            userDescription,    // what the user wants in the last frame
            aspectRatio,        // e.g. "16:9", "9:16", "1:1"
        } = body;

        if (!firstFrameImage) {
            return NextResponse.json({ error: "First frame image is required" }, { status: 400 });
        }
        if (!userDescription || !userDescription.trim()) {
            return NextResponse.json({ error: "Description is required" }, { status: 400 });
        }

        // --- STEP 1: Gemini analyzes the first frame + user's description to create a prompt ---
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "text/plain" },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

        // Extract base64 data
        let base64Data = firstFrameImage;
        let mimeType = "image/png";
        if (firstFrameImage.includes(",")) {
            const parts = firstFrameImage.split(",");
            const match = parts[0].match(/:(.*?);/);
            if (match) mimeType = match[1];
            base64Data = parts[1];
        }

        const analysisSystemPrompt = `
ROLE: You are an expert cinematographer, fashion art director, and visual effects specialist.
TASK: You are given a "first frame" image from a fashion/product video, and the user's description of what they want the "last frame" (end frame) to look like.

Your job is to analyze the first frame image in extreme detail and then generate a highly detailed, production-ready text prompt for an AI image generation model (Nano Banana Pro) to create the "last frame" image.

CRITICAL RULES:
1. ANALYZE THE FIRST FRAME CAREFULLY: Identify every element — the model (if present), their physical appearance (face, hair, body type, skin tone), clothing (exact garments, colors, patterns, textures, fit), accessories, background/environment, lighting setup, camera angle, mood/atmosphere.

2. READ THE USER'S DESCRIPTION CAREFULLY: The user will describe what they want changed or maintained in the last frame. Pay very close attention to:
   - If they mention the MODEL: Preserve exact model identity, face, hair, body proportions. The same person must appear.
   - If they mention the LOCATION/ENVIRONMENT: Preserve or modify the environmental details as requested. If they want a different angle of the same place, keep architectural and material details consistent.
   - If they mention CLOTHING: Keep the exact garments unless they specifically say to change them.
   - If they mention POSE/MOVEMENT: Describe the exact target pose for the end frame.
   - If they mention CAMERA MOVEMENT: Describe the final camera position/angle that the video would end on.

3. GENERATE A COMPREHENSIVE PROMPT: The output must be a single, highly detailed English prompt paragraph that describes the EXACT final frame. Include:
   - Subject identity preservation (if a person is in the frame)
   - Exact clothing description (colors, textures, patterns, fit)
   - Exact background/environment description
   - Lighting description
   - Camera angle and framing
   - Pose and body position
   - Any props, accessories, or contextual elements
   - Mood and atmosphere

4. DO NOT include any meta-text, explanations, headers, or formatting. Output ONLY the raw prompt text — a single paragraph.

5. The prompt should work standalone — someone reading just the prompt should be able to visualize the exact frame without seeing the original image.

6. If the user mentions keeping something from the first frame, describe that thing in EXPLICIT detail in the prompt rather than saying "same as before" or "keep the same".

USER'S DESCRIPTION:
"${userDescription}"

Now analyze the provided first frame image and generate the end frame prompt.
`;

        const geminiResult = await model.generateContent([
            analysisSystemPrompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);

        const generatedPrompt = geminiResult.response.text().trim();

        console.log("[EndFrame] Gemini generated prompt:", generatedPrompt.substring(0, 200) + "...");

        // --- STEP 2: Generate the end frame image using Nano Banana Pro ---

        // Determine resolution from aspect ratio
        // User wants "4K" quality but we don't expose this to them
        const resolution = "4K";

        const falPayload = {
            prompt: generatedPrompt,
            negative_prompt: "blurry, low quality, distorted face, extra fingers, extra limbs, deformed, disfigured, bad anatomy, watermark, text, logo, signature, cropped, worst quality, low resolution, jpeg artifacts, ugly, duplicate, morbid, mutilated",
            image_urls: [firstFrameImage],
            aspect_ratio: aspectRatio || "16:9",
            resolution: resolution,
            seed: Math.floor(Math.random() * 1000000000),
            enable_web_search: false,
            output_format: "png"
        };

        const falResponse = await fetch("https://fal.run/fal-ai/nano-banana-pro/edit", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(falPayload),
        });

        if (!falResponse.ok) {
            const errText = await falResponse.text();
            console.error("[EndFrame] Fal API Error:", errText);
            return NextResponse.json({ error: `Image generation failed: ${errText}` }, { status: 500 });
        }

        const falData = await falResponse.json();
        const generatedImageUrl = falData.images?.[0]?.url;

        if (!generatedImageUrl) {
            return NextResponse.json({ error: "No image generated" }, { status: 500 });
        }

        const { ensureS3Url } = await import("@/lib/s3");
        const savedImageUrl = await ensureS3Url(generatedImageUrl, "videos/end-frames");

        return NextResponse.json({
            status: "success",
            imageUrl: savedImageUrl,
            prompt: generatedPrompt
        });

    } catch (error: any) {
        console.error("[EndFrame] Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
