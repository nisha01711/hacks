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
    "Competitor Price Trend,Declining by 8% average",
    "Review Sentiment,Positive 62%",
    "Market Opportunities,High in pricing and retention",
    "Recommended Actions,Run promo and improve material quality",
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
        title="Weekly Report"
        subtitle="Executive summary of pricing, sentiment, and market opportunity trends."
      >
        <Card>
          <CardHeader>
            <CardTitle>Report Actions</CardTitle>
            <CardDescription>Export snapshots for leadership and growth teams.</CardDescription>
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
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-700 dark:text-slate-200">
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Reduce price by 5% on key SKUs this week.</p>
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Improve product material quality in next batch.</p>
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Launch battery-life focused campaign messaging.</p>
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Retarget users who viewed but did not convert.</p>
          </div>
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}
