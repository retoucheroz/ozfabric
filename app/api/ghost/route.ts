import { NextRequest, NextResponse } from "next/server";

const MOCK_GHOST = "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";

// Ghost Mannequin Prompts
const FRONT_ANGLE_PROMPT = `IMPORTANT ORIENTATION & POSE LOCK:
- CAMERA VIEW: Front 3/4 (Front-Left Three-Quarter).
- POSE DIRECTION: The garment's arms and overall orientation must point toward the CAMERA-LEFT (Sırtı sağa, göğsü sola doğru).
- DO NOT FLIP / DO NOT MIRROR.

TASK:
Create a photorealistic, studio-grade ghost mannequin (invisible mannequin) apparel product image on pure white background, in 2:3 aspect ratio.

REFERENCE ROLES:
- Image 1 = MAIN GARMENT REFERENCE (silhouette/fit).
- Image 2 = LOGO / DETAIL LOCK.
- Image 3 = FABRIC / MATERIAL LOCK.

VIEW STANDARD:
Rotate the garment so the LEFT side panel is prominently visible. Yaw angle: 30 degrees toward camera-left. Arms must look like they are pointing left.

GHOST FORM:
Reconstruct a worn 3D ghost mannequin form with rounded shoulders and realistic sleeve volume.

LOGO & FABRIC LOCK:
Preserve all logos and fabric textures exactly from the reference images.

STUDIO OUTPUT:
Pure white background (#FFFFFF), soft studio lighting, perfectly centered, 2:3 aspect ratio.`;

const BACK_ANGLE_PROMPT = `IMPORTANT ORIENTATION & POSE LOCK:
- CAMERA VIEW: Back 3/4 (Back-Right Three-Quarter).
- POSE DIRECTION: The garment's arms and overall orientation must point toward the CAMERA-RIGHT (Göğsü sağa, sırtı sola doğru).
- DO NOT FLIP / DO NOT MIRROR.

TASK:
Create a photorealistic, studio-grade ghost mannequin (invisible mannequin) apparel product image on pure white background, in 2:3 aspect ratio.

REFERENCE ROLES:
- Image 1 = MAIN GARMENT REFERENCE (silhouette/fit).
- Image 2 = LOGO / GRAPHIC LOCK.
- Image 3 = FABRIC / MATERIAL LOCK.

VIEW STANDARD:
Rotate the garment so the RIGHT side panel (back view) is visible. Yaw angle: 30 degrees toward camera-right. Arms must look like they are pointing right.

GHOST FORM:
Reconstruct a worn 3D ghost mannequin form with realistic back structure.

STUDIO OUTPUT:
Pure white background (#FFFFFF), soft studio lighting, perfectly centered, 2:3 aspect ratio.`;

export async function POST(req: NextRequest) {
    try {
        const { images, angle, resolution } = await req.json();

        if (!images || images.length === 0) {
            return NextResponse.json({ error: "At least one image required" }, { status: 400 });
        }

        const selectedPrompt = angle === "back" ? BACK_ANGLE_PROMPT : FRONT_ANGLE_PROMPT;
        const falKey = process.env.FAL_KEY;

        if (!falKey) {
            console.log("[MOCK GHOST] No FAL_KEY set.");
            await new Promise((r) => setTimeout(r, 2500));
            return NextResponse.json({
                status: "completed",
                imageUrl: MOCK_GHOST,
                message: "Mock mode (set key)"
            });
        }

        // fal.ai/nano-banana-pro/edit (Exact schema based on docs)
        const response = await fetch("https://fal.run/fal-ai/nano-banana-pro/edit", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: selectedPrompt,
                image_urls: images.filter(Boolean), // Array of URLs (supports up to 14)
                aspect_ratio: "2:3",
                resolution: resolution || "1K"
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Fal API error:", response.status, errorText);
            return NextResponse.json({ error: "Image generation failed", details: errorText }, { status: 500 });
        }

        const data = await response.json();
        const imageUrl = data.images?.[0]?.url;

        if (imageUrl) {
            return NextResponse.json({ status: "completed", imageUrl: imageUrl });
        }

        return NextResponse.json({ error: "No image in response" }, { status: 500 });

    } catch (error) {
        console.error("Ghost API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
