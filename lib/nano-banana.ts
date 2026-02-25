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
}

export async function generateWithNanoBanana(payload: NanoBananaPayload): Promise<string> {
    const apiProvider = await getGlobalSetting('nano_banana_provider') || 'fal_ai';
    let finalImageUrl: string | undefined = undefined;

    if (apiProvider === 'kie_ai') {
        const imageList = Array.isArray(payload.image_urls)
            ? payload.image_urls
            : Object.values(payload.image_urls);

        const kiePayload = {
            model: "nano-banana-pro",
            input: {
                prompt: payload.prompt,
                image_input: imageList.slice(0, 14), // Limit to 14 images as requested
                aspect_ratio: payload.aspect_ratio || "3:4",
                resolution: payload.resolution || "1K",
                output_format: "png",
                ...(payload.seed && { seed: payload.seed })
            }
        };

        const kieKey = process.env.KIE_API_KEY;
        if (!kieKey) throw new Error("KIE_API_KEY is missing in environmental variables");

        const createTaskRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${kieKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(kiePayload),
        });

        if (!createTaskRes.ok) {
            const err = await createTaskRes.text();
            throw new Error(`Kie API Create Task Error: ${err}`);
        }
        const createTaskData = await createTaskRes.json();
        const taskId = createTaskData?.data?.taskId || createTaskData?.taskId; // Check both common locations

        if (!taskId) {
            console.error("Kie API Response Error Structure:", JSON.stringify(createTaskData, null, 2));
            const errorMsg = createTaskData?.message || createTaskData?.msg || createTaskData?.info || JSON.stringify(createTaskData).substring(0, 500);
            throw new Error(`Kie API error: ${errorMsg}`);
        }

        let maxRetries = 240; // Poll for up to 240 seconds (4 minutes)
        while (maxRetries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            maxRetries--;

            const pollRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
                headers: { "Authorization": `Bearer ${kieKey}` }
            });

            if (!pollRes.ok) continue;
            const pollData = await pollRes.json();

            if (pollData?.data?.state === "success") {
                try {
                    const resultJson = JSON.parse(pollData.data.resultJson);
                    finalImageUrl = resultJson.resultUrls?.[0];
                    break;
                } catch (e) { }
            } else if (pollData?.data?.state === "failed") {
                throw new Error(`Kie API Generation Failed: ${pollData?.data?.failMsg}`);
            }
        }
        if (!finalImageUrl) throw new Error("Kie API timeout for task ID: " + taskId);

    } else {
        const imageList = Array.isArray(payload.image_urls)
            ? payload.image_urls
            : Object.values(payload.image_urls);

        const falPayload = {
            prompt: payload.prompt,
            negative_prompt: payload.negative_prompt,
            image_urls: imageList.slice(0, 14),
            aspect_ratio: payload.aspect_ratio || "3:4",
            resolution: payload.resolution || "1K",
            seed: payload.seed,
            enable_web_search: payload.enable_web_search,
            output_format: "png"
        };

        const falKey = process.env.FAL_KEY;
        if (!falKey) throw new Error("FAL_KEY missing");

        const response = await fetch("https://fal.run/fal-ai/nano-banana-pro/edit", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(falPayload),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Fal API Error: ${err}`);
        }
        const data = await response.json();
        finalImageUrl = data.images?.[0]?.url;
    }

    if (!finalImageUrl) throw new Error("Failed to generate image URL");

    const { uploadFromUrl } = await import("@/lib/s3");
    return await uploadFromUrl(finalImageUrl, "generations");
}
