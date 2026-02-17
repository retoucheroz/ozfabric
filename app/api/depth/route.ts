import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Depth estimation using fal.ai Marigold (sync endpoint)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image_url } = body;

    if (!image_url) {
      return NextResponse.json({ error: "image_url is required" }, { status: 400 });
    }

    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) {
      return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });
    }

    // Call Marigold Depth Estimation — fal.run accepts data URIs directly
    const response = await fetch("https://fal.run/fal-ai/imageutils/marigold-depth", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: image_url,
        num_inference_steps: 10,
        ensemble_size: 5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Marigold API error:", response.status, errText);
      throw new Error(`Depth API error: ${response.status}`);
    }

    const data = await response.json();

    // Response: { image: { url: "https://...", content_type: "image/png", ... } }
    const depthMapUrl = data?.image?.url;

    if (!depthMapUrl) {
      console.error("Unexpected response:", JSON.stringify(data).slice(0, 500));
      throw new Error("No depth map URL in response");
    }

    const { ensureS3Url } = await import("@/lib/s3");
    const savedDepthUrl = await ensureS3Url(depthMapUrl, "depth-maps");

    return NextResponse.json({ depthMapUrl: savedDepthUrl });
  } catch (error: any) {
    console.error("Depth estimation error:", error);
    return NextResponse.json(
      { error: error.message || "Depth estimation failed" },
      { status: 500 }
    );
  }
}
