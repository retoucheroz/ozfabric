import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { base64, fileName, contentType, folder = "library" } = await req.json();

        if (!base64) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        // Clean base64 data
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const finalContentType = contentType || "image/png";
        const extension = finalContentType.split("/")[1] || "png";

        const safeName = (fileName || "upload").replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}_${safeName}`;

        const Bucket = process.env.AWS_S3_BUCKET || process.env.R2_BUCKET;
        if (!Bucket) throw new Error("Bucket not configured");

        await r2.send(new PutObjectCommand({
            Bucket,
            Key: key,
            Body: buffer,
            ContentType: finalContentType,
        }));

        const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
        const Region = process.env.AWS_REGION || "eu-central-1";

        const finalUrl = publicBase
            ? `${publicBase.replace(/\/$/, "")}/${key}`
            : `https://${Bucket}.s3.${Region}.amazonaws.com/${key}`;

        console.log("Server-side upload successful:", finalUrl);

        return NextResponse.json({ url: finalUrl, success: true });

    } catch (error: any) {
        console.error("R2 Server API Error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
