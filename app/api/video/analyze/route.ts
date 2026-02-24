import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const ANALYZE_VIDEO_COST = 20;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role !== 'admin' && (user.credits || 0) < ANALYZE_VIDEO_COST) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { story, gender, modelSource } = body;

    if (!story) {
      return NextResponse.json({ error: "Story is required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = `
You are an expert AI Video Director & Storyboard Artist.
Your task is to take a short story or idea and break it down into exactly 5 consistent video scenes (shots).

Story: "${story}"
Subject: ${gender} model, Source: ${modelSource}

Output JSON format exactly:
{
  "visualDictionary": "...",
  "shots": [
    { "id": "1", "title": "Opening Shot", "prompt": "...", "duration": 3, "camera": "..." },
    ...
  ]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");

    const storyboard = JSON.parse(jsonMatch[0]);

    // Deduct credits
    if (user.role !== 'admin') {
      await deductCredits(user.id, ANALYZE_VIDEO_COST, "Video Storyboard Analysis");
    }

    return NextResponse.json(storyboard);

  } catch (error) {
    console.error("Video Analyze Error:", error);
    return NextResponse.json({ error: "Failed to create storyboard" }, { status: 500 });
  }
}
