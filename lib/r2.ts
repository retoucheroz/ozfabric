import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
});

export async function uploadBase64(base64: string, prefix: string = "uploads") {
  try {
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Simple mime check from data url
    const mimeMatch = base64.match(/^data:(image\/\w+);base64,/);
    const contentType = mimeMatch ? mimeMatch[1] : "image/png";
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
    console.error("R2 Base64 Upload Error:", e);
    return base64;
  }
}

export async function ensureR2Url(dataUrlOrUrl: string, prefix: string = "assets") {
  if (!dataUrlOrUrl) return dataUrlOrUrl;

  // If it's already a URL, return it
  if (dataUrlOrUrl.startsWith("http")) {
    // Optional: If it's a Fal URL, we might want to capture it to R2 anyway
    if (dataUrlOrUrl.includes("fal.ai") || dataUrlOrUrl.includes("fal.run")) {
      return await uploadFromUrl(dataUrlOrUrl, prefix);
    }
    return dataUrlOrUrl;
  }

  // If it's base64, upload it
  if (dataUrlOrUrl.startsWith("data:image")) {
    return await uploadBase64(dataUrlOrUrl, prefix);
  }

  return dataUrlOrUrl;
}

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
