import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Framing descriptions
const FRAMING_MAP: Record<string, string> = {
    closeup: "close-up shot from face to chest",
    upper: "upper body shot from waist up (cowboy shot)",
    full: "full body head-to-toe shot",
    lower: "lower body shot focusing on waist to feet"
}

// View angle descriptions
const VIEW_MAP: Record<string, string> = {
    front: "front view facing the camera",
    side: "side profile view",
    back: "back view",
    angled: "three-quarter angled view"
}

// Lighting descriptions
const LIGHTING_MAP: Record<string, string> = {
    studio: "soft studio lighting with gentle shadows",
    natural: "natural daylight lighting",
    dramatic: "dramatic high-contrast lighting",
    golden_hour: "warm golden hour lighting"
}

export async function POST(req: NextRequest) {
    try {
        const { userPrompt, images, language, framing, viewAngle, lighting } = await req.json()

        // Build the analysis prompt
        const analysisPrompt = buildAnalysisPrompt(userPrompt, framing, viewAngle, lighting)

        // Prepare image parts for Gemini
        const imageParts = images?.map((imageUrl: string) => {
            // Handle base64 images
            if (imageUrl.startsWith('data:')) {
                const base64Data = imageUrl.split(',')[1]
                const mimeType = imageUrl.split(':')[1].split(';')[0]
                return {
                    inlineData: {
                        data: base64Data,
                        mimeType
                    }
                }
            }
            return null
        }).filter(Boolean) || []

        // Initialize model
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        })

        // Generate analysis
        const result = await model.generateContent([
            analysisPrompt,
            ...imageParts
        ])

        const response = await result.response
        const text = response.text()

        // Extract JSON from response
        const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/)
        let structuredPrompt

        if (jsonMatch) {
            try {
                structuredPrompt = JSON.parse(jsonMatch[1] || jsonMatch[0])
            } catch (e) {
                // Try to parse the entire response
                structuredPrompt = createDefaultPrompt(userPrompt, framing, viewAngle, lighting)
            }
        } else {
            structuredPrompt = createDefaultPrompt(userPrompt, framing, viewAngle, lighting)
        }

        // Ensure framing and view are set correctly
        structuredPrompt.styling = structuredPrompt.styling || {}
        structuredPrompt.styling.framing = FRAMING_MAP[framing] || FRAMING_MAP.full
        structuredPrompt.styling.view = VIEW_MAP[viewAngle] || VIEW_MAP.front

        structuredPrompt.camera = structuredPrompt.camera || {}
        structuredPrompt.camera.shot_type = framing
        structuredPrompt.camera.angle = viewAngle
        structuredPrompt.camera.framing = FRAMING_MAP[framing] || FRAMING_MAP.full

        structuredPrompt.scene = structuredPrompt.scene || {}
        structuredPrompt.scene.lighting = LIGHTING_MAP[lighting] || LIGHTING_MAP.studio

        return NextResponse.json({
            structuredPrompt,
            rawAnalysis: text
        })

    } catch (error: any) {
        console.error('E-Com analyze error:', error)
        return NextResponse.json(
            { error: error.message || 'Analysis failed' },
            { status: 500 }
        )
    }
}

function buildAnalysisPrompt(userPrompt: string, framing: string, viewAngle: string, lighting: string): string {
    return `You are an expert fashion e-commerce image generation prompt engineer.

TASK: Analyze the user's request and any provided images to create a structured prompt for AI image generation.

USER REQUEST (may be in Turkish or English - always output in ENGLISH):
"${userPrompt}"

SELECTED SETTINGS:
- Framing: ${framing} (${FRAMING_MAP[framing]})
- View Angle: ${viewAngle} (${VIEW_MAP[viewAngle]})
- Lighting: ${lighting} (${LIGHTING_MAP[lighting]})

INSTRUCTIONS:
1. If the user wrote in Turkish, translate and understand the intent
2. Analyze any provided images for:
   - Product type and details
   - Fabric texture and material
   - Color and patterns
   - Style and fit
   - Model characteristics (if shown)
3. HAIR DYNAMICS (CRITICAL):
   - If the pose is dynamic (walking, turning, mid-motion), ALWAYS describe the Hair Movement to ensure it looks natural and not static.
   - Example: "Hair flowing naturally with movement", "hair swinging slightly", "loose strands showing motion".
   - If the pose is static (flat front/side/back view), hair should be described as neat and stationary.
4. Create a structured prompt JSON

OUTPUT FORMAT (return ONLY this JSON, no other text):
\`\`\`json
{
  "intent": "High-end fashion e-commerce photography",
  "subject": {
    "type": "model type (male_model, female_model, etc)",
    "description": "Description of the model/subject"
  },
  "garment": {
    "name": "Product name",
    "description": "Detailed garment description",
    "fabric": "Fabric/texture description",
    "fit": "Fit and silhouette description"
  },
  "styling": {
    "pose": "Pose description",
    "framing": "Framing description",
    "view": "View angle description"
  },
  "scene": {
    "background": "Background description",
    "lighting": "Lighting description"
  },
  "camera": {
    "shot_type": "Shot type",
    "angle": "Camera angle",
    "framing": "Framing details"
  },
  "accessories": ["list of accessories if any"],
  "additionalNotes": "Any additional styling or composition notes"
}
\`\`\`

Be detailed and specific. Focus on creating professional e-commerce imagery.`
}

function createDefaultPrompt(userPrompt: string, framing: string, viewAngle: string, lighting: string) {
    return {
        intent: "High-end fashion e-commerce photography",
        subject: {
            type: "fashion_model",
            description: "Professional fashion model"
        },
        garment: {
            name: "Garment",
            description: userPrompt || "Fashion garment",
            fabric: "High-quality fabric",
            fit: "Modern fit"
        },
        styling: {
            pose: "Natural, confident pose",
            framing: FRAMING_MAP[framing] || FRAMING_MAP.full,
            view: VIEW_MAP[viewAngle] || VIEW_MAP.front
        },
        scene: {
            background: "Clean professional studio background",
            lighting: LIGHTING_MAP[lighting] || LIGHTING_MAP.studio
        },
        camera: {
            shot_type: framing,
            angle: viewAngle,
            framing: FRAMING_MAP[framing] || FRAMING_MAP.full
        },
        accessories: [],
        additionalNotes: ""
    }
}
