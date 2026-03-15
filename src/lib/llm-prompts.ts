type PlatformName = "Amazon" | "Flipkart" | "Meesho";

type GeminiPromptInput = {
  keyword: string;
  summary: unknown;
  rows: unknown[];
};

export function buildGeminiInsightsPrompt({ keyword, summary, rows }: GeminiPromptInput): string {
  return [
    "You are a shopping assistant.",
    "Based only on the provided comparison rows and summary, return valid JSON only with keys:",
    "bestBuyPlatform, bestBuyReason, recommendation",
    "bestBuyPlatform must be one of: Amazon, Flipkart, Meesho.",
    "bestBuyReason and recommendation should each be one short sentence, customer-friendly.",
    "Do not include markdown or extra keys.",
    `Keyword: ${keyword}`,
    `Summary: ${JSON.stringify(summary)}`,
    `Rows: ${JSON.stringify(rows)}`,
  ].join("\n");
}

export const supportedBestBuyPlatforms: PlatformName[] = ["Amazon", "Flipkart", "Meesho"];