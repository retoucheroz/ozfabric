import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const POSE_ANALYZE_COST = 20;
        if (user.role !== 'admin' && (user.credits || 0) < POSE_ANALYZE_COST) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        const { imageUrl } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        // Deduct credits
        if (user.role !== 'admin') {
            await deductCredits(user.id, POSE_ANALYZE_COST, "Pose Analysis");
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY mismatch" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Fetch the image and convert to base64
        const imageResp = await fetch(imageUrl);
        const imageBuffer = await imageResp.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString("base64");

        const prompt = `
        You are an expert fashion photographer and prompt engineer for Stable Diffusion.
        Analyze the POSE in this image explicitly. Ignore clothing, background, and lighting.
        Focus ONLY on the body position.
        
        Describe the pose in a single, comma-separated paragraph suitable for an image generation prompt.
        Include:
        - Stance (wide, narrow, crossed legs, walking, etc.)
        - Arm position (hands on hips, arms crossed, one hand in pocket, etc.)
        - Head direction (looking at camera, looking away, tilted, etc.)
        - Body angle (front facing, 3/4 turn, side profile, etc.)
        - Weight distribution
        
        Example output:
        "Standing straight with legs hip-width apart, weight shifted to the left leg, right hand on hip, left arm hanging naturally by the side, head tilted slightly to the right, looking directly at the camera, torso facing forward."
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg" // Assuming jpeg for simplicity, or we can detect
                }
            }
        ]);

        const text = result.response.text();
        console.log("Pose Analysis Result:", text);

        return NextResponse.json({ description: text.trim() });

    } catch (error: any) {
        console.error("Pose analysis error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
