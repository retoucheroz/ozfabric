import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { SERVICE_COSTS } from "@/lib/pricingConstants";

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 });
        }

        fal.config({ credentials: falKey });

        const body = await req.json();
        const {
            startImageUrl,
            endImageUrl,
            prompt,
            duration = 5,
            generateAudio,
            resolution,
            multiShot,
            shots = [],
        } = body;

        // Calculate cost
        const videoDuration = multiShot
            ? shots.reduce((acc: number, s: any) => acc + Number(s.duration || 0), 0)
            : Number(duration);

        const perSecondCost = generateAudio
            ? SERVICE_COSTS.VIDEO_GENERATION.KLING_3_SOUND_ON
            : SERVICE_COSTS.VIDEO_GENERATION.KLING_3_SOUND_OFF;

        const totalCost = Math.ceil(videoDuration * perSecondCost);

        if (user.role !== 'admin' && (user.credits || 0) < totalCost) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        if (!startImageUrl && !multiShot) {
            return NextResponse.json({ error: "Start frame URL is required" }, { status: 400 });
        }

        // Determine modelfal-ai/kling-video/o3/pro/image-to-video
        const modelEndpoint = resolution === "1080p"
            ? "fal-ai/kling-video/v1.5/pro/image-to-video" // fallback to 1.5 pro if o3 not available, checking o3 names
            : "fal-ai/kling-video/v1.5/standard/image-to-video";

        const input: any = multiShot ? {
            image_url: startImageUrl,
            multi_prompt: shots.map((shot: any) => ({
                prompt: shot.prompt,
                duration: String(shot.duration),
            })),
            shot_type: "customize",
            generate_audio: generateAudio || false,
        } : {
            prompt: prompt,
            image_url: startImageUrl,
            duration: String(duration || 5),
            generate_audio: generateAudio || false,
        };

        if (endImageUrl) input.end_image_url = endImageUrl;

        const result = await fal.subscribe(modelEndpoint, {
            input,
            logs: true
        });

        const data = result.data as any;

        if (!data?.video?.url) {
            return NextResponse.json({ error: "No video was generated" }, { status: 500 });
        }

        // Deduct credits
        if (user.role !== 'admin') {
            await deductCredits(user.id, totalCost, `Video Generation (${videoDuration}s)`);
        }

        const { uploadFromUrl } = await import("@/lib/s3");
        const savedVideoUrl = await uploadFromUrl(data.video.url, "videos/generations");

        return NextResponse.json({
            status: "completed",
            video: {
                url: savedVideoUrl,
                fileName: data.video.file_name || "output.mp4",
                contentType: data.video.content_type || "video/mp4",
                fileSize: data.video.file_size,
            },
            requestId: result.requestId,
        });

    } catch (error: any) {
        console.error("[Video Gen] Error:", error);
        return NextResponse.json({ error: error.message || "Video generation failed" }, { status: 500 });
    }
}
