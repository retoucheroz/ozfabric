import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60; // Set timeout to 60s for generation

export async function POST(req: NextRequest) {
    try {
        const { prompt: userPrompt } = await req.json();
        if (!userPrompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

        const hfToken = process.env.HF_TOKEN;
        const geminiKey = process.env.GEMINI_API_KEY;

        if (!hfToken || !geminiKey) {
            return NextResponse.json({ error: "Configuration missing (HF_TOKEN or GEMINI_API_KEY)" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(geminiKey);

        // Models to try for prompt optimization (prioritize stable 1.5-flash)
        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-2.0-flash",
            "gemini-pro"
        ];

        let optimizedPrompt = "";
        let modelUsed = "";

        // 1. Prompt Optimization with Gemini (Keywords Only)
        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: "You are a Translator and Keyword Extractor. Your goal is to extract the MAIN SUBJECTS from the user's input and translate them to English.\n\nRULES:\n1. Output ONLY the comma-separated keywords.\n2. Do NOT add 'pattern', 'seamless', 'texture' or artistic words.\n3. Example: if user says 'aslan ve yaprak', output: 'lion, leaves'.\n4. If user describes a style, extract it as a keyword too."
                });

                const result = await model.generateContent(userPrompt);
                const text = result.response.text().trim();

                if (text && !text.includes("Error")) {
                    // We assume valid keywords
                    // Switch to "Wrapping Paper" style to force distinct object generation
                    optimizedPrompt = `seamless wrapping paper pattern featuring many small distinct (${text}) on white background, simple flat vector art, children's book illustration style, cute, clearly defined, high quality`;
                    modelUsed = modelName;
                    break;
                }
            } catch (e: any) {
                console.warn(`Failed with ${modelName}:`, e.message);
                continue;
            }
        }

        if (!modelUsed || !optimizedPrompt) {
            console.warn("All Gemini models failed. Using algorithmic fallback.");
            optimizedPrompt = `seamless wrapping paper pattern featuring many small distinct ${userPrompt}, white background, flat vector art, simple illustration, high quality`;
        }

        console.log("Final Prompt to SDXL:", optimizedPrompt);

        // 2. Generate Image with SDXL via Hugging Face Inference API
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
                    guidance_scale: 9.0, // Increased to 9.0 to force sticking to the 'distinct objects' instruction
                    width: 1024,
                    height: 1024
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("HF API Error:", errorText);

            if (response.status === 503) {
                return NextResponse.json({ error: "Model yükleniyor, lütfen 20 saniye sonra tekrar deneyin" }, { status: 503 });
            }
            return NextResponse.json({ error: `HF API Error: ${errorText}` }, { status: response.status });
        }

        // 3. Process Response
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        return NextResponse.json({
            status: "completed",
            imageUrl: dataUrl,
            prompt: optimizedPrompt,
            originalPrompt: userPrompt
        });

    } catch (error: any) {
        console.error("Pattern Generation Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
