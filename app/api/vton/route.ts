import { NextRequest, NextResponse } from "next/server";

const MOCK_RESULT = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000";

export async function POST(req: NextRequest) {
    try {
        const { humanImage, garmentImage, category, garmentDescription } = await req.json();

        if (!humanImage || !garmentImage) {
            return NextResponse.json({ error: "Both images are required" }, { status: 400 });
        }

        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            console.log("[MOCK VTON] No FAL_KEY set.");
            await new Promise((r) => setTimeout(r, 4000));
            return NextResponse.json({
                status: "completed",
                imageUrl: MOCK_RESULT,
                message: "VTON Mock Mode"
            });
        }

        // fal-ai/fashn/tryon is the FASHN Virtual Try-On
        const response = await fetch("https://fal.run/fal-ai/fashn-vton-v1.5", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                human_image_url: humanImage,
                garment_image_url: garmentImage,
                category: category || "tops", // fashn uses "tops", "bottoms", "one-pieces"
                garment_description: garmentDescription || "fashion garment"
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Fal VTON Error:", response.status, errorText);
            return NextResponse.json({ error: "Try-on failed", details: errorText }, { status: 500 });
        }

        const data = await response.json();
        let imageUrl = data.image?.url || data.images?.[0]?.url || MOCK_RESULT;

        // Persist to R2 if configured
        if (imageUrl && !imageUrl.includes('unsplash') && process.env.R2_BUCKET) {
            try {
                const { uploadFromUrl } = await import("@/lib/r2");
                imageUrl = await uploadFromUrl(imageUrl, "vton");
                console.log('VTON Persisted to R2:', imageUrl);
            } catch (r2Error) {
                console.error('R2 persistence error:', r2Error);
            }
        }

        return NextResponse.json({
            status: "completed",
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error("VTON Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
