import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { ensureS3Url } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { assets } = await req.json();
        if (!assets || typeof assets !== "object") {
            return NextResponse.json({ error: "Invalid assets object" }, { status: 400 });
        }

        const synchedAssets: Record<string, string> = {};

        // We only process base64 assets to save time/bandwidth
        const keys = Object.keys(assets);

        // We can process these in parallel for speed
        await Promise.all(keys.map(async (key) => {
            const val = assets[key];
            if (val && typeof val === "string" && val.startsWith("data:image")) {
                synchedAssets[key] = await ensureS3Url(val, "batch-sync");
            } else {
                synchedAssets[key] = val;
            }
        }));

        return NextResponse.json({ assets: synchedAssets });
    } catch (e: any) {
        console.error("BATCH_UPLOAD_ERROR:", e);
        return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
    }
}
