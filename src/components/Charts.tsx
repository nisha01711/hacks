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
  opportunityData,
  priceTrendData,
  sentimentData,
} from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const pieColors = ["#4f46e5", "#7c3aed", "#f43f5e"];

export function CompetitorPriceTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitor Price Trend</CardTitle>
      </CardHeader>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceTrendData}>
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="yourPrice" stroke="#4f46e5" strokeWidth={2} />
            <Line type="monotone" dataKey="competitorA" stroke="#06b6d4" strokeWidth={2} />
            <Line type="monotone" dataKey="competitorB" stroke="#7c3aed" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ReviewSentimentChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Sentiment Breakdown</CardTitle>
      </CardHeader>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={95} label>
              {sentimentData.map((entry) => (
                <Cell key={entry.name} fill={pieColors[sentimentData.indexOf(entry) % pieColors.length]} />
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

export function OpportunityScoreChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Opportunity Score</CardTitle>
      </CardHeader>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={opportunityData}>
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
