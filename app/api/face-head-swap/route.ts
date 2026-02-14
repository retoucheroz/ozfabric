import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const HEAD_SWAP_PROMPT = `image_urls[0] = ONLY provides facial identity: eyes, nose, lips, eyebrows, jawline, facial proportions, skin texture. IGNORE everything else from this image including pose, angle, camera distance, and framing.
image_urls[1] = MASTER REFERENCE for everything: body pose, head direction, head tilt, head rotation, eye gaze direction, camera angle, camera distance, field of view, framing, crop, composition, perspective, neck position, shoulder position, clothing, background, lighting, shadows, white balance.
Transfer only the facial identity from image_urls[0] onto the head in image_urls[1]. The body pose, head direction, and camera framing in the output MUST be identical to image_urls[1]. Do not rotate, re-angle, or reposition the head. Do not change the camera distance or crop. The person in the output must be facing the same direction, at the same angle, with the same body position as image_urls[1]. Re-light the face to match image_urls[1] lighting. Preserve exact facial identity with full fidelity. Final result must look like image_urls[1] with only the face replaced. Photorealistic seamless neck connection.`;

const HEAD_SWAP_NEGATIVE = `different pose, rotated head, turned head, different head angle, facing camera, facing forward, changed body position, different camera distance, zoomed in, zoomed out, reframed, different crop, changed composition, different field of view, pose from reference, angle from reference, mismatched lighting, yellow cast, double face, ghosting, morphed identity, pasted look, visible seam, neck disconnect, blending, morphing, averaging, altered facial features, softened features, identity drift, lost resemblance`;

const FACE_SWAP_PROMPT = `image_urls[0] = ONLY provides facial identity: eyes, nose, lips, eyebrows, cheekbones, facial proportions, skin texture. IGNORE everything else from this image including pose, angle, camera distance, and framing.
image_urls[1] = MASTER REFERENCE for everything: hair, head shape, ears, body pose, head direction, head tilt, head rotation, eye gaze direction, camera angle, camera distance, field of view, framing, crop, composition, perspective, neck position, shoulder position, clothing, background, lighting, shadows, white balance.
Transfer only the facial features from image_urls[0] onto the face in image_urls[1]. The body pose, head direction, and camera framing in the output MUST be identical to image_urls[1]. Do not rotate, re-angle, or reposition the head. Do not change the camera distance or crop. Keep hair, hairline, skull shape, ears, head size from image_urls[1]. The person in the output must be facing the same direction, at the same angle, with the same body position as image_urls[1]. Re-light the face to match image_urls[1] lighting. Preserve exact facial identity with full fidelity. Final result must look like image_urls[1] with only the facial features replaced. Photorealistic seamless skin transition.`;

const FACE_SWAP_NEGATIVE = `different pose, rotated head, turned head, different head angle, facing camera, facing forward, changed body position, different camera distance, zoomed in, zoomed out, reframed, different crop, changed composition, different field of view, pose from reference, angle from reference, mismatched lighting, yellow cast, double face, ghosting, morphed identity, pasted look, visible seam, hair change, head shape change, blending, morphing, averaging, altered facial features, softened features, identity drift, lost resemblance, ear change, hairline shift`;

export async function POST(req: NextRequest) {
    try {
        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 });
        }

        const body = await req.json();
        const { referenceImageUrl, baseImageUrl, swapMode, resolution = "1K", aspectRatio = "3:4" } = body;

        if (!referenceImageUrl || !baseImageUrl) {
            return NextResponse.json({ error: "Both images are required" }, { status: 400 });
        }

        const { ensureR2Url } = await import("@/lib/r2");
        const [sanitizedRef, sanitizedBase] = await Promise.all([
            ensureR2Url(referenceImageUrl, "face-swap/ref"),
            ensureR2Url(baseImageUrl, "face-swap/base")
        ]);

        const prompt = swapMode === 'head_swap' ? HEAD_SWAP_PROMPT : FACE_SWAP_PROMPT;
        const negative_prompt = swapMode === 'head_swap' ? HEAD_SWAP_NEGATIVE : FACE_SWAP_NEGATIVE;

        const falPayload = {
            image_urls: [sanitizedRef, sanitizedBase],
            prompt,
            negative_prompt,
            output_format: "png",
            resolution,
            aspect_ratio: aspectRatio
        };

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

        // Persist to R2 if configured
        if (imageUrl && process.env.R2_BUCKET) {
            try {
                const { uploadFromUrl } = await import("@/lib/r2");
                imageUrl = await uploadFromUrl(imageUrl, "face-swap");
                console.log('FaceSwap Persisted to R2:', imageUrl);
            } catch (r2Error) {
                console.error('R2 faceswap persistence error:', r2Error);
            }
        }

        return NextResponse.json({
            image: imageUrl,
            status: "success"
        });

    } catch (error: any) {
        console.error("Face/Head Swap Error:", error);
        return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
    }
}
