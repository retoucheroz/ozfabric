import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { camera, lens, focalLength, aperture, language = "tr" } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            As a professional cinematographer and optical expert, analyze the following camera gear combination:
            - Camera Body: ${camera}
            - Lens: ${lens}
            - Focal Length: ${focalLength}mm
            - Aperture: ${aperture}

            Task: Describe how this specific optics setup affects the visual characteristics of a photograph. 
            Focus on:
            1. Sharpness vs Softness (center to edges)
            2. Bokeh character (swirly, creamy, busy, elliptical)
            3. Optical artifacts (Vignetting, Chromatic Aberration, Halation, Bloom, Flare)
            4. Color and Texture (vintage contrast, modern crispness, film grain feel)

            Strict Rule: The output must be a single, highly descriptive and technical paragraph in ${language === "tr" ? "Turkish" : "English"}.
            Style: Use professional "Studio Pro" terminology. 

            Example Tone: "merkezde temiz ve kontrastlı bir ana konu sunarken köşelere doğru belirgin vinyet, açık diyaframda mor-yeşil chromatic aberration, parlak highlight’larda hafif halation ve bloom oluşturarak; arka planda ise swirly bokeh ve alan eğriliğiyle görüntüyü modern sensör netliğinin içinde bilinçli biçimde analog, ham ve sinematik bir estetiğe taşır."
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        return NextResponse.json({ analysis: text });
    } catch (error: any) {
        console.error("Gemini Analysis Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
