function dataUrlToBlob(dataUrl: string) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*);base64/)?.[1] || "application/octet-stream";
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return { blob: new Blob([bytes], { type: mime }), mime };
}

export async function uploadToR2(dataUrlOrUrl: string, fileName: string) {
  // Zaten URL geliyorsa dokunma
  if (dataUrlOrUrl.startsWith("http://") || dataUrlOrUrl.startsWith("https://")) {
    return dataUrlOrUrl;
  }

  // Base64 değilse dokunma
  if (!dataUrlOrUrl.startsWith("data:")) {
    return dataUrlOrUrl;
  }

  const { blob, mime } = dataUrlToBlob(dataUrlOrUrl);

  const safeName = (fileName || "image.png").replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${Date.now()}_${Math.random().toString(16).slice(2)}_${safeName}`;

  const presignRes = await fetch("/api/r2/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, contentType: mime }),
  });

  if (!presignRes.ok) {
    throw new Error("Presign failed");
  }

  const { uploadUrl, finalUrl } = (await presignRes.json()) as { uploadUrl: string, finalUrl: string };

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mime },
    body: blob,
  });

  if (!putRes.ok) {
    throw new Error("S3/R2 upload failed");
  }

  return finalUrl;
}
