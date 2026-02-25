import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const POSE_COST = 10;
export const maxDuration = 120;
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

        const { fal } = await import("@fal-ai/client");
        fal.config({ credentials: falKey });

        // Convert input to a public URL that fal.ai can access
        let publicUrl = image_url;

        if (image_url.startsWith("data:")) {
            // Base64 → upload to fal.ai storage (always public)
            console.log("[pose] Uploading base64 to fal.ai storage...");
            const base64Data = image_url.replace(/^data:image\/\w+;base64,/, "");
            const mimeMatch = image_url.match(/^data:(image\/\w+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

            const buffer = Buffer.from(base64Data, "base64");
            const blob = new Blob([buffer], { type: mimeType });
            const file = new File([blob], "pose_input.jpg", { type: mimeType });

            publicUrl = await fal.storage.upload(file);
            console.log("[pose] Uploaded to fal storage:", publicUrl);
        } else if (!image_url.startsWith("http")) {
            const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
            publicUrl = `${origin}${image_url.startsWith("/") ? "" : "/"}${image_url}`;
        }

        // Try fal-ai/dwpose (DWPose — highest quality)
        let rawPoseUrl: string | null = null;

        try {
            console.log("[pose] Running dwpose on:", publicUrl.substring(0, 80));
            const result: any = await fal.run("fal-ai/dwpose", {
                input: { image_url: publicUrl }
            });
            console.log("[pose] dwpose result keys:", Object.keys(result || {}));
            rawPoseUrl = result?.image?.url || result?.url || null;
        } catch (e: any) {
            console.warn("[pose] dwpose failed:", e?.message || e);
        }

        // Fallback: imageutils/openpose
        if (!rawPoseUrl) {
            try {
                console.log("[pose] Trying openpose fallback...");
                const result2: any = await fal.run("fal-ai/imageutils/openpose", {
                    input: { image_url: publicUrl }
                });
                console.log("[pose] openpose result keys:", Object.keys(result2 || {}));
                rawPoseUrl = result2?.image?.url || result2?.images?.[0]?.url || result2?.url || null;
            } catch (e2: any) {
                console.error("[pose] openpose also failed:", e2?.message || e2);
            }
        }

        if (!rawPoseUrl) {
            console.error("[pose] Both models failed. publicUrl was:", publicUrl?.substring(0, 100));
            throw new Error("No stickman image returned from any model");
        }

        // Save the result image to R2 (for persistence, not accessibility)
        let savedPoseUrl = rawPoseUrl;
        try {
            const { uploadFromUrl } = await import("@/lib/s3");
            savedPoseUrl = await uploadFromUrl(rawPoseUrl, "poses/results");
        } catch (saveErr) {
            console.warn("[pose] R2 save failed, returning fal URL directly:", saveErr);
            // Use fal URL directly if R2 save fails — it's valid for reasonable time
            savedPoseUrl = rawPoseUrl;
        }

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
