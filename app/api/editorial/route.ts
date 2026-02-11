
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const {
            image, // User uploaded model image
            backgroundPrompt,
            camera,
            lens,
            focalLength,
            aperture,
            prompt: userPrompt,
            resolution = "1K",
            aspectRatio = "3:4",
            seed = null
        } = await req.json();

        // Construct final prompt
        let finalPrompt = "";

        if (backgroundPrompt) finalPrompt += `${backgroundPrompt}. `;
        if (userPrompt) finalPrompt += `${userPrompt}. `;

        // Add Camera Specs
        const cameraSpecs = `Camera: ${camera}, Lens: ${lens}, Focal Length: ${focalLength}mm, Aperture: ${aperture}`;
        finalPrompt += ` ${cameraSpecs}. `;

        // Enhance with editorial quality keywords
        finalPrompt += " High-end fashion editorial photography, professional lighting, photorealistic, 8k resolution, cinematic quality.";

        const finalSeed = seed !== null ? Number(seed) : Math.floor(Math.random() * 1000000000);

        const falPayload = {
            prompt: finalPrompt,
            image_urls: {
                model: image
            },
            aspect_ratio: aspectRatio,
            resolution: resolution === "4K" ? "4K" : resolution === "2K" ? "2K" : "1K",
            seed: finalSeed,
            output_format: "png"
        };

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
        return NextResponse.json({
            images: data.images?.map((img: any) => img.url) || [],
            prompt: finalPrompt,
            seed: finalSeed
        });

    } catch (error: any) {
        console.error("Editorial API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
