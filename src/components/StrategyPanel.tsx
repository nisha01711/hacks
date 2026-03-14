import { Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function StrategyPanel({ recommendations }: { recommendations: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Recommendations</CardTitle>
      </CardHeader>

      {recommendations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No AI recommendations yet. Keep tracking market signals.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recommendations.map((recommendation) => (
            <div key={recommendation} className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
              <div className="mb-2 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">AI Strategy</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200">{recommendation}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
