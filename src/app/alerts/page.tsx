import { AlertsList } from "@/components/AlertsList";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const alertExamples = [
  "Price dropped by 12% on your watched sunscreen.",
  "A top-rated listing is now available with same-day delivery.",
  "Customer ratings improved rapidly for your tracked product.",
];

export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <AppShell
        title="Shopping Alerts"
        subtitle="Stay updated on price drops, rating shifts, and useful marketplace updates."
      >
        <AlertsList alerts={alertExamples} />

        <Card>
          <CardHeader>
            <CardTitle>Alert Overview</CardTitle>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">High Priority: 5</p>
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Medium Priority: 13</p>
            <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">Low Priority: 19</p>
          </div>
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}
