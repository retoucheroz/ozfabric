import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { key, contentType } = body as { key?: string; contentType?: string };

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  const Bucket = process.env.AWS_S3_BUCKET || process.env.R2_BUCKET as string;
  const Region = process.env.AWS_REGION || "eu-central-1";

  if (!Bucket) {
    return NextResponse.json({ error: "Missing AWS_S3_BUCKET or R2_BUCKET" }, { status: 500 });
  }

  const cmd = new PutObjectCommand({
    Bucket,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });

  const uploadUrl = await getSignedUrl(r2, cmd, { expiresIn: 60 }); // 60 sn

  const finalUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`
    : `https://${Bucket}.s3.${Region}.amazonaws.com/${key}`;

  return NextResponse.json({ uploadUrl, finalUrl });
}
