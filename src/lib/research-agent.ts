export type PlatformName = "Amazon" | "Flipkart" | "Meesho";

export type ProductResearchRow = {
  id: string;
  product: string;
  platform: PlatformName;
  priceBand: "Low" | "Medium" | "High";
  size: string;
  sourceUrl: string;
  category?: string;
  spf?: string;
  form?: string;
  useCase?: string;
  price: number;
  rating: number | null;
  reviews: number | null;
  sentiment: "Positive" | "Neutral" | "Negative" | null;
  signal: string;
};

export type ResearchSummary = {
  searchedKeyword: string;
  bestPricePlatform: PlatformName | null;
  bestRatedPlatform: PlatformName | null;
  bestBuyPlatform: PlatformName | null;
  bestBuyReason: string;
  avgPrice: number;
  totalProducts: number;
  catalogCoverage: string;
  recommendation: string;
};

export type ResearchOutput = {
  rows: ProductResearchRow[];
  summary: ResearchSummary;
};

function normalizeBackendOutput(output: ResearchOutput, keyword: string): ResearchOutput {
  const byPlatform = new Map<PlatformName, ProductResearchRow[]>();

  for (const row of output.rows) {
    const current = byPlatform.get(row.platform) || [];
    current.push(row);
    byPlatform.set(row.platform, current);
  }

  const normalizedRows: ProductResearchRow[] = [];

  for (const [platform, platformRows] of byPlatform.entries()) {
    const sorted = [...platformRows].sort((a, b) => a.price - b.price);

    if (sorted.length >= 3) {
      const low = sorted[0];
      const medium = sorted[Math.floor(sorted.length / 2)];
      const high = sorted[sorted.length - 1];

      normalizedRows.push(
        {
          ...low,
          platform,
          priceBand: "Low",
          size: low.size,
        },
        {
          ...medium,
          platform,
          priceBand: "Medium",
          size: medium.size,
        },
        {
          ...high,
          platform,
          priceBand: "High",
          size: high.size,
        },
      );
    } else {
      const fallbackBands: Array<"Low" | "Medium" | "High"> = ["Low", "Medium", "High"];
      for (let i = 0; i < sorted.length; i += 1) {
        const row = sorted[i];
        normalizedRows.push({
          ...row,
          platform,
          priceBand: fallbackBands[i],
          size: row.size,
        });
      }
    }
  }

  const bestBuy = deriveBestBuy(normalizedRows);

  return {
    rows: normalizedRows,
    summary: {
      ...output.summary,
      bestBuyPlatform: output.summary.bestBuyPlatform ?? bestBuy.platform,
      bestBuyReason: output.summary.bestBuyReason ?? bestBuy.reason,
      totalProducts: output.summary.totalProducts ?? normalizedRows.length,
      catalogCoverage:
        output.summary.catalogCoverage ?? `${new Set(normalizedRows.map((row) => row.category).filter(Boolean)).size} categories structured`,
    },
  };
}

type CreateJobResponse = {
  job_id: string;
  status: string;
};

type JobStatusResponse = {
  job_id: string;
  status: string;
  result: ResearchOutput | null;
  errors: string[];
};

type GeminiInsightsResponse = {
  bestBuyPlatform?: PlatformName;
  bestBuyReason?: string;
  recommendation?: string;
};

type EnrichWithGeminiResponse = {
  output: ResearchOutput;
  aiApplied: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function enrichWithGemini(output: ResearchOutput, keyword: string): Promise<EnrichWithGeminiResponse> {
  try {
    const response = await fetch("/api/gemini-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, rows: output.rows, summary: output.summary }),
    });

    if (!response.ok) {
      return { output, aiApplied: false };
    }

    const ai = (await response.json()) as GeminiInsightsResponse;
    return {
      aiApplied: true,
      output: {
      ...output,
      summary: {
        ...output.summary,
        bestBuyPlatform: ai.bestBuyPlatform ?? output.summary.bestBuyPlatform,
        bestBuyReason: ai.bestBuyReason ?? output.summary.bestBuyReason,
        recommendation: ai.recommendation ?? output.summary.recommendation,
      },
      },
    };
  } catch {
    return { output, aiApplied: false };
  }
}

async function persistFinalOutput(
  jobId: string,
  keyword: string,
  output: ResearchOutput,
  isAiEnriched: boolean,
): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/research/${jobId}/final-output`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword,
        result: output,
        source: "frontend",
        isAiEnriched,
      }),
    });
  } catch {
    // Do not break UX if persistence call fails.
  }
}

export async function researchProductAcrossPlatforms(keyword: string): Promise<ResearchOutput> {
  const cleanedKeyword = keyword.trim();

  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const createJob = await fetch(`${API_BASE_URL}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: cleanedKeyword,
          platforms: ["amazon", "flipkart", "meesho"],
          max_products: 15,
        }),
      });

      if (!createJob.ok) {
        throw new Error("Unable to start backend research job");
      }

      const createData = (await createJob.json()) as CreateJobResponse;
      const startedAt = Date.now();
      const timeoutMs = 120000;

      while (Date.now() - startedAt < timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const jobStatus = await fetch(`${API_BASE_URL}/research/${createData.job_id}`);
        if (!jobStatus.ok) {
          const detail = await jobStatus.text();
          const preview = detail.slice(0, 240);
          const isRecoverableNotFound =
            jobStatus.status === 404 && /job\s+not\s+found/i.test(detail) && attempt === 0;

          if (isRecoverableNotFound) {
            break;
          }

          throw new Error(`Unable to fetch backend job status (${jobStatus.status}) ${preview}`.trim());
        }

        const statusData = (await jobStatus.json()) as JobStatusResponse;
        if (statusData.status === "completed" && statusData.result) {
          const normalized = normalizeBackendOutput(statusData.result, cleanedKeyword);
          const enriched = await enrichWithGemini(normalized, cleanedKeyword);
          await persistFinalOutput(
            createData.job_id,
            cleanedKeyword,
            enriched.output,
            enriched.aiApplied,
          );
          return enriched.output;
        }

        if (statusData.status === "failed") {
          throw new Error(statusData.errors?.join(" | ") || "Backend research failed");
        }
      }
    }

    throw new Error("Backend research timed out");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend API is unavailable. Start FastAPI + Scrapy runner to fetch real data.";
    throw new Error(message);
  }
}

function deriveBestBuy(rows: ProductResearchRow[]): { platform: PlatformName | null; reason: string } {
  const formatRupees = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const byPlatform = new Map<PlatformName, ProductResearchRow[]>();

  for (const row of rows) {
    const current = byPlatform.get(row.platform) || [];
    current.push(row);
    byPlatform.set(row.platform, current);
  }

  const marketLowestAvgPrice = Math.min(
    ...Array.from(byPlatform.values()).map((entries) =>
      entries.reduce((sum, row) => sum + row.price, 0) / entries.length,
    ),
  );

  const scored = Array.from(byPlatform.entries()).map(([platform, entries]) => {
    const avgPrice = entries.reduce((sum, row) => sum + row.price, 0) / entries.length;
    const ratingValues = entries
      .map((row) => row.rating)
      .filter((rating): rating is number => typeof rating === "number");
    const avgRating = ratingValues.length > 0
      ? ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length
      : 0;
    const totalReviews = entries.reduce((sum, row) => sum + (row.reviews ?? 0), 0);
    const reviewConfidence = Math.min(Math.log10(totalReviews + 1) / 4, 1);
    const liveCount = entries.filter((row) => !row.signal.toLowerCase().includes("fallback")).length;
    const stockPressureCount = entries.filter((row) => row.signal.toLowerCase().includes("stock pressure")).length;
    const liveRatio = entries.length > 0 ? liveCount / entries.length : 0;
    const deliveryReadiness = entries.length > 0 ? 1 - stockPressureCount / entries.length : 0;
    const priceScore = avgPrice > 0 ? marketLowestAvgPrice / avgPrice : 0;
    const ratingScore = avgRating > 0 ? avgRating / 5 : 0;
    const score = priceScore * 40 + ratingScore * 30 + reviewConfidence * 12 + liveRatio * 13 + deliveryReadiness * 5;
    return { platform, avgPrice, avgRating, liveRatio, deliveryReadiness, score };
  });

  if (scored.length === 0) {
    return {
      platform: null,
      reason: "No live listings available yet for this keyword.",
    };
  }

  const winner = scored.reduce((best, current) => (current.score > best.score ? current : best), scored[0]);

  return {
    platform: winner.platform,
    reason: `${winner.platform} shows the best balance of price (${formatRupees(winner.avgPrice)}), rating confidence (${winner.avgRating.toFixed(1)}), live coverage (${Math.round(winner.liveRatio * 100)}%), and delivery readiness (${Math.round(winner.deliveryReadiness * 100)}%).`,
  };
}
