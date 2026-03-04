import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { SERVICE_COSTS } from "@/lib/pricingConstants";

export const dynamic = 'force-dynamic';

const PRODUCT_PROMPT_TEMPLATE = `TASK:
Create a professional, high-end commercial product photograph of the item provided in the reference images.

SCENE SETTING:
{PROMPT}

STYLE REQUIREMENTS:
- Studio-grade lighting (rim lighting, soft shadows, highlights).
- Hyper-realistic textures and materials.
- Clean and minimal environment that complements the product.
- Sharp focus on the product, subtle depth of field for the background.

REFERENCE ROLES:
- Image 1 = MAIN PRODUCT REFERENCE (shape, form, primary appearance).
- Image 2 = DETAIL / TEXTURE LOCK (optional close-up details).
- Image 3 = ALTERNATE VIEW / MATERIAL LOCK (optional).

TECHNICAL SPEC:
- ASPECT RATIO: {ASPECT_RATIO}
- QUALITY: Commercial Photography Level.
- BACKGROUND: Cohesive with the scene setting prompt.

DO NOT:
- Include text or watermarks.
- Distort the product's original shape.
- Use low-quality background elements.`;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { images, prompt, resolution, aspectRatio } = await req.json();

        const cost = resolution === "4K"
            ? SERVICE_COSTS.IMAGE_GENERATION.PRODUCT_MODEL_4K
            : SERVICE_COSTS.IMAGE_GENERATION.PRODUCT_MODEL_1_2K;

        if (user.role !== 'admin' && (user.credits || 0) < cost) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        if (!images || images.length === 0) {
            return NextResponse.json({ error: "At least one image required" }, { status: 400 });
        }

        const effectiveAspectRatio = aspectRatio || "1:1";
        const finalPrompt = PRODUCT_PROMPT_TEMPLATE
            .replace("{PROMPT}", prompt || "Professional studio product shot on a minimal neutral background.")
            .replace("{ASPECT_RATIO}", effectiveAspectRatio);

        const falKey = process.env.FAL_KEY;
        if (!falKey) return NextResponse.json({ error: "FAL_KEY missing" }, { status: 500 });

        const { ensureR2Url } = await import("@/lib/s3");
        const sanitizedImages = await Promise.all(
            images.filter(Boolean).map((img: string) => ensureR2Url(img, "product/inputs"))
        );

        const { generateWithNanoBanana } = await import('@/lib/nano-banana');
        const imageUrl = await generateWithNanoBanana({
            prompt: finalPrompt,
            image_urls: sanitizedImages,
            aspect_ratio: effectiveAspectRatio,
            resolution: resolution || "1K"
        });

        if (!imageUrl) return NextResponse.json({ error: "No image in response" }, { status: 500 });

        // Deduct credits
        if (user.role !== 'admin') {
            await deductCredits(user.id, cost, `Product Photography (${resolution})`);
        }

        return NextResponse.json({ status: "completed", imageUrl });

    } catch (error) {
        console.error("Product API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
