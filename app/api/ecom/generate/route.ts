import { NextRequest, NextResponse } from 'next/server'

// Configure route
export const maxDuration = 120
export const dynamic = 'force-dynamic'

interface GenerateRequest {
    prompt: string
    images: string[]
    options: {
        resolution: "1K" | "2K" | "4K"
        aspectRatio: string
        seed?: number
        enableWebSearch: boolean
        outputFormat: "png" | "jpeg" | "webp"
        numImages: number
    }
}

interface FalQueueUpdate {
    status: string
    logs?: Array<{ message: string }>
}

interface FalResult {
    images?: Array<{ url: string }>
    image?: { url: string }
}

export async function POST(req: NextRequest) {
    try {
        const { prompt, images, options }: GenerateRequest = await req.json()

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            )
        }

        console.log('\n=== E-COM GENERATE REQUEST ===')
        console.log('Prompt:', prompt.substring(0, 200) + '...')
        console.log('Images count:', images?.length || 0)
        console.log('Options:', options)

        // Build fal.ai request
        const falRequest: Record<string, unknown> = {
            prompt: prompt,
            resolution: options.resolution || "1K",
            aspect_ratio: options.aspectRatio || "3:4",
            output_format: options.outputFormat || "png",
            num_images: options.numImages || 1,
            enable_web_search: options.enableWebSearch || false,
        }

        // Add seed if provided
        if (options.seed !== undefined && options.seed !== null) {
            falRequest.seed = options.seed
        }

        // Add images if provided
        if (images && images.length > 0) {
            const { ensureR2Url } = await import("@/lib/s3");
            const imageUrls: string[] = await Promise.all(
                images.filter(img => img && img.length > 0).map(img => ensureR2Url(img, "ecom/inputs"))
            );

            if (imageUrls.length > 0) {
                falRequest.image_urls = imageUrls;
            }
        }

        console.log('Fal request image_urls:', (falRequest.image_urls as string[] | undefined)?.length || 0)

        // Call fal.ai nanobanana-pro directly
        const response = await fetch('https://fal.run/fal-ai/nanobanana-pro', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${process.env.FAL_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(falRequest)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Fal API error:', errorText)
            throw new Error(`Fal API error: ${response.status}`)
        }

        const result: FalResult = await response.json()

        console.log('Fal result received')

        // Extract image URL from result
        let imageUrl: string | null = null

        if (result.images && result.images.length > 0) {
            imageUrl = result.images[0].url
        } else if (result.image && result.image.url) {
            imageUrl = result.image.url
        }

        if (!imageUrl) {
            throw new Error('No image generated')
        }

        console.log('Generated image URL:', imageUrl)

        // Persist to R2/S3
        let finalImageUrl = imageUrl;
        try {
            const { uploadFromUrl } = await import("@/lib/s3");
            finalImageUrl = await uploadFromUrl(imageUrl, "ecom");
            console.log('Ecom Persisted to S3:', finalImageUrl);
        } catch (r2Error) {
            console.error('S3 persistence error:', r2Error);
        }

        return NextResponse.json({
            imageUrl: finalImageUrl,
            success: true
        })

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Generation failed'
        console.error('E-Com generate error:', error)
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
}
