import { Bell } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function AlertsList({ alerts }: { alerts: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No alerts right now. We will notify you when prices or ratings change.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert}
              className="flex items-start gap-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
            >
              <Bell className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{alert}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
