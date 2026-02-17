import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { image_url } = await req.json();

        if (!image_url) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        const { ensureR2Url } = await import("@/lib/s3");
        console.log("Pose API: Sanitizing image URL...");
        const sanitizedUrl = await ensureR2Url(image_url, "poses/extraction");
        console.log("Pose API: Sanitized URL (length):", sanitizedUrl?.length);

        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            console.error("Pose API Error: FAL_KEY missing");
            return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 });
        }

        const { fal } = await import("@fal-ai/client");
        fal.config({ credentials: falKey });

        console.log("Pose API: Running fal-ai/dwpose...");
        try {
            const result: any = await fal.run("fal-ai/dwpose", {
                input: {
                    image_url: sanitizedUrl
                }
            });

            console.log("Pose API: Fal Result received");

            const poseData = result.data || result;
            const rawPoseUrl = poseData.image?.url || poseData.url;

            if (rawPoseUrl) {
                const { ensureS3Url } = await import("@/lib/s3");
                const savedPoseUrl = await ensureS3Url(rawPoseUrl, "poses/results");
                return NextResponse.json({ pose_image: savedPoseUrl });
            } else {
                console.error("Pose API Error: Invalid response structure", result);
                return NextResponse.json({ error: "Invalid response from AI service" }, { status: 500 });
            }
        } catch (falError: any) {
            console.error("Pose API: Fal.ai service error:", falError);
            return NextResponse.json({ error: `AI Service Error: ${falError.message || 'Unknown'}` }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Pose API Global Error:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
