import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const HEAD_SWAP_PROMPT = `image_urls[0] = identity source (full head: hair, hairline, forehead, ears, face, jawline, head shape). No lighting reference.
image_urls[1] = base image (pose, head direction, eye direction, camera angle, perspective, neck, lighting, shadows, white balance, framing, composition, crop).
Swap the full head from image_urls[0] onto image_urls[1]. Identity image must be used for geometry and facial structure only, not for lighting information. Preserve the exact facial identity from image_urls[0] with full fidelity: same eyes, nose, lips, eyebrows, jawline, facial proportions, and skin texture. Do not alter, soften, or reinterpret any facial features. Head direction must be identical to image_urls[1]. Match base image head angle, rotation, tilt, eye direction, neck alignment, and perspective exactly. Re-light the new head to match base image lighting direction, softness, shadow density, and color temperature. Skin tone and exposure must match base. Final head must appear as if originally photographed in image_urls[1] environment. Maintain the exact same framing, crop, composition, camera distance, and field of view from image_urls[1]. The output image must have identical framing to the base image. Everything except the head remains unchanged. Photorealistic seamless neck connection.`;

const HEAD_SWAP_NEGATIVE = `mismatched lighting, yellow cast, double face, ghosting, morphed identity, pasted look, visible seam, neck disconnect, lighting from reference, pose from reference, blending, morphing, averaging, unnatural skin transition, overexposure, flat lighting, altered facial features, changed face shape, softened features, identity drift, face modification, smoothed details, lost resemblance, reframed, zoomed in, zoomed out, different crop, changed composition, different camera angle, different field of view`;

const FACE_SWAP_PROMPT = `image_urls[0] = face identity source (eyes, eyebrows, nose, lips, cheeks, facial structure). No lighting reference.
image_urls[1] = base image (hair, head shape, ears, head direction, eye direction, camera angle, neck, lighting, shadows, white balance, framing, composition, crop).
Replace only the facial features in image_urls[1] with face identity from image_urls[0]. Identity image must be used for geometry and facial structure only, not for lighting information. Preserve the exact facial identity from image_urls[0] with full fidelity: same eyes, nose, lips, eyebrows, cheekbones, facial proportions, and skin texture. Do not alter, soften, or reinterpret any facial features. Head direction must be identical to image_urls[1]. Keep hair, hairline, skull shape, ears, head size from base. Match base head angle, tilt, eye direction exactly. Re-light the face to match base image lighting direction, softness, shadow density, and color temperature. Skin tone and exposure match base. Final face must appear as if originally photographed in image_urls[1] environment. Maintain the exact same framing, crop, composition, camera distance, and field of view from image_urls[1]. The output image must have identical framing to the base image. Everything except the face remains unchanged. Photorealistic seamless skin transition.`;

const FACE_SWAP_NEGATIVE = `mismatched lighting, yellow cast, double face, ghosting, morphed identity, pasted look, visible seam, hair change, head shape change, lighting from reference, pose from reference, blending, morphing, averaging, unnatural skin transition, overexposure, flat lighting, ear change, hairline shift, altered facial features, changed face shape, softened features, identity drift, face modification, smoothed details, lost resemblance, reframed, zoomed in, zoomed out, different crop, changed composition, different camera angle, different field of view`;

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

        const prompt = swapMode === 'head_swap' ? HEAD_SWAP_PROMPT : FACE_SWAP_PROMPT;
        const negative_prompt = swapMode === 'head_swap' ? HEAD_SWAP_NEGATIVE : FACE_SWAP_NEGATIVE;

        const falPayload = {
            image_urls: [referenceImageUrl, baseImageUrl],
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
        return NextResponse.json({
            image: data.images?.[0]?.url,
            status: "success"
        });

    } catch (error: any) {
        console.error("Face/Head Swap Error:", error);
        return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
    }
}
