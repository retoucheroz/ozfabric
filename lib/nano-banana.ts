import { prisma } from "@/lib/prisma";

async function getGlobalSetting(key: string): Promise<string | null> {
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    return setting?.value || null;
}

interface NanoBananaPayload {
    prompt: string;
    image_urls: any;
    aspect_ratio?: string;
    resolution?: string;
    negative_prompt?: string;
    seed?: number;
    enable_web_search?: boolean;
    userGeminiKey?: string;
    userFalKey?: string;
}

export async function generateWithNanoBanana(payload: NanoBananaPayload): Promise<string> {
    const apiProvider = await getGlobalSetting('nano_banana_provider') || 'fal_ai';
    const resolutionVal = payload.resolution || "1K";

    // FORCED 4K RULE: If user wants 4K, Gemini is often insufficiently controlled. 
    // Fallback to Fal which handles explicit resolution better.
    let effectiveProvider = apiProvider;
    if (resolutionVal === "4K" && apiProvider === 'gemini_ai') {
        effectiveProvider = 'fal_ai';
    }

    let finalImageUrl: string | undefined = undefined;

    if (effectiveProvider === 'kie_ai') {
        const imageList = Array.isArray(payload.image_urls)
            ? payload.image_urls
            : Object.values(payload.image_urls);

        // Explicitly calculate dimensions
        let width = 1024;
        let height = 1024;
        const ar = payload.aspect_ratio || "1:1";
        const baseSize = resolutionVal === "4K" ? 2048 : resolutionVal === "2K" ? 1440 : 1024;

        if (ar === "1:1") { width = baseSize; height = baseSize; }
        else if (ar === "2:3") { width = Math.round(baseSize * 0.81); height = Math.round(baseSize * 1.22); }
        else if (ar === "3:4") { width = Math.round(baseSize * 0.88); height = Math.round(baseSize * 1.18); }
        else if (ar === "9:16") { width = Math.round(baseSize * 0.75); height = Math.round(baseSize * 1.33); }
        else if (ar === "16:9") { width = Math.round(baseSize * 1.33); height = Math.round(baseSize * 0.75); }
        else if (ar === "4:3") { width = Math.round(baseSize * 1.15); height = Math.round(baseSize * 0.86); }

        const kiePayload = {
            model: "nano-banana-pro",
            input: {
                prompt: payload.prompt,
                image_input: imageList.slice(0, 8),
                aspect_ratio: ar,
                width,
                height,
                resolution: resolutionVal,
                output_format: "png",
                ...(payload.seed && { seed: payload.seed })
            }
        };

        const kieKey = process.env.KIE_API_KEY;
        if (!kieKey) throw new Error("KIE_API_KEY is missing");

        const createTaskRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${kieKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(kiePayload),
        });

        if (!createTaskRes.ok) throw new Error(`Kie API Error: ${await createTaskRes.text()}`);
        const createTaskData = await createTaskRes.json();
        const taskId = createTaskData?.data?.taskId || createTaskData?.taskId;

        let maxRetries = 240;
        while (maxRetries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            maxRetries--;
            const pollRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
                headers: { "Authorization": `Bearer ${kieKey}` }
            });
            if (!pollRes.ok) continue;
            const pollData = await pollRes.json();
            if (pollData?.data?.state === "success") {
                const resultJson = JSON.parse(pollData.data.resultJson);
                finalImageUrl = resultJson.resultUrls?.[0];
                break;
            } else if (pollData?.data?.state === "failed") throw new Error(`Kie failed: ${pollData?.data?.failMsg}`);
        }

    } else if (effectiveProvider === 'gemini_ai') {
        const geminiKey = payload.userGeminiKey || process.env.GEMINI_API_KEY;
        if (!geminiKey) throw new Error("GEMINI_API_KEY is missing");

        const imageList = Array.isArray(payload.image_urls)
            ? payload.image_urls
            : Object.values(payload.image_urls);

        const base64Images = await Promise.all(imageList.map(async (url: string) => {
            try {
                if (url.startsWith('data:')) {
                    const parts = url.split(',');
                    return { data: parts[1], mimeType: parts[0].match(/:(.*?);/)?.[1] || "image/png" };
                }
                const resp = await fetch(url);
                if (!resp.ok) return null;
                const buffer = await resp.arrayBuffer();
                return { data: Buffer.from(buffer).toString('base64'), mimeType: resp.headers.get("content-type") || "image/png" };
            } catch (e) { return null; }
        }));

        const validBase64 = base64Images.filter((img): img is { data: string, mimeType: string } => img !== null);
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${geminiKey}`;

        const parts: any[] = [{ text: payload.prompt }];
        validBase64.forEach(img => parts.push({ inlineData: img }));

        const ar = payload.aspect_ratio || "1:1";
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: parts }],
                generationConfig: {
                    responseModalities: ["TEXT", "IMAGE"],
                    imageConfig: { aspect_ratio: ar }
                }
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(`Gemini Error: ${data.error?.message || JSON.stringify(data)}`);

        const b64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data)?.inlineData?.data;
        if (!b64) throw new Error("Gemini returned no image data");
        finalImageUrl = `data:image/png;base64,${b64}`;

    } else {
        // FAL AI
        const imageList = Array.isArray(payload.image_urls) ? payload.image_urls : Object.values(payload.image_urls);
        let width = 1024, height = 1024;
        const ar = payload.aspect_ratio || "1:1";
        const baseSize = resolutionVal === "4K" ? 2048 : resolutionVal === "2K" ? 1440 : 1024;

        if (ar === "1:1") { width = baseSize; height = baseSize; }
        else if (ar === "2:3") { width = Math.round(baseSize * 0.81); height = Math.round(baseSize * 1.22); }
        else if (ar === "3:4") { width = Math.round(baseSize * 0.88); height = Math.round(baseSize * 1.18); }
        else if (ar === "9:16") { width = Math.round(baseSize * 0.75); height = Math.round(baseSize * 1.33); }
        else if (ar === "16:9") { width = Math.round(baseSize * 1.33); height = Math.round(baseSize * 0.75); }
        else if (ar === "4:3") { width = Math.round(baseSize * 1.15); height = Math.round(baseSize * 0.86); }

        const falPayload = {
            prompt: payload.prompt,
            image_urls: imageList.slice(0, 14),
            aspect_ratio: ar,
            width, height,
            resolution: resolutionVal,
            output_format: "png"
        };

        const falKey = payload.userFalKey || process.env.FAL_KEY;
        if (!falKey) throw new Error("FAL_KEY missing");

        const response = await fetch("https://fal.run/fal-ai/nano-banana-pro/edit", {
            method: "POST",
            headers: { "Authorization": `Key ${falKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(falPayload),
        });

        if (!response.ok) throw new Error(`Fal Error: ${await response.text()}`);
        const data = await response.json();
        finalImageUrl = data.images?.[0]?.url;
    }

    if (!finalImageUrl) throw new Error("No image generated");
    // Gemini returns data: URLs; other providers return http URLs
    const { uploadFromUrl, uploadBase64 } = await import("@/lib/s3");
    if (finalImageUrl.startsWith('data:')) {
        return await uploadBase64(finalImageUrl, "generations");
    }
    return await uploadFromUrl(finalImageUrl, "generations");
}
