export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
};

export type PriceTrendPoint = {
  period: string;
  amazon: number;
  flipkart: number;
  meesho: number;
};

export type SentimentPoint = {
  name: "Positive" | "Neutral" | "Negative";
  value: number;
};

export type OpportunityPoint = {
  category: string;
  score: number;
};

export type DashboardSnapshot = {
  metrics: DashboardMetric[];
  priceTrendData: PriceTrendPoint[];
  sentimentData: SentimentPoint[];
  opportunityData: OpportunityPoint[];
  recentAlerts: string[];
  competitorActivity: string[];
  strategyRecommendations: string[];
  generatedAt: string;
  hasLiveData: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const response = await fetch(`${API_BASE_URL}/dashboard`, { cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Unable to fetch dashboard data (${response.status}) ${detail.slice(0, 240)}`.trim());
  }
  return response.json() as Promise<DashboardSnapshot>;
}