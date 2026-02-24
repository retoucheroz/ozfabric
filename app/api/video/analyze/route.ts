
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { story, gender, modelSource, language = 'tr' } = body;

    if (!story) {
      return NextResponse.json({ error: "Story is required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an expert AI Video Director & Storyboard Artist for a high-end fashion AI platform called ModeOn.ai.
Your task is to take a short story or idea and break it down into exactly 5 consistent video scenes (shots).

**User Input Story:** "${story}"
**Subject Info:** ${gender} model, Source: ${modelSource}

**Instructions:**
1. Break the story into 5 logical scenes.
2. Maintain absolute consistency: The model's appearance, clothing (if described), and environment must stay identical across all shots.
3. Use a "Master Seed/Style" logic: Describe a "Visual Dictionary" shared by all shots.
4. Each shot must have:
   - A clear, descriptive AI Video Prompt (optimized for Kling 3.0 or Luma).
   - A duration (between 2 and 4 seconds, total must be exactly 15 seconds).
   - Camera movement description (e.g., "slow zoom in", "panning left", "static cinematic").

**Output Format (JSON strictly):**
{
  "visualDictionary": "A concise description of the model (hair, skin, eyes) and outfit to maintain consistency.",
  "shots": [
    {
      "id": "1",
      "title": "Opening Shot",
      "prompt": "...",
      "duration": 3,
      "camera": "..."
    },
    ... (total 5 shots)
  ]
}

Respond ONLY with the JSON block.
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Clean up JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    const storyboard = JSON.parse(jsonMatch[0]);

    return NextResponse.json(storyboard);

  } catch (error) {
    console.error("Video Analyze Error:", error);
    return NextResponse.json({ error: "Failed to create storyboard: " + (error as Error).message }, { status: 500 });
  }
}
