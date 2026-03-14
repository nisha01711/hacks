import { AppShell } from "@/components/AppShell";
import { ReviewSentimentChart } from "@/components/Charts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { topComplaints, topPraisedFeatures } from "@/lib/mock-data";

export default function ReviewsPage() {
  return (
    <ProtectedRoute>
      <AppShell
        title="Review Intelligence"
        subtitle="Analyze sentiment distribution and uncover quality opportunities."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ReviewSentimentChart />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sentiment Snapshot</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-sm">
              <p className="rounded-lg bg-emerald-100 px-3 py-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Positive Reviews: 62%</p>
              <p className="rounded-lg bg-amber-100 px-3 py-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Neutral Reviews: 24%</p>
              <p className="rounded-lg bg-rose-100 px-3 py-2 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Negative Reviews: 14%</p>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Complaints</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {topComplaints.map((complaint) => (
                <p key={complaint} className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">{complaint}</p>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Praised Features</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {topPraisedFeatures.map((feature) => (
                <p key={feature} className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">{feature}</p>
              ))}
            </div>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
