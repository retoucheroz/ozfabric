import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const MOCK_RESULT = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000";
const VTON_COST = 50;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.role !== 'admin' && (user.credits || 0) < VTON_COST) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

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

        const { ensureR2Url } = await import("@/lib/s3");
        const [sanitizedHuman, sanitizedGarment] = await Promise.all([
            ensureR2Url(humanImage, "vton/human"),
            ensureR2Url(garmentImage, "vton/garment")
        ]);

        // fal-ai/fashn/tryon is the FASHN Virtual Try-On
        const response = await fetch("https://fal.run/fal-ai/fashn-vton-v1.5", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                human_image_url: sanitizedHuman,
                garment_image_url: sanitizedGarment,
                category: category || "tops",
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

        // Persist to R2/S3
        if (imageUrl && !imageUrl.includes('unsplash')) {
            try {
                const { uploadFromUrl } = await import("@/lib/s3");
                imageUrl = await uploadFromUrl(imageUrl, "vton");
            } catch (r2Error) {
                console.error('S3 persistence error:', r2Error);
            }
        }

        // Deduct credits if successful
        if (user.role !== 'admin') {
            await deductCredits(user.id, VTON_COST, "Virtual Try-On");
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
