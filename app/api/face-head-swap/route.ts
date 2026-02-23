import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser } from "@/lib/auth";
import { deductCredits } from "@/lib/postgres";
import { SERVICE_COSTS } from "@/lib/pricingConstants";

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const HEAD_SWAP_PROMPT = `Use Image 2 as the ABSOLUTE MASTER for the entire body, pose, clothing, neck position, head orientation, and background.
DO NOT change anything in Image 2 except for the head identity.

Task: Replace the head of the person in Image 2 with the head identity from Image 1.

CRITICAL RULES:
1. Zero changes to body pose, arm positions, shoulder alignment, or neck position of Image 2.
2. The FINAL head must inherit the EXACT head orientation of Image 2:
– same rotation (left/right turn)
– same tilt (up/down angle)
– same roll (side lean)
– same eye direction
3. If the person in Image 2 is looking right, down, or away, the swapped head MUST follow that exact direction.
4. Image 1 is strictly for identity (facial structure, skin texture, hair). Do NOT copy head pose, camera angle, or gaze from Image 1.
5. Perspective-warp and anatomically adapt the head from Image 1 to perfectly match the 3D spatial orientation of Image 2.

Photorealistic integration. Perfect neck connection. Perfect light matching to Image 2. No visible compositing.`;

const FACE_SWAP_PROMPT = `Use Image 2 as the ABSOLUTE MASTER for the entire body, pose, clothing, neck position, head-shape, hair, and background.
DO NOT change anything in Image 2 except for the facial features.

Task: Transplant the facial features from Image 1 onto the face of the person in Image 2.

CRITICAL RULES:
1. Zero changes to hair, hairline, ears, head-shape, body pose, or neck position of Image 2.
2. The NEW facial features must inherit the EXACT face orientation of Image 2:
– same rotation (left/right turn)
– same tilt (up/down angle)
– same roll (side lean)
– same eye direction
3. If the person in Image 2 is looking right, down, or away, the transplanted facial features MUST follow that exact direction.
4. Image 1 is strictly for identity (eyes, nose, mouth structure, skin texture). Do NOT copy head pose, camera angle, or gaze from Image 1.
5. Perspective-warp and anatomically adapt the facial features from Image 1 to perfectly match the 3D spatial orientation of the face in Image 2.

Photorealistic integration. Seamless blending with the existing skin and hair of Image 2. Perfect light matching to Image 2. No facial distortion.`;

export async function POST(req: NextRequest) {
    try {
        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 });
        }

        const body = await req.json();
        const { referenceImageUrl, baseImageUrl, swapMode, resolution = "1K", aspectRatio = "3:4", seed = null } = body;

        if (!referenceImageUrl || !baseImageUrl) {
            return NextResponse.json({ error: "Both images are required" }, { status: 400 });
        }

        // --- CREDIT CHECK ---
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        const user = await getUser(session.username);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const cost = resolution === "4K"
            ? SERVICE_COSTS.IMAGE_GENERATION.FACE_SWAP_4K
            : SERVICE_COSTS.IMAGE_GENERATION.FACE_SWAP_1_2K;

        if (user.role !== 'admin' && (user.credits || 0) < cost) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }
        // --- END CREDIT CHECK ---

        const { ensureR2Url } = await import("@/lib/s3");
        const [sanitizedRef, sanitizedBase] = await Promise.all([
            ensureR2Url(referenceImageUrl, "face-swap/ref"),
            ensureR2Url(baseImageUrl, "face-swap/base")
        ]);

        const prompt = swapMode === 'head_swap' ? HEAD_SWAP_PROMPT : FACE_SWAP_PROMPT;

        const { generateWithNanoBanana } = await import('@/lib/nano-banana');

        const payload: any = {
            image_urls: [sanitizedRef, sanitizedBase],
            prompt,
            resolution,
            aspect_ratio: aspectRatio
        };

        if (seed !== null && seed !== undefined && seed !== "") {
            payload.seed = Number(seed);
        }

        const imageUrl = await generateWithNanoBanana(payload);

        // Deduct credits after success (or before, depending on policy)
        if (user.role !== 'admin') {
            await deductCredits(user.username, cost, `${swapMode === 'head_swap' ? 'Head' : 'Face'} Swap (${resolution})`);
        }

        return NextResponse.json({
            image: imageUrl,
            seed: payload.seed || null,
            status: "success"
        });

    } catch (error: any) {
        console.error("Face/Head Swap Error:", error);
        return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
    }
}
