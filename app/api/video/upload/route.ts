import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Upload a base64 image to fal.ai storage and return the URL.
 * This endpoint exists to keep individual uploads small and avoid
 * the Next.js body size limit when sending multiple large images at once.
 */
export async function POST(req: NextRequest) {
    try {
        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 });
        }

        fal.config({ credentials: falKey });

        const body = await req.json();
        const { image, filename } = body;

        if (!image) {
            return NextResponse.json({ error: "Image data is required" }, { status: 400 });
        }

        // Convert base64 to blob
        let base64 = image;
        let mimeType = "image/png";

        if (image.includes(",")) {
            const parts = image.split(",");
            const match = parts[0].match(/:(.*?);/);
            if (match) mimeType = match[1];
            base64 = parts[1];
        }

        const byteCharacters = atob(base64);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const blob = new Blob([byteNumbers.buffer], { type: mimeType });
        const file = new File([blob], filename || "image.png", { type: mimeType });

        const uploadedUrl = await fal.storage.upload(file);

        return NextResponse.json({ url: uploadedUrl });

    } catch (error: any) {
        console.error("[Upload] Error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
