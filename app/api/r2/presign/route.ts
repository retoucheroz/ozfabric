import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/s3";

export async function POST(req: Request) {
  const body = await req.json();
  const { key, contentType } = body as { key?: string; contentType?: string };

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  const Bucket = process.env.R2_BUCKET as string;
  if (!Bucket) {
    return NextResponse.json({ error: "Missing R2_BUCKET" }, { status: 500 });
  }

  const cmd = new PutObjectCommand({
    Bucket,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });

  const uploadUrl = await getSignedUrl(r2, cmd, { expiresIn: 60 }); // 60 sn

  return NextResponse.json({ uploadUrl });
}
