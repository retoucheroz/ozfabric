import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const ENDFRAME_COST = 50;
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.role !== 'admin' && (user.credits || 0) < ENDFRAME_COST) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        const falKey = process.env.FAL_KEY;

        if (!apiKey || !falKey) {
            return NextResponse.json({ error: "API configuration missing" }, { status: 500 });
        }

        const body = await req.json();
        const { firstFrameImage, userDescription, aspectRatio } = body;

        if (!firstFrameImage || !userDescription) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // --- STEP 1: Gemini Prompt Generation ---
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        let base64Data = firstFrameImage;
        let mimeType = "image/png";
        if (firstFrameImage.includes(",")) {
            const parts = firstFrameImage.split(",");
            mimeType = parts[0].match(/:(.*?);/)?.[1] || "image/png";
            base64Data = parts[1];
        }

        const analysisSystemPrompt = `Analyze first frame and generate highly detailed prompt for end frame. description: "${userDescription}"`;

        const geminiResult = await model.generateContent([
            analysisSystemPrompt,
            { inlineData: { data: base64Data, mimeType } }
        ]);

        const generatedPrompt = geminiResult.response.text().trim();

        // --- STEP 2: Nano Banana Generation ---
        const { generateWithNanoBanana } = await import('@/lib/nano-banana');
        const generatedImageUrl = await generateWithNanoBanana({
            prompt: generatedPrompt,
            image_urls: [firstFrameImage],
            aspect_ratio: aspectRatio || "16:9",
            resolution: "4K"
        });

        if (!generatedImageUrl) {
            return NextResponse.json({ error: "No image generated" }, { status: 500 });
        }

        const { uploadFromUrl } = await import("@/lib/s3");
        const savedImageUrl = await uploadFromUrl(generatedImageUrl, "videos/end-frames");

        // Deduct credits
        if (user.role !== 'admin') {
            await deductCredits(user.id, ENDFRAME_COST, "Video End Frame Generation");
        }

        return NextResponse.json({
            status: "success",
            imageUrl: savedImageUrl,
            prompt: generatedPrompt
        });

    } catch (error: any) {
        console.error("[EndFrame] Error:", error);
        return NextResponse.json({ error: "Endframe generation failed" }, { status: 500 });
    }
}
