export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
};

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Products Compared", value: "148", change: "+12%" },
  { label: "Deals Tracked", value: "37", change: "+6%" },
  { label: "Price Drop Alerts", value: "24", change: "+18%" },
  { label: "Smart Tips Generated", value: "312", change: "+29%" },
];

export const priceTrendData = [
  { week: "W1", amazon: 109, flipkart: 119, meesho: 114 },
  { week: "W2", amazon: 104, flipkart: 115, meesho: 112 },
  { week: "W3", amazon: 102, flipkart: 110, meesho: 108 },
  { week: "W4", amazon: 99, flipkart: 108, meesho: 105 },
  { week: "W5", amazon: 97, flipkart: 104, meesho: 103 },
];

export const sentimentData = [
  { name: "Positive", value: 62 },
  { name: "Neutral", value: 24 },
  { name: "Negative", value: 14 },
];

export const opportunityData = [
  { category: "Savings", score: 86 },
  { category: "Quality", score: 72 },
  { category: "Value", score: 91 },
  { category: "Trust", score: 68 },
];

export const recentAlerts = [
  "Sunscreen price dropped 12% on Amazon for the low tier.",
  "Flipkart launched a new combo pack with extra quantity.",
  "Meesho listing crossed 34% higher reviews this week.",
  "Weekend cashback offers are now live across key categories.",
];

export const competitorActivity = [
  "Amazon updated delivery promise to same-day for selected products.",
  "Flipkart increased discount depth in top-rated listings.",
  "Meesho listings added more budget-friendly bundle options.",
];

export const strategyRecommendations = [
  "Buy from the store with the best rating when the price gap is less than 5%.",
  "Set a price alert first, then purchase during the next discount cycle.",
  "Prefer bundles only when per-unit price is lower than regular packs.",
  "Use review sentiment to avoid products with repeated quality complaints.",
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
