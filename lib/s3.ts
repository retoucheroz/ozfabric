import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const CloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
const Bucket = process.env.AWS_S3_BUCKET || process.env.R2_BUCKET;
const Region = process.env.AWS_REGION || "eu-central-1";

export const s3 = new S3Client({
  region: Region,
  credentials: {
    accessKeyId: (process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID) as string,
    secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY) as string,
  },
  // If it's Cloudflare R2, we often need a custom endpoint
  ...(process.env.R2_ENDPOINT && { endpoint: process.env.R2_ENDPOINT }),
});

export async function uploadBase64(base64: string, prefix: string = "uploads") {
  if (!Bucket) return base64;
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

    return CloudFrontUrl
      ? `${CloudFrontUrl}/${key}`
      : `https://${Bucket}.s3.${Region}.amazonaws.com/${key}`;
  } catch (e: any) {
    console.error("====== AWS S3 Base64 Upload Failed ======");
    console.error("Bucket:", Bucket);
    console.error("Region:", Region);
    console.error("Error Message:", e?.message || e);
    console.error("Full Error Object:", JSON.stringify(e));
    return base64;
  }
}

export function getAbsoluteUrl(path: string) {
  if (!path) return path;
  if (path.startsWith("http")) return path;
  if (path.startsWith("data:")) return path;

  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function ensureS3Url(dataUrlOrUrl: string, prefix: string = "assets") {
  if (!dataUrlOrUrl) return dataUrlOrUrl;

  const absoluteUrl = getAbsoluteUrl(dataUrlOrUrl);

  if (absoluteUrl.startsWith("http")) {
    if (absoluteUrl.includes("fal.ai") || absoluteUrl.includes("fal.run") || absoluteUrl.includes("replicate.delivery")) {
      return await uploadFromUrl(absoluteUrl, prefix);
    }
    return absoluteUrl;
  }

  if (absoluteUrl.startsWith("data:image")) {
    return await uploadBase64(absoluteUrl, prefix);
  }

  return absoluteUrl;
}

export async function uploadFromUrl(url: string, prefix: string = "generations") {
  if (!Bucket) {
    console.warn("S3/R2 Bucket not configured, returning original URL");
    return url;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image from source");
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

    if (process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL) {
      return `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
    }

    return CloudFrontUrl
      ? `${CloudFrontUrl}/${key}`
      : `https://${Bucket}.s3.${Region}.amazonaws.com/${key}`;
  } catch (e) {
    console.error("S3 Server Upload Error:", e);
    return url;
  }
}

// Backward compatibility
export const r2 = s3;
export const ensureR2Url = ensureS3Url;