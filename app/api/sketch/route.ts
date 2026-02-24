import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const SKETCH_COST = 20;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.role !== 'admin' && (user.credits || 0) < SKETCH_COST) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        const { image, prompt, strength = 0.75 } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "Image is required" }, { status: 400 });
        }

        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 });
        }

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

        const response = await fetch(`https://fal.run/fal-ai/flux/dev/controlnet`, {
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
            return NextResponse.json({ error: "Generation failed" }, { status: response.status });
        }

        const result = await response.json();
        let imageUrl = result.images?.[0]?.url || result.image?.url;

        if (imageUrl) {
            try {
                const { uploadFromUrl } = await import("@/lib/s3");
                const savedUrl = await uploadFromUrl(imageUrl, "sketch/results");
                if (result.images?.[0]) result.images[0].url = savedUrl;
                if (result.image) result.image.url = savedUrl;
            } catch (e) {
                console.error("S3 persistence error for sketch:", e);
            }
        }

        // Deduct credits
        if (user.role !== 'admin') {
            await deductCredits(user.id, SKETCH_COST, "Sketch to Image");
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Sketch API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
