"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  OpportunityPoint,
  PriceTrendPoint,
  SentimentPoint,
} from "@/lib/dashboard";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const pieColors = ["#4f46e5", "#7c3aed", "#f43f5e"];

const fallbackPriceTrendData: PriceTrendPoint[] = [
  { period: "T1", amazon: 109, flipkart: 119, meesho: 114 },
  { period: "T2", amazon: 104, flipkart: 115, meesho: 112 },
  { period: "T3", amazon: 102, flipkart: 110, meesho: 108 },
  { period: "T4", amazon: 99, flipkart: 108, meesho: 105 },
  { period: "T5", amazon: 97, flipkart: 104, meesho: 103 },
];

const fallbackSentimentData: SentimentPoint[] = [
  { name: "Positive", value: 62 },
  { name: "Neutral", value: 24 },
  { name: "Negative", value: 14 },
];

const fallbackOpportunityData: OpportunityPoint[] = [
  { category: "Savings", score: 86 },
  { category: "Quality", score: 72 },
  { category: "Value", score: 91 },
  { category: "Trust", score: 68 },
];

export function CompetitorPriceTrendChart({ data = fallbackPriceTrendData }: { data?: PriceTrendPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace Price Trend</CardTitle>
      </CardHeader>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amazon" stroke="#4f46e5" strokeWidth={2} />
            <Line type="monotone" dataKey="flipkart" stroke="#06b6d4" strokeWidth={2} />
            <Line type="monotone" dataKey="meesho" stroke="#7c3aed" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ReviewSentimentChart({ data = fallbackSentimentData }: { data?: SentimentPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Sentiment Breakdown</CardTitle>
      </CardHeader>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={95} label>
              {data.map((entry) => (
                <Cell key={entry.name} fill={pieColors[data.indexOf(entry) % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function OpportunityScoreChart({ data = fallbackOpportunityData }: { data?: OpportunityPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Value Score</CardTitle>
      </CardHeader>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#4f46e5" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
