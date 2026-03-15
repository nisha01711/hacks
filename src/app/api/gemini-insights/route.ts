import { NextResponse } from "next/server";
import { buildGeminiInsightsPrompt } from "@/lib/llm-prompts";

type PlatformName = "Amazon" | "Flipkart" | "Meesho";

type GeminiOutput = {
  bestBuyPlatform?: PlatformName;
  bestBuyReason?: string;
  recommendation?: string;
};

function extractJson(raw: string): GeminiOutput | null {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as GeminiOutput;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
  }

  const body = await request.json();
  const keyword = String(body?.keyword || "").trim();
  const rows = Array.isArray(body?.rows) ? body.rows : [];
  const summary = body?.summary || {};

  if (!keyword || rows.length === 0) {
    return NextResponse.json({ error: "keyword and rows are required" }, { status: 400 });
  }

  const prompt = buildGeminiInsightsPrompt({ keyword, summary, rows });

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!geminiResponse.ok) {
    const text = await geminiResponse.text();
    return NextResponse.json({ error: `Gemini request failed: ${text}` }, { status: 502 });
  }

  const payload = await geminiResponse.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = typeof text === "string" ? extractJson(text) : null;

  if (!parsed) {
    return NextResponse.json({ error: "Unable to parse Gemini JSON response" }, { status: 502 });
  }

  return NextResponse.json(parsed);
}
