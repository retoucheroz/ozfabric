import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { image_url } = await req.json();

        if (!image_url) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 });
        }

        const { fal } = await import("@fal-ai/client");

        // Configure FAL
        fal.config({
            credentials: falKey
        });

        // Use fal-ai/dwpose for better skeletal extraction
        const result: any = await fal.run("fal-ai/dwpose", {
            input: {
                image_url: image_url
            }
        });

        console.log("Fal Pose SDK Result:", result);

        // SDK result is often nested under .data
        const poseData = result.data || result;

        if (poseData.image && poseData.image.url) {
            return NextResponse.json({ pose_image: poseData.image.url });
        } else if (poseData.url) {
            return NextResponse.json({ pose_image: poseData.url });
        } else {
            console.error("Pose API Invalid Response Structure:", result);
            return NextResponse.json({ error: "Invalid response from AI service" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Pose API Error:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
