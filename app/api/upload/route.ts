import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { ensureS3Url } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { image, path } = await req.json();
        if (!image) return NextResponse.json({ error: "Missing image" }, { status: 400 });

        const s3Url = await ensureS3Url(image, path || "uploads");
        return NextResponse.json({ url: s3Url });
    } catch (e: any) {
        console.error("UPLOAD_ERROR:", e);
        return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
    }
}
