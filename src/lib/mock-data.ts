export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
};

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Products Monitored", value: "148", change: "+12%" },
  { label: "Competitors Tracked", value: "37", change: "+6%" },
  { label: "Price Alerts", value: "24", change: "+18%" },
  { label: "AI Insights Generated", value: "312", change: "+29%" },
];

export const priceTrendData = [
  { week: "W1", yourPrice: 109, competitorA: 119, competitorB: 114 },
  { week: "W2", yourPrice: 104, competitorA: 115, competitorB: 112 },
  { week: "W3", yourPrice: 102, competitorA: 110, competitorB: 108 },
  { week: "W4", yourPrice: 99, competitorA: 108, competitorB: 105 },
  { week: "W5", yourPrice: 97, competitorA: 104, competitorB: 103 },
];

export const sentimentData = [
  { name: "Positive", value: 62 },
  { name: "Neutral", value: 24 },
  { name: "Negative", value: 14 },
];

export const opportunityData = [
  { category: "Pricing", score: 86 },
  { category: "Quality", score: 72 },
  { category: "Marketing", score: 91 },
  { category: "Retention", score: 68 },
];

export const recentAlerts = [
  "Competitor reduced price by 12% on flagship SKU.",
  "Competitor launched improved version with faster charging.",
  "Competitor reviews increased 34% in the last 7 days.",
  "Category ad spend spiked 18% week-over-week.",
];

export const competitorActivity = [
  "BrandNova added 3 new products in Electronics.",
  "SwiftCart changed listing title for top-selling SKU.",
  "StoreAxis entered 2 new marketplaces this week.",
];

export const strategyRecommendations = [
  "Reduce price by 5% for weekend campaigns to gain Buy Box share.",
  "Improve product material quality for durability-related complaints.",
  "Launch a promotional campaign targeting high-conversion keywords.",
  "Shift marketing focus to battery life messaging in creatives.",
];

export type ProductRow = {
  id: string;
  product: string;
  platform: "Amazon" | "Flipkart" | "Shopify";
  price: number;
  rating: number;
  reviews: number;
};

export const mockProducts: ProductRow[] = [
  {
    id: "p-1001",
    product: "MarketSense Smart Blender",
    platform: "Amazon",
    price: 99,
    rating: 4.5,
    reviews: 1840,
  },
  {
    id: "p-1002",
    product: "MarketSense Air Fryer",
    platform: "Flipkart",
    price: 129,
    rating: 4.3,
    reviews: 1262,
  },
  {
    id: "p-1003",
    product: "MarketSense Coffee Maker",
    platform: "Shopify",
    price: 89,
    rating: 4.6,
    reviews: 932,
  },
];

export const topComplaints = [
  "Battery backup drops after heavy usage.",
  "Packaging quality can be improved.",
  "Delivery delays in tier-2 cities.",
];

export const topPraisedFeatures = [
  "Excellent value for money.",
  "Easy to set up and use.",
  "Strong performance and battery life.",
];

export const adminUsers = [
  { name: "Oviya Sri", email: "oviya@marketsense.ai", plan: "Growth", status: "Active" },
  { name: "Rahul Das", email: "rahul@storepilot.com", plan: "Starter", status: "Active" },
  { name: "Nisha Kapoor", email: "nisha@trendkart.io", plan: "Scale", status: "Trial" },
];

export const adminProducts = [
  { sku: "SKU-901", name: "Smart Blender", owner: "storepilot.com", tracked: "Yes" },
  { sku: "SKU-742", name: "Air Fryer", owner: "trendkart.io", tracked: "Yes" },
  { sku: "SKU-510", name: "Coffee Maker", owner: "oviya-store.com", tracked: "No" },
];
