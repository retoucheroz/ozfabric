import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { image, prompt, strength = 0.75 } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "Image is required" }, { status: 400 });
        }

        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 });
        }

        // FINAL ATTEMPT: Using the standard, robust Flux Dev ControlNet endpoint
        // This is the official way to do Canny with Flux on Fal.ai
        const model = "fal-ai/flux/dev/controlnet";

        console.log("Using Standard Flux ControlNet: fal-ai/flux/dev/controlnet");

        // Using raw fetch 
        const body = {
            prompt: prompt || "A realistic photo of the sketch",
            control_image_url: image,
            control_type: "canny",
            controlnet_conditioning_scale: strength,
            image_size: "square_hd",
            num_inference_steps: 28,
            guidance_scale: 3.5,
            enable_safety_checker: false
        };

        const response = await fetch(`https://fal.run/${model}`, {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Fal API Error:", response.status, errorText);
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json({
                    error: errorJson.body?.message || errorJson.error || "Generation failed (API Error)",
                    details: errorJson
                }, { status: response.status });
            } catch {
                return NextResponse.json({ error: `Generation failed (${response.status})`, details: errorText }, { status: response.status });
            }
        }

        const result = await response.json();
        let imageUrl = result.images?.[0]?.url || result.image?.url;

        if (imageUrl) {
            try {
                const { uploadFromUrl } = await import("@/lib/s3");
                const savedUrl = await uploadFromUrl(imageUrl, "sketch/results");

                // Update the result object with the new URL
                if (result.images?.[0]) result.images[0].url = savedUrl;
                if (result.image) result.image.url = savedUrl;

                console.log("Sketch result persisted to S3:", savedUrl);
            } catch (e) {
                console.error("S3 persistence error for sketch:", e);
            }
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Sketch API Error:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
