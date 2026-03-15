"use client";

import { AppShell } from "@/components/AppShell";
import {
  CompetitorPriceTrendChart,
  OpportunityScoreChart,
  ReviewSentimentChart,
} from "@/components/Charts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function downloadCsv() {
  const csv = [
    "Metric,Value",
    "Marketplace Price Trend,Declining by 8% average",
    "Review Sentiment,Positive 62%",
    "Customer Value Signals,High across savings and quality",
    "Recommended Actions,Set alerts and buy on next discount window",
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "marketsense-weekly-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function exportPdf() {
  window.print();
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <AppShell
        title="Shopping Report"
        subtitle="Your weekly summary of price trends, review sentiment, and smart buying actions."
      >
        <Card>
          <CardHeader>
            <CardTitle>Report Actions</CardTitle>
            <CardDescription>Export your shopping intelligence snapshot.</CardDescription>
          </CardHeader>
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportPdf}>Export PDF</Button>
            <Button variant="outline" onClick={downloadCsv}>Export CSV</Button>
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <CompetitorPriceTrendChart />
          <ReviewSentimentChart />
        </div>

        <OpportunityScoreChart />

        <Card>
          <CardHeader>
            <CardTitle>Recommended Next Steps</CardTitle>
          </CardHeader>
          <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-700 dark:text-slate-200">
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Buy from the platform with the best value score this week.</p>
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Set a price alert before checking out high-ticket items.</p>
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Prioritize products with positive quality sentiment.</p>
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Compare bundle unit prices before choosing combo offers.</p>
          </div>
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}
