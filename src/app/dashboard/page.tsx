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
import {
  competitorActivity,
  recentAlerts,
  strategyRecommendations,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell
        title="Dashboard"
        subtitle="Real-time overview of competitor intelligence and AI insights."
      >
        <DashboardCards />

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <CompetitorPriceTrendChart />
          </div>
          <ReviewSentimentChart />
        </div>

        <OpportunityScoreChart />

        <div className="grid gap-4 lg:grid-cols-3">
          <AlertsList alerts={recentAlerts} />

          <Card>
            <CardHeader>
              <CardTitle>Competitor Activity</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              {competitorActivity.map((activity) => (
                <p key={activity} className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                  {activity}
                </p>
              ))}
            </div>
          </Card>

          <StrategyPanel recommendations={strategyRecommendations.slice(0, 2)} />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
