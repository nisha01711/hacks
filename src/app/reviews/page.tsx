"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ReviewSentimentChart } from "@/components/Charts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getReviewInsightsForKeyword } from "@/lib/review-insights";
import { fetchSentimentSnapshot, SentimentSnapshot } from "@/lib/sentiment";

const emptySnapshot: SentimentSnapshot = {
  keyword: "",
  overallScore: 0,
  confidence: 0,
  distribution: [
    { name: "Positive", value: 0 },
    { name: "Neutral", value: 0 },
    { name: "Negative", value: 0 },
  ],
  platformStats: [],
  topPositiveThemes: [],
  topNegativeThemes: [],
  verdict: "No sentiment data yet.",
  recommendation: "Run product research to activate live sentiment analysis.",
  generatedAt: "",
  hasLiveData: false,
};

export default function ReviewsPage() {
  const [keyword] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("marketsense_last_keyword") || "";
  });
  const [snapshot, setSnapshot] = useState<SentimentSnapshot>(emptySnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const insights = useMemo(() => getReviewInsightsForKeyword(keyword), [keyword]);

  useEffect(() => {
    let cancelled = false;

    async function loadSentiment() {
      try {
        setIsLoading(true);
        const live = await fetchSentimentSnapshot(keyword);
        if (!cancelled) {
          setSnapshot(live);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setSnapshot(emptySnapshot);
          setError(loadError instanceof Error ? loadError.message : "Unable to load live sentiment analysis.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSentiment();
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  const sentimentMap = new Map(snapshot.distribution.map((item) => [item.name, item.value]));
  const total = snapshot.distribution.reduce((sum, item) => sum + item.value, 0);
  const pct = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

  return (
    <ProtectedRoute>
      <AppShell
        title="Review Insights"
        subtitle="See what customers love and what to avoid before making a purchase."
      >
        <Card>
          <CardHeader>
            <CardTitle>
              Insight Context: {keyword ? `Based on \"${keyword}\"` : "No product selected (showing latest live sentiment)"}
            </CardTitle>
          </CardHeader>
        </Card>

        {error ? (
          <Card>
            <p className="rounded-lg bg-rose-100 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </p>
          </Card>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ReviewSentimentChart data={snapshot.distribution} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Review Snapshot</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-sm">
              <p className="rounded-lg bg-emerald-100 px-3 py-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Positive Reviews: {pct(sentimentMap.get("Positive") || 0)}%</p>
              <p className="rounded-lg bg-amber-100 px-3 py-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Neutral Reviews: {pct(sentimentMap.get("Neutral") || 0)}%</p>
              <p className="rounded-lg bg-rose-100 px-3 py-2 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Negative Reviews: {pct(sentimentMap.get("Negative") || 0)}%</p>
              <p className="rounded-lg bg-indigo-100 px-3 py-2 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">Confidence: {Math.round(snapshot.confidence * 100)}%</p>
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Score: {snapshot.overallScore.toFixed(2)}</p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Verdict</CardTitle>
          </CardHeader>
          <div className="space-y-3 text-sm">
            <p className="rounded-lg bg-blue-100 p-3 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">{snapshot.verdict}</p>
            <p className="rounded-lg bg-indigo-100 p-3 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200">{snapshot.recommendation}</p>
            <p className="rounded-lg bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Engine Mode: {snapshot.hasLiveData ? "Live Mongo-backed sentiment analysis" : "Fallback"} {isLoading ? "(refreshing...)" : ""}
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform-Wise Sentiment Strength</CardTitle>
          </CardHeader>
          <div className="grid gap-3 md:grid-cols-3 text-sm">
            {snapshot.platformStats.length === 0 ? (
              <p className="rounded-lg bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">No platform sentiment rows available yet.</p>
            ) : (
              snapshot.platformStats.map((platform) => (
                <div key={platform.platform} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{platform.platform}</p>
                  <p className="text-slate-600 dark:text-slate-300">Score: {platform.sentimentScore.toFixed(2)}</p>
                  <p className="text-slate-600 dark:text-slate-300">Confidence: {Math.round(platform.confidence * 100)}%</p>
                  <p className="text-slate-600 dark:text-slate-300">Positive/Neutral/Negative: {platform.positivePct}% / {platform.neutralPct}% / {platform.negativePct}%</p>
                  <p className="text-slate-600 dark:text-slate-300">Samples: {platform.sampleSize}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Most Reported Issues</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {(snapshot.topNegativeThemes.length > 0 ? snapshot.topNegativeThemes : insights.complaints).map((complaint) => (
                <p key={complaint} className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">{complaint}</p>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Loved Features</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {(snapshot.topPositiveThemes.length > 0 ? snapshot.topPositiveThemes : insights.praises).map((feature) => (
                <p key={feature} className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">{feature}</p>
              ))}
            </div>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
