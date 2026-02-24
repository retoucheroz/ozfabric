import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const ANALYZE_COST = 20;
        if ((user.credits || 0) < ANALYZE_COST) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        const falKey = process.env.FAL_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
        }

        // Deduct credits
        await deductCredits(user.id, ANALYZE_COST, "Analysis");

        const body = await req.json();
        const {
            analysisType, // product | pose | pattern
            images, // Array of base64 strings
            productType,
            productName,
            options = {}
        } = body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: "Images array required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
            generationConfig: { responseMimeType: "text/plain" },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

        // Pre-process images for Gemini
        const processedImages = images.map((img: string) => {
            let base64Data = img;
            let mimeType = "image/png";
            if (img.includes(",")) {
                const parts = img.split(",");
                const match = parts[0].match(/:(.*?);/);
                if (match) mimeType = match[1];
                base64Data = parts[1];
            }
            return {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };
        });

        let systemPrompt = "";
        let stickmanUrl = null;

        // Product type mapping for context-aware analysis
        const productTypeMap: Record<string, string> = {
            "shirt": "shirt",
            "t-shirt": "t-shirt",
            "pants": "pants/trousers",
            "dress": "dress",
            "jacket": "jacket",
            "coat": "coat/overcoat",
            "skirt": "skirt",
            "sweater": "sweater/knitwear",
            "hoodie": "hoodie/sweatshirt",
            "shorts": "shorts",
            "blazer": "blazer",
            "vest": "vest",
        };

        const resolvedProductType = productTypeMap[productType] || productType || "garment";

        if (analysisType === "pose") {
            // Check for stickman generation
            if (options.pose_to_stickman) {
                try {
                    const { fal } = await import("@fal-ai/client");
                    fal.config({ credentials: falKey });

                    const falResult: any = await fal.run("fal-ai/dwpose", {
                        input: {
                            image_url: images[0]
                        }
                    });
                    stickmanUrl = falResult.image?.url;

                    // If we got a stickman, add it to Gemini context
                    if (stickmanUrl) {
                        try {
                            const response = await fetch(stickmanUrl);
                            const buffer = await response.arrayBuffer();
                            const base64 = Buffer.from(buffer).toString('base64');
                            processedImages.push({
                                inlineData: {
                                    data: base64,
                                    mimeType: "image/png"
                                }
                            });
                        } catch (e) {
                            console.warn("Failed to fetch stickman for Gemini context", e);
                        }
                    }
                } catch (e) {
                    console.error("DWPose failed", e);
                }
            }

            systemPrompt = `
            ROLE: Editorial Art Director, High-end Fashion Photographer, Body language specialist.
            TASK: Describe ONLY the pose/body configuration from the image.
            
            STRICT RULES:
            1. Describe ONLY the pose.
            2. Ignore: gender, clothing, beauty, background (EXCEPT mandatory support surface like a chair/wall).
            3. No degrees. No camera/lighting language.
            4. Style: "Standing/sitting ...; torso ...; spine ...; head/chin/gaze ...; shoulders ...; arms/hands ...; weight ...; legs/feet ...; overall attitude ..."
            5. Do not infer mood or deep attitude, only physical joints and body positioning.
            
            OUTPUT: A single English paragraph describing the pose. Nothing else.
            `;
        } else if (analysisType === "pattern") {
            systemPrompt = `
            ROLE: Senior Pattern Maker / Modelist, Master Tailor, Textile Engineer.
            TASK: Describe ONLY fit/silhouette/pattern construction + length constraints for a ${resolvedProductType}.
            
            IMPORTANT: You are analyzing a ${resolvedProductType}. Only describe fitting details and length constraints that are relevant to this specific garment type.
            ${resolvedProductType === "t-shirt" || resolvedProductType === "shirt" ? "Focus on: shoulder seam placement, chest/torso fit, sleeve length and fit, hem length relative to body, neckline. Do NOT mention legs, inseam, rise, or lower body." : ""}
            ${resolvedProductType === "pants/trousers" || resolvedProductType === "shorts" ? "Focus on: waistband, rise, thigh fit, knee, leg opening, inseam, hem/break. Do NOT mention shoulders, sleeves, or neckline." : ""}
            ${resolvedProductType === "dress" ? "Focus on: shoulder/neckline, bust fit, waist definition, skirt silhouette, hemline length." : ""}
            ${resolvedProductType === "jacket" || resolvedProductType === "blazer" || resolvedProductType === "coat/overcoat" ? "Focus on: shoulder width, chest/torso, sleeve length, hem length, button stance, lapel." : ""}
            ${resolvedProductType === "skirt" ? "Focus on: waistband, hip fit, silhouette, hemline length." : ""}
            
            FIELDS TO COVER:
            1. FITTING DETAILS: Describe fit through key zones relevant to ${resolvedProductType}. Use "not X, not Y" clarifiers.
            2. LENGTH CONSTRAINT: Exact end point, break/stacking/bunching rules.
            
            STRICT RULES:
            1. Ignore styling, model identity, scenery, colors, patterns.
            2. Keep language realistic and production-feasible.
            3. Use clear English. Use the specified headers exactly.
            4. Do NOT include sections or details that don't apply to a ${resolvedProductType}.
            
            OUTPUT FORMAT (only these two sections):
            FITTING DETAILS: {fit details relevant to ${resolvedProductType}}
            LENGTH CONSTRAINT: {length details}
            `;
        } else {
            // Default: Product Analysis
            systemPrompt = `
            ROLE: Textile Engineer, Creative Director, Senior Pattern Maker, Master Tailor.
            TASK: Describe ONLY the specified product visible in the image. The product is a ${resolvedProductType}${productName ? ` named "${productName}"` : ""}.
            
            STRICT RULES:
            1. Describe ONLY the garment. Ignore model, pose, background, accessories.
            2. Never invent features not visible in the image.
            3. Use clear, concrete garment language. No inference words.
            4. Do NOT include any section header if its content is "None visible", "None", "N/A", or not applicable. Simply omit that section entirely.
            5. Do NOT use parenthetical notes like "(only if visible)" or "(only if inferable)" in the output.
            6. Do NOT include FIT / SILHOUETTE section. Fit analysis belongs to pattern analysis only.
            7. Only describe features that actually belong to this specific garment type (${resolvedProductType}).
            
            OUTPUT FORMAT (include ONLY sections that have visible content):
            PRODUCT NAME: ${productName || "{detect from image}"}
            PRODUCT TYPE: ${resolvedProductType}

            MATERIAL & TEXTURE: {describe drape/stiffness/handfeel cues only if visible}
            PATTERN / COLORWAY: {stripes/checks/print + colors}
            CONSTRUCTION & STITCHING: {seam placement; topstitch; reinforcement}
            CLOSURE & HARDWARE: {buttons/zippers/snaps; finish}
            DETAILS: {collar/cuffs/pockets/hem/panels — only what belongs to this garment}
            BRANDING / LABELS: {logo/printed buttons — only if actually visible}

            REMEMBER: If a section has nothing visible to report, DO NOT include that section header at all. No empty sections. No "None visible" entries.
            `;
        }

        // Step 1: Get English analysis
        const resultEn = await model.generateContent([
            systemPrompt,
            ...processedImages
        ]);
        const analysisEn = resultEn.response.text();

        // Step 2: Get Turkish translation
        let analysisTr = "";
        try {
            const translationResult = await model.generateContent([
                `Translate the following English fashion/textile technical analysis to Turkish. Keep the same format and section headers (translate the headers too). Keep technical terms where appropriate. Output ONLY the Turkish translation, nothing else.\n\nEnglish text:\n${analysisEn}`
            ]);
            analysisTr = translationResult.response.text();
        } catch (e) {
            console.warn("Translation failed", e);
            analysisTr = "";
        }

        return NextResponse.json({
            status: "success",
            analysisEn: analysisEn,
            analysisTr: analysisTr,
            analysis: analysisEn, // backward compat
            stickmanUrl: stickmanUrl
        });

    } catch (error: any) {
        console.error("Analysis API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
