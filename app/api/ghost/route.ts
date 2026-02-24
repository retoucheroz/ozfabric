import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { SERVICE_COSTS } from "@/lib/pricingConstants";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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

const STRAIGHT_FRONT_PROMPT = `IMPORTANT ORIENTATION & POSE LOCK:
- CAMERA VIEW: Straight Front View (Full Front).
- The garment must face directly toward the camera.
- No angle, no 3/4 view, no rotation.
- DO NOT FLIP / DO NOT MIRROR.

FORM CORRECTION RULE:
If the reference garment is slightly tilted, asymmetrical, or uneven, correct it to a perfectly straight and symmetrical front view.
Align shoulders evenly.
Align hemline horizontally.
Center zipper, placket, and neckline.
Correct minor distortions while preserving original design.

TASK:
Create a photorealistic, studio-grade ghost mannequin (invisible mannequin) apparel product image on pure white background, 2:3 aspect ratio.

REFERENCE ROLES:
- Image 1 = MAIN GARMENT REFERENCE (silhouette and fit).
- Image 2 = LOGO / DETAIL LOCK.
- Image 3 = FABRIC / MATERIAL LOCK.

GHOST FORM:
Reconstruct a realistic worn 3D ghost mannequin form with natural shoulder curvature and sleeve volume.
Balanced and symmetrical structure.

LOGO & FABRIC LOCK:
Preserve all logos, placements, stitching, and textures exactly.

STUDIO OUTPUT:
Pure white background (#FFFFFF).
Soft, even studio lighting.
No background shadows.
Perfectly centered.`;

const STRAIGHT_BACK_PROMPT = `IMPORTANT ORIENTATION & POSE LOCK:
- CAMERA VIEW: Straight Back View (Full Back).
- The garment must face directly away from the camera.
- No angle, no rotation.
- DO NOT FLIP / DO NOT MIRROR.

FORM CORRECTION RULE:
If the reference is slightly rotated or uneven, straighten it into a perfectly aligned back view.
Shoulders symmetrical.
Hemline horizontal.
Center back seam aligned vertically.
Correct distortions but preserve original design.

TASK:
Create a photorealistic, studio-grade ghost mannequin apparel image on pure white background, 2:3 aspect ratio.

REFERENCE ROLES:
- Image 1 = MAIN GARMENT REFERENCE.
- Image 2 = LOGO / DETAIL LOCK.
- Image 3 = FABRIC / MATERIAL LOCK.

GHOST FORM:
Natural 3D worn ghost mannequin shape.
Balanced back drape and sleeve structure.

LOGO & FABRIC LOCK:
Preserve all back logos and details exactly.

STUDIO OUTPUT:
Pure white background (#FFFFFF).
Soft studio lighting.
Centered composition.`;

const FLATLAY_PROMPT = `IMPORTANT ORIENTATION LOCK:
- CAMERA VIEW: Direct Top-Down Flat Lay.
- Camera perfectly perpendicular to surface (90-degree overhead).
- No angle, no tilt, no perspective distortion.
- DO NOT FLIP / DO NOT MIRROR.

TASK:
Create a photorealistic, studio-grade flat lay apparel product image on pure white background, 2:3 aspect ratio.

REFERENCE ROLES:
- Image 1 = MAIN GARMENT REFERENCE (silhouette / fit / structure).
- Image 2 = LOGO / DETAIL LOCK.
- Image 3 = FABRIC / MATERIAL LOCK.

VIEW STANDARD:
Garment fully laid flat on a white surface.
Perfectly centered in frame.
Symmetrical alignment.
Top and bottom edges aligned vertically.
Hemline straight and horizontal.

FORM & STRUCTURE CORRECTION:
If the reference garment is wrinkled, tilted, or uneven:
- Correct it into a clean, ironed, symmetrical flat presentation.
- Smooth fabric naturally (no artificial plastic look).
- Align neckline to center.
- Align waist details and bow symmetrically.
- Maintain realistic garment proportions.
- Preserve natural fabric fall while keeping it tidy.

VOLUME CONTROL:
Maintain realistic 2D flat lay depth.
No mannequin shape.
No hanging look.
No floating look.

LOGO & FABRIC LOCK:
Preserve all logos, stitching, textures, weave patterns, and fabric details exactly.
Do not redesign or reinterpret patterns.

LIGHTING & SHADOW:
Soft, diffused studio lighting from above.
Very subtle natural grounding shadow directly underneath garment.
Shadow should be soft and light, not dramatic.
Avoid heavy drop shadow.

OUTPUT SPEC:
Pure white background (#FFFFFF).
High-resolution studio quality.
Clean commercial e-commerce look.`;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { images, angle, resolution, aspectRatio } = await req.json();

        const cost = resolution === "4K"
            ? SERVICE_COSTS.IMAGE_GENERATION.GHOST_MODEL_4K
            : SERVICE_COSTS.IMAGE_GENERATION.GHOST_MODEL_1_2K;

        if (user.role !== 'admin' && (user.credits || 0) < cost) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        if (!images || images.length === 0) {
            return NextResponse.json({ error: "At least one image required" }, { status: 400 });
        }

        let selectedPrompt = FRONT_ANGLE_PROMPT;
        if (angle === "back") selectedPrompt = BACK_ANGLE_PROMPT;
        else if (angle === "front_straight") selectedPrompt = STRAIGHT_FRONT_PROMPT;
        else if (angle === "back_straight") selectedPrompt = STRAIGHT_BACK_PROMPT;
        else if (angle === "flatlay") selectedPrompt = FLATLAY_PROMPT;

        const effectiveAspectRatio = aspectRatio || "2:3";
        selectedPrompt = selectedPrompt.replace(/2:3 aspect ratio/g, `${effectiveAspectRatio} aspect ratio`);

        const falKey = process.env.FAL_KEY;
        if (!falKey) return NextResponse.json({ error: "FAL_KEY missing" }, { status: 500 });

        const { ensureR2Url } = await import("@/lib/s3");
        const sanitizedImages = await Promise.all(
            images.filter(Boolean).map((img: string) => ensureR2Url(img, "ghost/inputs"))
        );

        const { generateWithNanoBanana } = await import('@/lib/nano-banana');
        const imageUrl = await generateWithNanoBanana({
            prompt: selectedPrompt,
            image_urls: sanitizedImages,
            aspect_ratio: effectiveAspectRatio,
            resolution: resolution || "1K"
        });

        if (!imageUrl) return NextResponse.json({ error: "No image in response" }, { status: 500 });

        // Deduct credits
        if (user.role !== 'admin') {
            await deductCredits(user.id, cost, `Ghost Mannequin (${angle})`);
        }

        return NextResponse.json({ status: "completed", imageUrl });

    } catch (error) {
        console.error("Ghost API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

