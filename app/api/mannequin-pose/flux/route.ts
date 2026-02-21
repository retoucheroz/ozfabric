import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const falKey = process.env.FAL_KEY;
        if (!falKey) return NextResponse.json({ error: "FAL_KEY required" }, { status: 500 });
        fal.config({ credentials: falKey });

        const { modelPhotoUrl, referenceMannequinUrl, prompt } = await req.json();

        if (!modelPhotoUrl || !referenceMannequinUrl) {
            return NextResponse.json({ error: "modelPhotoUrl and referenceMannequinUrl required" }, { status: 400 });
        }

        const defaultPrompt = "black matte faceless mannequin, professional studio photography, soft diffused lighting, light grey seamless backdrop, high-end fashion mannequin display, matte finish, no face features";

        const result = await fal.subscribe("fal-ai/flux-general", {
            input: {
                prompt: prompt || defaultPrompt,
                controlnets: [{
                    path: "depth",
                    control_image_url: modelPhotoUrl,
                    conditioning_scale: 0.7,
                    start_percentage: 0,
                    end_percentage: 1
                }],
                ip_adapter: [{
                    image_url: referenceMannequinUrl,
                    scale: 0.6
                }],
                image_size: { width: 768, height: 1024 },
                num_inference_steps: 28,
                guidance_scale: 3.5,
                num_images: 1
            }
        });

        return NextResponse.json({ images: result.data.images });

    } catch (error: any) {
        console.error("FLUX API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process FLUX" }, { status: 500 });
    }
}
