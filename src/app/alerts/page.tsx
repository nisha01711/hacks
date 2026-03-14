import { AlertsList } from "@/components/AlertsList";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const alertExamples = [
  "Competitor reduced price by 12%.",
  "Competitor launched improved version.",
  "Competitor reviews increased rapidly.",
];

export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <AppShell
        title="Competitor Alerts"
        subtitle="Stay updated with high-impact competitor moves in real time."
      >
        <AlertsList alerts={alertExamples} />

        <Card>
          <CardHeader>
            <CardTitle>Alert Feed Health</CardTitle>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Critical Alerts: 5</p>
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Medium Alerts: 13</p>
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Low Alerts: 19</p>
          </div>
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}
