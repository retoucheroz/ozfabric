import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { image, mode, upscale_factor, expand_direction, expand_amount, prompt } = await req.json();

        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            return NextResponse.json({
                status: "completed",
                imageUrl: image,
                message: "Mock Mode (Set FAL_KEY)"
            });
        }

        let endpoint = "fal-ai/creative-upscaler";
        let body: any = { image_url: image };

        if (mode === "upscale") {
            endpoint = "fal-ai/creative-upscaler";
            // upscale_factor is usually a string like "2x", "4x"
            // body.upscale_factor = parseInt(upscale_factor) || 2;
        } else {
            // Expand / Outpaint
            endpoint = "fal-ai/flux-pro/outpaint"; // Example endpoint
            body.expand_direction = expand_direction || "all";
            body.expand_amount = expand_amount || 0.5;
            body.prompt = prompt || "fill details";
        }

        const response = await fetch(`https://fal.run/${endpoint}`, {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: "Resize failed", details: errorText }, { status: 500 });
        }

        const data = await response.json();
        const rawUrl = data.image?.url || data.images?.[0]?.url;

        let finalUrl = rawUrl;
        if (rawUrl) {
            try {
                const { ensureS3Url } = await import("@/lib/s3");
                finalUrl = await ensureS3Url(rawUrl, "resized");
            } catch (e) {
                console.error("S3 resize persistence error:", e);
            }
        }

        return NextResponse.json({ status: "completed", imageUrl: finalUrl });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
