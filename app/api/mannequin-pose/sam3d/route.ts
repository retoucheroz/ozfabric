import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const falKey = process.env.FAL_KEY;
        if (!falKey) return NextResponse.json({ error: "FAL_KEY required" }, { status: 500 });
        fal.config({ credentials: falKey });

        const { imageUrl } = await req.json();

        if (!imageUrl) return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });

        const result = await fal.subscribe("fal-ai/sam-3/3d-body", {
            input: {
                image_url: imageUrl,
                export_meshes: true,
                include_3d_keypoints: false
            }
        });

        return NextResponse.json({
            glbUrl: result.data.model_glb?.url || result.data.model_glb,
            visualization: result.data.visualization,
            meshes: result.data.meshes,
            metadata: result.data.metadata
        });

    } catch (error: any) {
        console.error("SAM3D API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process SAM3D" }, { status: 500 });
    }
}
