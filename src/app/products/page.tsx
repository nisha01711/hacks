"use client";

import { FormEvent, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { CompetitorPriceTrendChart } from "@/components/Charts";
import { ProductTable } from "@/components/ProductTable";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockProducts, ProductRow } from "@/lib/mock-data";

const competitorComparisonData = [
  { brand: "Your Brand", score: 84 },
  { brand: "BrandNova", score: 78 },
  { brand: "SwiftCart", score: 74 },
  { brand: "StoreAxis", score: 69 },
];

export default function ProductsPage() {
  const [productUrl, setProductUrl] = useState("");
  const [platform, setPlatform] = useState<ProductRow["platform"]>("Amazon");
  const [products, setProducts] = useState<ProductRow[]>(mockProducts);

  function handleAddProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!productUrl.trim()) return;

    const nextProduct: ProductRow = {
      id: `p-${Date.now()}`,
      product: `Tracked Product (${platform})`,
      platform,
      price: Math.floor(Math.random() * 80) + 70,
      rating: Number((Math.random() * 1 + 3.8).toFixed(1)),
      reviews: Math.floor(Math.random() * 1500) + 100,
    };

    setProducts((current) => [nextProduct, ...current]);
    setProductUrl("");
  }

  return (
    <ProtectedRoute>
      <AppShell
        title="Product Monitoring"
        subtitle="Track product pricing, ratings, and competitor benchmark performance."
      >
        <Card>
          <CardHeader>
            <CardTitle>Add Product URL</CardTitle>
          </CardHeader>
          <form onSubmit={handleAddProduct} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <Input
              value={productUrl}
              onChange={(event) => setProductUrl(event.target.value)}
              placeholder="https://example.com/product"
            />
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value as ProductRow["platform"])}
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="Amazon">Amazon</option>
              <option value="Flipkart">Flipkart</option>
              <option value="Shopify">Shopify</option>
            </select>
            <Button type="submit">Add Product</Button>
          </form>
        </Card>

        <ProductTable data={products} />

        <div className="grid gap-4 xl:grid-cols-2">
          <CompetitorPriceTrendChart />
          <Card>
            <CardHeader>
              <CardTitle>Competitor Comparison</CardTitle>
            </CardHeader>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={competitorComparisonData}>
                  <XAxis dataKey="brand" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
