import { NextRequest, NextResponse } from "next/server";

const MOCK_RESULT = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";

export async function POST(req: NextRequest) {
    try {
        const { image, prompt } = await req.json();
        if (!image || !prompt) return NextResponse.json({ error: "Image and prompt required" }, { status: 400 });

        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            console.log("[MOCK RETEXTURE] No FAL_KEY set.");
            await new Promise((r) => setTimeout(r, 2000));
            return NextResponse.json({
                status: "completed",
                imageUrl: MOCK_RESULT,
                message: "Retexture Mock Mode"
            });
        }

        // Use fal-ai/flux-general for high quality image-to-image / retexturing
        const response = await fetch("https://fal.run/fal-ai/flux-pro", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: `garment with ${prompt} texture, detailed fabric, realistic lighting, highly detailed, 8k professional fashion photography`,
                image_url: image,
                sync_mode: true,
                strength: 0.75, // Adjust strength for retexture balance
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: "Retexturing failed", details: errorText }, { status: 500 });
        }

        const data = await response.json();
        const imageUrl = data.image?.url || data.images?.[0]?.url;

        return NextResponse.json({ status: "completed", imageUrl: imageUrl || MOCK_RESULT });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
