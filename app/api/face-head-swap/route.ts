import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const HEAD_SWAP_PROMPT = `Use Image 2 as the ABSOLUTE MASTER for the entire body, pose, clothing, neck position, and background. DO NOT change anything in Image 2 except for the head.

Task: Place the head from Image 1 onto the person in Image 2.

CRITICAL RULES:
- Zero changes to the body pose, arm positions, or shoulder alignment of Image 2.
- The new head must be anatomically integrated, matching the EXACT spatial rotation, head-tilt, and eye-gaze direction of the original person in Image 2.
- If Image 2 is looking away or at an angle, the identity from Image 1 must be perspective-warped and rotated to match.
- Image 1 is strictly for identity (facial features/hair). Ignore its camera angle and pose.

Photorealistic, seamless neck blending, perfect light matching to Image 2.`;

const FACE_SWAP_PROMPT = `Use Image 2 as the ABSOLUTE MASTER for the entire head-shape, hair, body, pose, and background. DO NOT change anything in Image 2 except for the facial features.

Task: Transplant the facial features from Image 1 onto the face in Image 2.

CRITICAL RULES:
- Zero changes to the hair, hairline, ears, or body of Image 2.
- Re-project the eyes, nose, and mouth from Image 1 to perfectly fit the EXACT rotation, tilt, and 3D angle of the head in Image 2.
- The resulting face must look identical to the identity in Image 1 but following the perspective of Image 2.
- Match lighting and skin tone of Image 2 flawlessly.

Photorealistic result with no facial distortion.`;

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

        const { ensureR2Url } = await import("@/lib/s3");
        const [sanitizedRef, sanitizedBase] = await Promise.all([
            ensureR2Url(referenceImageUrl, "face-swap/ref"),
            ensureR2Url(baseImageUrl, "face-swap/base")
        ]);

        const prompt = swapMode === 'head_swap' ? HEAD_SWAP_PROMPT : FACE_SWAP_PROMPT;

        const falPayload: any = {
            image_urls: [sanitizedRef, sanitizedBase],
            prompt,
            output_format: "png",
            resolution,
            aspect_ratio: aspectRatio
        };

        if (seed !== null && seed !== undefined && seed !== "") {
            falPayload.seed = Number(seed);
        }

        const response = await fetch("https://fal.run/fal-ai/nano-banana-pro/edit", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(falPayload),
        });

        if (!response.ok) {
            const err = await response.text();
            return NextResponse.json({ error: `Fal API Error: ${err}` }, { status: 500 });
        }

        const data = await response.json();
        let imageUrl = data.images?.[0]?.url;
        const usedSeed = data.seed;

        // Persist to R2/S3
        if (imageUrl) {
            try {
                const { uploadFromUrl } = await import("@/lib/s3");
                imageUrl = await uploadFromUrl(imageUrl, "face-swap");
                console.log('FaceSwap Persisted to S3:', imageUrl);
            } catch (r2Error) {
                console.error('S3 faceswap persistence error:', r2Error);
            }
        }

        return NextResponse.json({
            image: imageUrl,
            seed: usedSeed,
            status: "success"
        });

    } catch (error: any) {
        console.error("Face/Head Swap Error:", error);
        return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
    }
}
