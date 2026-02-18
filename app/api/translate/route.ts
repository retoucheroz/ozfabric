import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
        }

        const body = await req.json();
        const { text, targetLanguage = 'en' } = body;

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const prompt = `Translate the following fashion-related product name or term to ${targetLanguage === 'en' ? 'English' : 'Turkish'}. 
        Provide ONLY the translated text, no explanation.
        Text: "${text}"`;

        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();

        return NextResponse.json({ translation: translatedText });
    } catch (error) {
        console.error("Translation API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
