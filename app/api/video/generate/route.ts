import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 });
        }

        fal.config({ credentials: falKey });

        const body = await req.json();
        const {
            firstFrame,       // base64 data URI of the start frame
            endFrame,         // base64 data URI of the end frame (optional)
            prompt,           // text prompt
            duration,         // number 3-15, will be sent as string
            generateAudio,    // boolean
            resolution,       // "720p" or "1080p"
            aspectRatio,      // "16:9", "9:16", "1:1" (used for text-to-video, image-to-video infers from image)
            multiShot,        // boolean - multi-shot mode
            shots,            // array of { prompt, duration } for multi-shot
        } = body;

        if (!firstFrame && !multiShot) {
            return NextResponse.json({ error: "Start frame is required for image-to-video generation" }, { status: 400 });
        }

        if (!prompt && !multiShot) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // Determine the model endpoint based on resolution
        // 1080p → Pro, 720p → Standard
        const modelEndpoint = resolution === "1080p"
            ? "fal-ai/kling-video/o3/pro/image-to-video"
            : "fal-ai/kling-video/o3/standard/image-to-video";

        console.log(`[Video Gen] Using model: ${modelEndpoint}, resolution: ${resolution}, duration: ${duration}s`);

        // Upload images to fal storage first (base64 → URL)
        let startImageUrl: string | undefined;
        let endImageUrl: string | undefined;

        if (firstFrame) {
            try {
                // Convert base64 to blob and upload
                const startBlob = base64ToBlob(firstFrame);
                const startFile = new File([startBlob], "start_frame.png", { type: "image/png" });
                const uploadedStart = await fal.storage.upload(startFile);
                startImageUrl = uploadedStart;
                console.log("[Video Gen] Start frame uploaded:", startImageUrl);
            } catch (uploadError: any) {
                console.error("[Video Gen] Failed to upload start frame:", uploadError);
                return NextResponse.json({ error: `Failed to upload start frame: ${uploadError.message}` }, { status: 500 });
            }
        }

        if (endFrame) {
            try {
                const endBlob = base64ToBlob(endFrame);
                const endFile = new File([endBlob], "end_frame.png", { type: "image/png" });
                const uploadedEnd = await fal.storage.upload(endFile);
                endImageUrl = uploadedEnd;
                console.log("[Video Gen] End frame uploaded:", endImageUrl);
            } catch (uploadError: any) {
                console.error("[Video Gen] Failed to upload end frame:", uploadError);
                return NextResponse.json({ error: `Failed to upload end frame: ${uploadError.message}` }, { status: 500 });
            }
        }

        // Build input payload
        let input: any = {};

        if (multiShot && shots && shots.length > 0) {
            // Multi-shot mode uses multi_prompt
            input = {
                image_url: startImageUrl,
                multi_prompt: shots.map((shot: any) => ({
                    prompt: shot.prompt,
                    duration: String(shot.duration),
                })),
                shot_type: "customize",
                generate_audio: generateAudio || false,
            };

            if (endImageUrl) {
                input.end_image_url = endImageUrl;
            }
        } else {
            // Standard single-prompt mode
            input = {
                prompt: prompt,
                image_url: startImageUrl,
                duration: String(duration || 5),
                generate_audio: generateAudio || false,
            };

            if (endImageUrl) {
                input.end_image_url = endImageUrl;
            }
        }

        console.log("[Video Gen] Sending request with input:", JSON.stringify({
            ...input,
            image_url: input.image_url ? "[uploaded]" : undefined,
            end_image_url: input.end_image_url ? "[uploaded]" : undefined,
        }));

        // Subscribe and wait for result
        const result = await fal.subscribe(modelEndpoint, {
            input,
            logs: true,
            onQueueUpdate: (update: any) => {
                if (update.status === "IN_PROGRESS") {
                    const messages = update.logs?.map((log: any) => log.message) || [];
                    messages.forEach((msg: string) => console.log(`[Video Gen] Progress: ${msg}`));
                }
            },
        });

        const data = result.data as any;
        console.log("[Video Gen] Generation complete!");

        if (!data?.video?.url) {
            console.error("[Video Gen] No video in response:", JSON.stringify(data));
            return NextResponse.json({ error: "No video was generated" }, { status: 500 });
        }

        return NextResponse.json({
            status: "completed",
            video: {
                url: data.video.url,
                fileName: data.video.file_name || "output.mp4",
                contentType: data.video.content_type || "video/mp4",
                fileSize: data.video.file_size,
            },
            requestId: result.requestId,
        });

    } catch (error: any) {
        console.error("[Video Gen] Error:", error);

        // Check for specific fal.ai error messages
        const errorMessage = error.message || error.body?.detail || "Video generation failed";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// Helper: Convert base64 data URI to Blob
function base64ToBlob(dataUri: string): Blob {
    let base64 = dataUri;
    let mimeType = "image/png";

    if (dataUri.includes(",")) {
        const parts = dataUri.split(",");
        const match = parts[0].match(/:(.*?);/);
        if (match) mimeType = match[1];
        base64 = parts[1];
    }

    const byteCharacters = atob(base64);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    return new Blob([byteNumbers.buffer], { type: mimeType });
}
