import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productName, uploadedImages, gender = "female", hasOwnOutfit, productCategory = "top", workflowType } = body;

        // Basic Validation
        if (!productName || !uploadedImages?.model) {
            return NextResponse.json({ error: "Missing required fields (ProductName or Model)" }, { status: 400 });
        }

        if (!hasOwnOutfit && !uploadedImages?.main_product) {
            return NextResponse.json({ error: "Product image is required for auto-styling." }, { status: 400 });
        }

        let finalPrompt = "";
        let analysisResult = null;
        let detectedCategory = "Top";

        // --- SMART WORKFLOW (Simple Mode) ---
        if (!hasOwnOutfit) {
            // 1. Analyze the Main Product Image with Gemini
            try {
                const imageParts = uploadedImages.main_product.split(",");
                const imageBase64 = imageParts[1];
                const mimeType = imageParts[0].match(/:(.*?);/)?.[1] || "image/png";

                const analysisPrompt = `
                    Analyze this fashion item image objectively.
                    1. Describe the Color, Fabric, Fit, and Style.
                    2. Categorize it strictly as one of: "Top", "Bottom", "Dress", "Outerwear", "Shoes", or "Accessory".
                    3. Output specific JSON format: { "description": "...", "category": "..." }
                `;

                const result = await model.generateContent([
                    analysisPrompt,
                    { inlineData: { data: imageBase64, mimeType } }
                ]);

                const responseText = result.response.text();
                // Extract JSON if wrapped in markdown
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : responseText;

                try {
                    const parsed = JSON.parse(jsonStr);
                    analysisResult = parsed.description;
                    detectedCategory = parsed.category;
                } catch (e) {
                    console.error("Failed to parse Gemini JSON", e);
                    analysisResult = responseText; // Fallback
                }

            } catch (err) {
                console.error("Gemini Analysis Failed:", err);
                analysisResult = `${productName}`; // Fallback
            }

            // 2. Construct Safe, Stylish Outfit Prompt
            const baseStyle = "High-end fashion e-commerce photography, professional studio lighting, 4k, incredibly detailed.";

            // Outfit Logic based on INFERRED Category
            let outfitComplement = "";
            const cat = (detectedCategory || "").toLowerCase();

            if (cat.includes("top")) {
                outfitComplement = "wearing neutral colored tailored trousers or chic denim jeans, simple minimalist shoes.";
            } else if (cat.includes("bottom")) {
                outfitComplement = "wearing a crisp white premium cotton t-shirt or a simple silk blouse, neutral accessories.";
            } else if (cat.includes("dress")) {
                outfitComplement = "wearing minimal accessories, elegant heels.";
            } else if (cat.includes("shoes")) {
                outfitComplement = "wearing cropped tailored trousers and a high-quality solid color knit sweater.";
            } else if (cat.includes("outerwear") || cat.includes("jacket")) {
                outfitComplement = "wearing a simple white tee and black straight-leg jeans.";
            } else {
                outfitComplement = "wearing a complementary neutral outfit.";
            }

            finalPrompt = `Full body shot of a ${gender} model wearing ${analysisResult || productName}. The model is ${outfitComplement} The look is cohesive, clean, and commercial fashion style. Background is realistic. ${baseStyle}`;

        } else {
            // --- MANUAL WORKFLOW (Advanced Mode) ---
            finalPrompt = `Full body fashion shot of a ${gender} model wearing ${productName}. User provided specific outfit components. Professional fashion photography.`;
        }

        // 3. Mock Generation (Simulated)
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockImages = [
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1529139574466-a302d2d3f524?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1550614000-4b9519e07d3f?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=600&fit=crop"
        ];

        return NextResponse.json({
            success: true,
            mode: hasOwnOutfit ? "advanced" : "simple_smart",
            generatedPrompt: finalPrompt,
            analysis: analysisResult,
            images: mockImages
        });

    } catch (error) {
        console.error("Photoshoot Generate Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
