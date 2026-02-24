
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
        }

        const body = await req.json();
        const { messages } = body;

        const genAI = new GoogleGenerativeAI(apiKey);

        // System Instruction Content
        const SYSTEM_INSTRUCTION = `
You are the ModeOn.ai AI Assistant. You are an expert on the ModeOn.ai platform and Fashion Design.
Your goal is to help users navigate the platform, solve problems, and provide design advice.

**Platform Capabilities (ModeOn.ai):**
1. **Ghost Mannequin (Hayalet Manken)** - found at \`/photoshoot/ghost\`.
   - Function: Merges a mannequin photo and a flat clothing photo to create a professional product shot without the mannequin.
   - Key Features: AI merging, background removal.
2. **Tech Pack Studio (Teknik Föy Stüdyosu)** - found at \`/studio\`.
   - Function: Generates technical specification sheets from uploaded design images.
   - Output: Specs include Fabric details (composition, weight), Measurements (sample size 36), Colorways (Pantone codes), and Construction Notes.
   - Features: PDF Export (A4 printable), Collection management.
3. **Collections (Koleksiyonlar)**: Users can save and organize their work into moodboards.

**Your Persona:**
- Name: ModeOn.ai AI or Gemini.
- Tone: Professional, Helpful, Encouraging.
- Language: **TURKISH (Türkçe)** is the primary language. Respond in Turkish unless the user explicitly speaks English.
- Knowledge: You know about fashion fabrics (GSM, weaves), sizing, and production processes.

**User Context:**
- The user is currently logged into the dashboard.
- If they ask about "how to", guide them to the specific pages mentioned above.

**Current Task:**
Respond to the user's latest message based on the conversation history.
`;

        // Robust model list - synchronized with analyze/route.ts
        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-flash-latest"
        ];

        let text = "";
        let usedModel = "";
        const errors: string[] = [];

        // Convert client messages to Gemini format
        const chatHistory = (messages || []).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        let historyForGemini = chatHistory.slice(0, -1);
        const lastMessage = chatHistory[chatHistory.length - 1];

        // Sanitize: Gemini chat history cannot start with a model message
        // This handles the initial "Greeting" from the UI
        if (historyForGemini.length > 0 && historyForGemini[0].role === 'model') {
            historyForGemini = historyForGemini.slice(1);
        }

        if (!lastMessage) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }

        for (const modelName of modelsToTry) {
            try {
                // Get fresh model instance for each attempt with the current modelName
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: SYSTEM_INSTRUCTION
                });

                const chatSession = model.startChat({
                    history: historyForGemini,
                    generationConfig: {
                        maxOutputTokens: 1000,
                    },
                });

                console.log(`Chat attempt with model: ${modelName}`);
                const result = await chatSession.sendMessage(lastMessage.parts[0].text);
                text = result.response.text();
                usedModel = modelName;
                break; // Success!
            } catch (e) {
                console.warn(`Chat model ${modelName} failed:`, (e as Error).message);
                errors.push(`${modelName}: ${(e as Error).message}`);
            }
        }

        if (!text) {
            console.error("All chat models failed:", errors);
            return NextResponse.json({ error: "Service unavailable", details: errors }, { status: 503 });
        }

        return NextResponse.json({
            role: 'assistant',
            content: text,
            model: usedModel // Optional: pass back which model answered
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Chat failed: " + (error as Error).message }, { status: 500 });
    }
}
