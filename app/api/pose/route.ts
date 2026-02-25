import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const POSE_COST = 10;
export const maxDuration = 90;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.role !== 'admin' && (user.credits || 0) < POSE_COST) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        const { image_url } = await req.json();
        if (!image_url) return NextResponse.json({ error: "Image URL is required" }, { status: 400 });

        const falKey = process.env.FAL_KEY;
        if (!falKey) return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 });

        // If image_url is a base64, upload it to R2 first (fal.ai requires a public URL)
        let publicUrl = image_url;
        if (image_url.startsWith("data:")) {
            const { uploadBase64 } = await import("@/lib/s3");
            publicUrl = await uploadBase64(image_url, "poses/extraction");
            // If still base64 (R2 not configured), upload via r2 API
            if (publicUrl.startsWith("data:")) {
                const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";
                const uploadRes = await fetch(`${origin}/api/r2/upload`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Cookie": req.headers.get("cookie") || "" },
                    body: JSON.stringify({ base64: image_url, fileName: "pose_input.jpg", folder: "poses/extraction" })
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    publicUrl = uploadData.url;
                }
            }
        } else if (!image_url.startsWith("http")) {
            // Relative URL — make absolute
            const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
            publicUrl = `${origin}${image_url.startsWith("/") ? "" : "/"}${image_url}`;
        }

        const { fal } = await import("@fal-ai/client");
        fal.config({ credentials: falKey });

        // Try fal-ai/dwpose (better quality)
        let rawPoseUrl: string | null = null;

        try {
            const result: any = await fal.run("fal-ai/dwpose", {
                input: { image_url: publicUrl }
            });
            rawPoseUrl = result.image?.url || result.url || null;
        } catch (e: any) {
            console.warn("dwpose failed, trying imageutils/openpose:", e?.message);
            // Fallback: imageutils/openpose
            try {
                const result2: any = await fal.run("fal-ai/imageutils/openpose", {
                    input: { image_url: publicUrl }
                });
                rawPoseUrl = result2.image?.url || result2.images?.[0]?.url || null;
            } catch (e2: any) {
                console.error("Both pose models failed:", e2?.message);
            }
        }

        if (!rawPoseUrl) throw new Error("No stickman image returned from any model");

        // Save to R2 for persistence
        const { uploadFromUrl } = await import("@/lib/s3");
        const savedPoseUrl = await uploadFromUrl(rawPoseUrl, "poses/results");

        // Deduct credits
        if (user.role !== 'admin') {
            await deductCredits(user.id, POSE_COST, "Pose Extraction");
        }

        return NextResponse.json({ pose_image: savedPoseUrl });

    } catch (error: any) {
        console.error("Pose API Error:", error);
        return NextResponse.json({ error: error.message || "Pose extraction failed" }, { status: 500 });
    }
}
