import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { dashboardMetrics } from "@/lib/mock-data";

export function DashboardCards({ isLoading = false }: { isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="h-28 animate-pulse bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {dashboardMetrics.map((metric) => (
        <Card key={metric.label}>
          <p className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metric.value}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <ArrowUpRight className="h-3 w-3" />
              {metric.change}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
