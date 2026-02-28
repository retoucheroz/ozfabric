
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const {
            image, // User uploaded model image
            outfitImage, // Optional outfit/combination image
            backgroundImage, // Base64 or URL
            poseStickman, // Base64 or URL
            backgroundPrompt: _, // Ignored as we use structured prompt now
            camera: __, // Ignored
            lens: ___, // Ignored
            focalLength: ____, // Ignored
            aperture: _____, // Ignored
            prompt: finalPrompt, // Now receives the fully structured master prompt
            resolution = "1K",
            aspectRatio = "3:4",
            seed = null,
            modelType = "full_body",
            modelDescription
        } = await req.json();

        const finalSeed = seed !== null ? Number(seed) : Math.floor(Math.random() * 1000000000);

        // Sanitize input images
        const { ensureR2Url } = await import("@/lib/s3");
        let sanitizedModel = null;
        if (image && !modelDescription) {
            sanitizedModel = await ensureR2Url(image, "editorial/inputs");
        }
        let sanitizedOutfit = null;
        let sanitizedBackground = null;
        let sanitizedPose = null;

        if (outfitImage) {
            sanitizedOutfit = await ensureR2Url(outfitImage, "editorial/inputs");
        }
        if (backgroundImage) {
            sanitizedBackground = await ensureR2Url(backgroundImage, "editorial/inputs");
        }
        if (poseStickman) {
            sanitizedPose = await ensureR2Url(poseStickman, "editorial/inputs");
        }

        const imageUrlsPayload: any = {};
        if (sanitizedModel) {
            imageUrlsPayload.model = sanitizedModel;
        }

        if (sanitizedOutfit) {
            imageUrlsPayload.outfit = sanitizedOutfit;
        }
        if (sanitizedBackground) {
            imageUrlsPayload.scene = sanitizedBackground;
        }
        if (sanitizedPose) {
            imageUrlsPayload.pose = sanitizedPose;
        }

        const { generateWithNanoBanana } = await import('@/lib/nano-banana');
        const imageUrl = await generateWithNanoBanana({
            prompt: finalPrompt,
            image_urls: imageUrlsPayload,
            aspect_ratio: aspectRatio,
            resolution: resolution === "4K" ? "4K" : resolution === "2K" ? "2K" : "1K",
            seed: finalSeed
        });

        return NextResponse.json({
            images: [imageUrl],
            prompt: finalPrompt,
            seed: finalSeed
        });

    } catch (error: any) {
        console.error("Editorial API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
