import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const RESIZE_COST = 20;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.role !== 'admin' && (user.credits || 0) < RESIZE_COST) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        const { image, mode, upscale_factor, expand_direction, expand_amount, prompt, creativity } = await req.json();

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
            endpoint = "clarityai/crystal-upscaler";
            body.scale = parseInt(upscale_factor?.replace("x", "")) || 2;
            if (creativity !== undefined) {
                body.creativity = parseFloat(creativity as string) || 0;
            }
        } else {
            endpoint = "fal-ai/flux-pro/outpaint";
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
                const { uploadFromUrl } = await import("@/lib/s3");
                finalUrl = await uploadFromUrl(rawUrl, "resized");
            } catch (e) {
                console.error("S3 resize persistence error:", e);
            }
        }

        // Deduct credits
        if (user.role !== 'admin') {
            await deductCredits(user.id, RESIZE_COST, "Image Resize/Upscale");
        }

        return NextResponse.json({ status: "completed", imageUrl: finalUrl });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
