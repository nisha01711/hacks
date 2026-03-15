export type SentimentPoint = {
  name: "Positive" | "Neutral" | "Negative";
  value: number;
};

export type PlatformSentimentStat = {
  platform: string;
  sentimentScore: number;
  confidence: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  sampleSize: number;
};

export type SentimentSnapshot = {
  keyword: string;
  overallScore: number;
  confidence: number;
  distribution: SentimentPoint[];
  platformStats: PlatformSentimentStat[];
  topPositiveThemes: string[];
  topNegativeThemes: string[];
  verdict: string;
  recommendation: string;
  generatedAt: string;
  hasLiveData: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function fetchSentimentSnapshot(keyword: string): Promise<SentimentSnapshot> {
  const encoded = encodeURIComponent(keyword.trim());
  const response = await fetch(`${API_BASE_URL}/sentiment?keyword=${encoded}`, { cache: "no-store" });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Unable to fetch sentiment data (${response.status}) ${detail.slice(0, 240)}`.trim());
  }

  return response.json() as Promise<SentimentSnapshot>;
}
