import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const falKey = process.env.FAL_KEY;
        if (!falKey) return NextResponse.json({ error: "FAL_KEY required" }, { status: 500 });
        fal.config({ credentials: falKey });

        const { imageUrl, prompt } = await req.json();

        if (!imageUrl) return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });

        const defaultPrompt = "black matte mannequin, professional studio photography, soft diffused lighting from above and sides, subtle shadows on body contours, light grey seamless paper backdrop, fashion mannequin display, high-end product photography, no reflections, matte finish surface";

        const result = await fal.subscribe("fal-ai/iclight-v2", {
            input: {
                image_url: imageUrl,
                prompt: prompt || defaultPrompt,
                num_inference_steps: 30,
                guidance_scale: 7,
                num_images: 1,
                output_format: "png"
            }
        });

        return NextResponse.json({ images: result.data.images });

    } catch (error: any) {
        console.error("ICLight V2 API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process ICLight V2" }, { status: 500 });
    }
}
