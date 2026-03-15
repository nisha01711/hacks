import { AppShell } from "@/components/AppShell";
import { OpportunityScoreChart } from "@/components/Charts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StrategyPanel } from "@/components/StrategyPanel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { strategyRecommendations } from "@/lib/mock-data";

export default function StrategyPage() {
  return (
    <ProtectedRoute>
      <AppShell
        title="Smart Recommendations"
        subtitle="Turn price and review signals into better shopping decisions."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <StrategyPanel recommendations={strategyRecommendations} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Shopping Score</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <p className="rounded-lg bg-indigo-100 px-3 py-2 dark:bg-indigo-900/40">Overall Value: 82/100</p>
              <p className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">Priority: Price + Product Quality</p>
              <p className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">Confidence: High (Based on 14K reviews)</p>
            </div>
          </Card>
        </div>

        <OpportunityScoreChart />
      </AppShell>
    </ProtectedRoute>
  );
}
