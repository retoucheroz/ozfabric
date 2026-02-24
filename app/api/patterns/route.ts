import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const PATTERN_COST = 10;
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.role !== 'admin' && (user.credits || 0) < PATTERN_COST) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        const { prompt: userPrompt } = await req.json();
        if (!userPrompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

        const hfToken = process.env.HF_TOKEN;
        const geminiKey = process.env.GEMINI_API_KEY;

        if (!hfToken || !geminiKey) {
            return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are a Translator and Keyword Extractor. Extract MAIN SUBJECTS only. Output comma-separated keywords."
        });

        const result = await model.generateContent(userPrompt);
        const text = result.response.text().trim();
        const optimizedPrompt = `seamless wrapping paper pattern featuring many small distinct (${text}) on white background, simple flat vector art, children's book illustration style, cute, clearly defined, high quality`;

        console.log("Final Prompt to SDXL:", optimizedPrompt);

        const response = await fetch("https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${hfToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: optimizedPrompt,
                parameters: {
                    negative_prompt: "symmetry, mirror, kaleidoscope, geometric, abstract, distorted, blurry, complex, dark, shadows, 3d, realistic, painting, oil",
                    num_inference_steps: 35,
                    guidance_scale: 9.0,
                    width: 1024,
                    height: 1024
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 503) return NextResponse.json({ error: "Model loading, try again in 20s" }, { status: 503 });
            return NextResponse.json({ error: `HF API Error: ${errorText}` }, { status: response.status });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const dataUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;

        const { uploadBase64 } = await import("@/lib/s3");
        const finalUrl = await uploadBase64(dataUrl, "patterns") || dataUrl;

        // Deduct credits
        if (user.role !== 'admin') {
            await deductCredits(user.id, PATTERN_COST, "Pattern Generation");
        }

        return NextResponse.json({
            status: "completed",
            imageUrl: finalUrl,
            prompt: optimizedPrompt,
            originalPrompt: userPrompt
        });

    } catch (error: any) {
        console.error("Pattern Generation Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
