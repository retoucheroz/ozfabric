import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const DEPTH_COST = 10;
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role !== 'admin' && (user.credits || 0) < DEPTH_COST) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const body = await req.json();
    const { image_url } = body;

    if (!image_url) {
      return NextResponse.json({ error: "image_url is required" }, { status: 400 });
    }

    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });

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

    if (!response.ok) throw new Error(`Depth API error: ${response.status}`);

    const data = await response.json();
    const depthMapUrl = data?.image?.url;

    if (!depthMapUrl) throw new Error("No depth map URL in response");

    const { uploadFromUrl } = await import("@/lib/s3");
    const savedDepthUrl = await uploadFromUrl(depthMapUrl, "depth-maps");

    // Deduct credits
    if (user.role !== 'admin') {
      await deductCredits(user.id, DEPTH_COST, "Depth Estimation");
    }

    return NextResponse.json({ depthMapUrl: savedDepthUrl });
  } catch (error: any) {
    console.error("Depth estimation error:", error);
    return NextResponse.json({ error: "Depth estimation failed" }, { status: 500 });
  }
}
