import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const POSE_COST = 10;
export const maxDuration = 300; // Increased to 300 to prevent timeouts
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

        // Upload to S3 first to get a public URL (base64 or relative URLs need this)
        const { ensureR2Url, uploadFromUrl } = await import("@/lib/s3");
        const sanitizedUrl = await ensureR2Url(image_url, "poses/extraction");

        const { fal } = await import("@fal-ai/client");
        fal.config({ credentials: falKey });

        // fal.run returns { data: { image: { url } }, requestId }
        const result: any = await fal.run("fal-ai/dwpose", {
            input: { image_url: sanitizedUrl }
        });

        // Result is wrapped in 'data' by the fal.ai SDK
        const rawPoseUrl = result?.data?.image?.url || result?.image?.url || result?.url;
        if (!rawPoseUrl) {
            console.error("[pose] Unexpected dwpose response:", JSON.stringify(result));
            throw new Error("No stickman image returned from dwpose");
        }

        // Save to S3 for persistence
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
