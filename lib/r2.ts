import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.AWS_REGION || "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const Bucket = process.env.AWS_S3_BUCKET as string;

export async function uploadBase64(base64: string, prefix: string = "uploads") {
  try {
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const mimeMatch = base64.match(/^data:(image\/\w+);base64,/);
    const contentType = mimeMatch ? mimeMatch[1] : "image/png";
    const extension = contentType.split("/")[1] || "png";

    const key = `${prefix}/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

    await s3.send(new PutObjectCommand({
      Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));

    // S3 public URL format
    return `https://${Bucket}.s3.${process.env.AWS_REGION || "eu-central-1"}.amazonaws.com/${key}`;
  } catch (e) {
    console.error("S3 Base64 Upload Error:", e);
    return base64;
  }
}

export async function ensureS3Url(dataUrlOrUrl: string, prefix: string = "assets") {
  if (!dataUrlOrUrl) return dataUrlOrUrl;

  if (dataUrlOrUrl.startsWith("http")) {
    if (dataUrlOrUrl.includes("fal.ai") || dataUrlOrUrl.includes("fal.run")) {
      return await uploadFromUrl(dataUrlOrUrl, prefix);
    }
    return dataUrlOrUrl;
  }

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

    await s3.send(new PutObjectCommand({
      Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));

    return `https://${Bucket}.s3.${process.env.AWS_REGION || "eu-central-1"}.amazonaws.com/${key}`;
  } catch (e) {
    console.error("S3 Server Upload Error:", e);
    return url;
  }
}

// Backward compatibility - export with old names too
export const r2 = s3;
export const ensureR2Url = ensureS3Url;