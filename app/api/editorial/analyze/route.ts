import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const {
            camera,
            lens,
            focalLength,
            aperture,
            locationPrompt,
            outfitImage,
            modelType = "full_body",
            language = "tr"
        } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // 1. SUBJECT SOURCE BLOCK
        let subjectSourceBlock = "";
        if (modelType === "full_body") {
            subjectSourceBlock = `SUBJECT SOURCE LOGIC:
The user has selected "Outfit Included". 
Use the uploaded model image as base identity reference. 
Lock exactly: face, hair, body proportions, bone structure, skin tone.
Preserve the existing clothing and pose direction from the base image.
Ignore any combination/outfit cards. Do not change the wardrobe.`;
        } else {
            subjectSourceBlock = `SUBJECT SOURCE LOGIC:
The user has selected "Face Only / Replace Outfit".
Lock identity from the uploaded model image, specifically: bone structure, facial proportions, skin tone, hair structure, eye distance, jawline.
Replace clothing entirely using the analyzed outfit details provided below.
Ensure the outfit integrates naturally onto the subject's body anatomy and natural fabric gravity.`;
        }

        // 2. OUTFIT ANALYSIS (Gemini)
        let outfitBlock = "";
        if (outfitImage) {
            try {
                // Strip prefix if exists
                const base64Data = outfitImage.split(",")[1] || outfitImage;

                const result = await model.generateContent([
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: "image/jpeg"
                        }
                    },
                    `As a professional fashion editor, analyze this outfit image. 
                    Describe: garment types, fabric textures, cuts, tailoring details, colors, layering, accessories, and fit type.
                    Output ONLY the structured description following this format:
                    The subject is wearing: [breakdown]
                    Garments must respect natural fabric physics, follow anatomical tension points, show realistic weight and seam direction.`
                ]);
                const analysis = result.response.text().trim();
                outfitBlock = `OUTFIT STRUCTURE:\n${analysis}\nNo floating fabric. No texture mismatch. No compositing look.`;
            } catch (err) {
                console.error("Outfit Analysis Exception:", err);
                outfitBlock = "OUTFIT STRUCTURE:\n(Fabric and garment details to be matched from reference image accurately)";
            }
        }

        // 3. LOCATION BLOCK
        const locationBlock = `ENVIRONMENT STRUCTURE:
${locationPrompt || "Clean professional studio setting."}
Must ensure spatial depth consistency, perspective alignment, coherent ground contact, and realistic light interaction. 
environmental color bounce affecting subject subtly. No green-screen look.`;

        // 4. CAMERA BLOCK
        let cameraBlock = "";
        if (!camera || camera === "Auto") {
            // Auto Equipment Generation
            const equipmentResult = await model.generateContent(`
                Analyze this location prompt: "${locationPrompt}".
                As a pro cinematographer, select the perfect camera system, focal length, and aperture for this scene.
                Output ONLY a paragraph starting with "Shot using: [Camera + Lens + Focal + Aperture]" 
                followed by "Visual characteristics: [Depth compression, highlight rolloff, contrast curve]".
            `);
            cameraBlock = `CAMERA LOGIC (AUTO):\n${equipmentResult.response.text().trim()}`;
        } else {
            // User Selected Equipment Analysis
            const cameraSpecs = `Camera: ${camera}, Lens: ${lens}, Focal Length: ${focalLength}mm, Aperture: ${aperture}`;
            const effectResult = await model.generateContent(`
                Analyze this camera setup: ${cameraSpecs}.
                Describe the specific depth rendering, bokeh structure, background compression, and contrast curve of this system.
                Output ONLY a paragraph starting with "This equipment combination results in:"
            `);
            cameraBlock = `CAMERA LOGIC (USER SELECTION):\nShot using: ${cameraSpecs}\n${effectResult.response.text().trim()}\nDo NOT override user selection.`;
        }

        // 5. EDITORIAL REALISM & PHYSICAL INTEGRATION (Static rules)
        const realismBlock = `EDITORIAL REALISM BLOCK:
Subject must interact naturally with gravity, show micro body balance shifts, and feel captured mid-moment. 
Clothing must respond to environment factors like wind or body angle. preservative skin realism.
No AI smoothness. No hyper-sharp skin. No synthetic HDR look.`;

        const integrationBlock = `PHYSICAL INTEGRATION RULES:
Accurate ground shadow, correct light direction on face, environmental color reflection on skin.
no lighting mismatch. no cutout look. 
Subject must feel photographed on location.`;

        // Assemble FINAL MASTER PROMPT
        const finalPrompt = `
${subjectSourceBlock}

${outfitBlock}

${locationBlock}

${cameraBlock}

${realismBlock}

${integrationBlock}

FINAL STYLE: Photorealistic, high-end editorial fashion photography. Maintain framing integrity. Do not distort anatomy.
        `.trim();

        return NextResponse.json({ analysis: finalPrompt });
    } catch (error: any) {
        console.error("Gemini Analysis Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
