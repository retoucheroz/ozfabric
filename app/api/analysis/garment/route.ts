import { NextRequest, NextResponse } from "next/server";
import { analyzeGarmentImage } from "@/lib/gemini/analyzeGarment";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        let userApiKey = undefined;

        if (session?.user?.id) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { allowOwnApiKeys: true, geminiApiKey: true }
            });
            if (user?.allowOwnApiKeys && user.geminiApiKey) {
                userApiKey = user.geminiApiKey;
            }
        }

        const { image, mimeType } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "Image data is required" }, { status: 400 });
        }

        // image should be base64 string without the prefix
        const result = await analyzeGarmentImage(image, mimeType || "image/jpeg", userApiKey);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Garment analysis API error:", error);
        return NextResponse.json({
            error: error.message || "Analysis failed",
            details: error.stack
        }, { status: 500 });
    }
}
