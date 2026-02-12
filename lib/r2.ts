import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
});

export async function uploadFromUrl(url: string, prefix: string = "generations") {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image from Fal");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/png";
    const extension = contentType.split("/")[1] || "png";
    const key = `${prefix}/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

    const Bucket = process.env.R2_BUCKET as string;
    await r2.send(new PutObjectCommand({
      Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));

    const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
    if (!publicBase) return key;
    return `${publicBase.replace(/\/$/, "")}/${key}`;
  } catch (e) {
    console.error("R2 Server Upload Error:", e);
    return url; // Fallback to original URL
  }
}
