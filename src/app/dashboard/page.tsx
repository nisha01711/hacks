"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AlertsList } from "@/components/AlertsList";
import {
  CompetitorPriceTrendChart,
  OpportunityScoreChart,
  ReviewSentimentChart,
} from "@/components/Charts";
import { DashboardCards } from "@/components/DashboardCards";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StrategyPanel } from "@/components/StrategyPanel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSnapshot, fetchDashboardSnapshot } from "@/lib/dashboard";

const emptyDashboard: DashboardSnapshot = {
  metrics: [],
  priceTrendData: [],
  sentimentData: [],
  opportunityData: [],
  recentAlerts: [],
  competitorActivity: [],
  strategyRecommendations: [],
  generatedAt: "",
  hasLiveData: false,
};

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        const data = await fetchDashboardSnapshot();
        if (!cancelled) {
          setSnapshot(data);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load live dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProtectedRoute>
      <AppShell
        title="Shopping Hub"
        subtitle="Your personal overview of deals, review sentiment, and smart buying suggestions."
      >
        {error ? (
          <Card>
            <p className="rounded-lg bg-rose-100 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </p>
          </Card>
        ) : null}

        <DashboardCards metrics={snapshot.metrics} isLoading={isLoading} />

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <CompetitorPriceTrendChart data={snapshot.priceTrendData} />
          </div>
          <ReviewSentimentChart data={snapshot.sentimentData} />
        </div>

        <OpportunityScoreChart data={snapshot.opportunityData} />

        <div className="grid gap-4 lg:grid-cols-3">
          <AlertsList alerts={snapshot.recentAlerts} />

          <Card>
            <CardHeader>
              <CardTitle>Marketplace Activity</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              {snapshot.competitorActivity.map((activity) => (
                <p key={activity} className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                  {activity}
                </p>
              ))}
            </div>
          </Card>

          <StrategyPanel recommendations={snapshot.strategyRecommendations.slice(0, 2)} />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
