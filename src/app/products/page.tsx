"use client";

import { FormEvent, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { CompetitorPriceTrendChart } from "@/components/Charts";
import { ProductTable } from "@/components/ProductTable";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { researchProductAcrossPlatforms, ResearchSummary, ProductResearchRow } from "@/lib/research-agent";

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildVendorInsights(rows: ProductResearchRow[]) {
  const byPlatform = new Map<string, ProductResearchRow[]>();

  for (const row of rows) {
    const current = byPlatform.get(row.platform) || [];
    current.push(row);
    byPlatform.set(row.platform, current);
  }

  return Array.from(byPlatform.entries())
    .map(([platform, entries]) => {
      const validPrices = entries.filter((entry) => entry.price > 0);
      const validRatings = entries
        .map((entry) => entry.rating)
        .filter((rating): rating is number => typeof rating === "number");
      const validReviews = entries
        .map((entry) => entry.reviews)
        .filter((reviews): reviews is number => typeof reviews === "number");
      const fallbackCount = entries.filter((entry) => entry.signal.toLowerCase().includes("fallback")).length;

      const avgPrice = validPrices.length > 0
        ? validPrices.reduce((sum, entry) => sum + entry.price, 0) / validPrices.length
        : 0;
      const avgRating = validRatings.length > 0
        ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
        : null;
      const totalReviews = validReviews.reduce((sum, reviews) => sum + reviews, 0);
      const liveCount = entries.length - fallbackCount;

      let reason = "Balanced option across current listings.";
      if (avgRating !== null && avgRating >= 4.4 && avgPrice > 0) {
        reason = `Best quality signal with an average rating of ${avgRating.toFixed(1)}.`;
      } else if (avgPrice > 0) {
        reason = `Good value based on an average price of ${formatInr(avgPrice)}.`;
      }
      if (liveCount > 0) {
        reason += ` ${liveCount} live listing${liveCount > 1 ? "s" : ""} confirmed.`;
      } else {
        reason += " Recommendation currently relies on fallback estimates.";
      }

      return {
        platform,
        avgPrice,
        avgRating,
        totalReviews,
        listings: entries.length,
        liveCount,
        fallbackCount,
        reason,
      };
    })
    .sort((left, right) => {
      if (right.liveCount !== left.liveCount) {
        return right.liveCount - left.liveCount;
      }
      if ((right.avgRating ?? 0) !== (left.avgRating ?? 0)) {
        return (right.avgRating ?? 0) - (left.avgRating ?? 0);
      }
      return left.avgPrice - right.avgPrice;
    });
}

const competitorComparisonData = [
  { brand: "Amazon", score: 84 },
  { brand: "Flipkart", score: 78 },
  { brand: "Meesho", score: 74 },
  { brand: "Other Stores", score: 69 },
];

export default function ProductsPage() {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<ProductResearchRow[]>([]);
  const [summary, setSummary] = useState<ResearchSummary | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleResearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedKeyword = keyword.trim();
    if (!cleanedKeyword) return;

    setIsResearching(true);
    setError("");

    try {
      const output = await researchProductAcrossPlatforms(cleanedKeyword);

      setProducts(output.rows);
      setSummary(output.summary);
      if (typeof window !== "undefined") {
        localStorage.setItem("marketsense_last_keyword", cleanedKeyword);
      }
    } catch (err) {
      setProducts([]);
      setSummary(null);
      setError(err instanceof Error ? err.message : "Unable to fetch product data.");
    } finally {
      setIsResearching(false);
    }
  }

  function clearResults() {
    setProducts([]);
    setSummary(null);
    setKeyword("");
    setError("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("marketsense_last_keyword");
    }
  }

  function display(value: string | null | undefined) {
    return value || "N/A";
  }

  const vendorInsights = buildVendorInsights(products);

  const recommendedVendor = vendorInsights.find((vendor) => vendor.platform === summary?.bestBuyPlatform) || vendorInsights[0];

  return (
    <ProtectedRoute>
      <AppShell
        title="Price Compare"
        subtitle="Search one product and compare stores, prices, and quality signals in one place."
      >
        <Card>
          <CardHeader>
            <CardTitle>Compare Product Across Stores</CardTitle>
            <CardDescription>
              Enter a product keyword like &quot;sunscreen&quot;. We compare multiple marketplaces and return one clear result.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleResearch} className="flex flex-col gap-3">
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Example: sunscreen"
            />
            <div className="flex gap-3">
              <Button type="submit" disabled={isResearching} className="flex-1">
                {isResearching ? "Researching..." : "Run Agent"}
              </Button>
              <Button type="button" variant="outline" onClick={clearResults}>
                Clear
              </Button>
            </div>
          </form>
        </Card>

        {error ? (
          <Card>
            <p className="rounded-lg bg-rose-100 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </p>
          </Card>
        ) : null}

        {summary ? (
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Vendor for &quot;{summary.searchedKeyword}&quot;</CardTitle>
                <CardDescription>
                  Lowest Price: {display(summary.bestPricePlatform)} | Best Reviews: {display(summary.bestRatedPlatform)} | Avg Market Price: {summary.avgPrice > 0 ? formatInr(summary.avgPrice) : "N/A"}
                </CardDescription>
              </CardHeader>
              <div className="space-y-3 px-6 pb-6">
                <div className="rounded-xl bg-emerald-100 p-4 dark:bg-emerald-900/30">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Best Vendor To Buy From</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100">{display(summary.bestBuyPlatform)}</p>
                </div>
                <div className="rounded-xl bg-blue-100 p-4 dark:bg-blue-900/30">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Why This Vendor</p>
                  <p className="mt-2 text-sm leading-6 text-blue-900 dark:text-blue-100">{summary.bestBuyReason}</p>
                </div>
                <div className="rounded-xl bg-indigo-100 p-4 dark:bg-indigo-900/30">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">Customer Buying Tip</p>
                  <p className="mt-2 text-sm leading-6 text-indigo-900 dark:text-indigo-100">{summary.recommendation}</p>
                </div>
                <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Coverage</p>
                  <p className="mt-2 text-sm leading-6 text-slate-800 dark:text-slate-100">
                    We checked {summary.totalProducts} listings across Amazon, Flipkart, and Meesho and combined price, rating, and live-availability signals to decide the best vendor.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vendor Breakdown</CardTitle>
                <CardDescription>
                  Use this to explain to customers why one store is better than the others.
                </CardDescription>
              </CardHeader>
              <div className="space-y-3 px-6 pb-6">
                {vendorInsights.map((vendor) => {
                  const isRecommended = vendor.platform === recommendedVendor?.platform;
                  return (
                    <div
                      key={vendor.platform}
                      className={isRecommended ? "rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-900/20" : "rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40"}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{vendor.platform}</p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{vendor.reason}</p>
                        </div>
                        {isRecommended ? (
                          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                            Recommended
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-200">
                        <p>Avg Price: {vendor.avgPrice > 0 ? formatInr(vendor.avgPrice) : "N/A"}</p>
                        <p>Avg Rating: {vendor.avgRating ? vendor.avgRating.toFixed(1) : "N/A"}</p>
                        <p>Total Reviews: {vendor.totalReviews || "N/A"}</p>
                        <p>Live Rows: {vendor.liveCount}/{vendor.listings}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : null}

        <ProductTable data={products} isLoading={isResearching} recommendedPlatform={summary?.bestBuyPlatform ?? null} />

        <div className="grid gap-4 xl:grid-cols-2">
          <CompetitorPriceTrendChart />
          <Card>
            <CardHeader>
              <CardTitle>Store Value Comparison</CardTitle>
            </CardHeader>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={competitorComparisonData}>
                  <XAxis dataKey="brand" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
