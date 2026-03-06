import { NextRequest, NextResponse } from "next/server";
import { analyzeGarmentImage } from "@/lib/gemini/analyzeGarment";

export async function POST(req: NextRequest) {
    try {
        const { image, mimeType } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "Image data is required" }, { status: 400 });
        }

        // image should be base64 string without the prefix
        const result = await analyzeGarmentImage(image, mimeType || "image/jpeg");

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Garment analysis API error:", error);
        return NextResponse.json({
            error: error.message || "Analysis failed",
            details: error.stack
        }, { status: 500 });
    }
}
