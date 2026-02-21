
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
            modelType = "full_body"
        } = await req.json();

        const finalSeed = seed !== null ? Number(seed) : Math.floor(Math.random() * 1000000000);

        // Sanitize input images
        const { ensureR2Url } = await import("@/lib/s3");
        const sanitizedModel = await ensureR2Url(image, "editorial/inputs");
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

        const falPayload: any = {
            prompt: finalPrompt,
            image_urls: {
                model: sanitizedModel
            },
            aspect_ratio: aspectRatio,
            resolution: resolution === "4K" ? "4K" : resolution === "2K" ? "2K" : "1K",
            seed: finalSeed,
            output_format: "png"
        };

        if (sanitizedOutfit) {
            falPayload.image_urls.outfit = sanitizedOutfit;
        }
        if (sanitizedBackground) {
            falPayload.image_urls.scene = sanitizedBackground;
        }
        if (sanitizedPose) {
            falPayload.image_urls.pose = sanitizedPose;
        }

        const falKey = process.env.FAL_KEY;
        if (!falKey) throw new Error("FAL_KEY missing");

        const response = await fetch("https://fal.run/fal-ai/nano-banana-pro/edit", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(falPayload),
        });

        if (!response.ok) {
            const err = await response.text();
            return NextResponse.json({ error: `Fal API Error: ${err}` }, { status: 500 });
        }

        const data = await response.json();
        const falUrls = data.images?.map((img: any) => img.url) || [];

        // Persist to R2/S3
        let finalUrls = falUrls;
        if (falUrls.length > 0) {
            try {
                const { uploadFromUrl } = await import("@/lib/s3");
                finalUrls = await Promise.all(falUrls.map((url: string) => uploadFromUrl(url, "editorial")));
                console.log('Editorial Persisted to S3:', finalUrls);
            } catch (r2Error) {
                console.error('S3 editorial persistence error:', r2Error);
            }
        }

        return NextResponse.json({
            images: finalUrls,
            prompt: finalPrompt,
            seed: finalSeed
        });

    } catch (error: any) {
        console.error("Editorial API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
