import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="saas-gradient min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <h1 className="text-xl font-bold tracking-tight">MarketSense AI</h1>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Start Free Trial</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-16 px-6 pb-16 pt-6">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              Built for modern e-commerce growth teams
            </p>
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
              AI-Powered Competitive Intelligence for E-commerce Sellers
            </h2>
            <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              Track competitors, analyze reviews, and receive AI strategy recommendations in real time.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup">
                <Button size="lg">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">View Demo</Button>
              </Link>
            </div>
          </div>

          <Card className="rounded-3xl border-0 bg-gradient-to-br from-blue-600 to-purple-700 text-white shadow-2xl shadow-indigo-700/30">
            <CardHeader>
              <CardTitle className="text-white">Why teams choose MarketSense AI</CardTitle>
              <CardDescription className="text-indigo-100">
                Real-time data collection + actionable AI strategy layer.
              </CardDescription>
            </CardHeader>
            <div className="grid gap-4 px-5 pb-5">
              <div className="rounded-xl bg-white/10 p-4">99.2% competitor price tracking accuracy</div>
              <div className="rounded-xl bg-white/10 p-4">24/7 review intelligence and sentiment monitoring</div>
              <div className="rounded-xl bg-white/10 p-4">AI recommendations aligned to conversion impact</div>
            </div>
          </Card>
        </section>

        <section id="features" className="space-y-5">
          <h3 className="text-2xl font-bold">Features</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <BarChart3 className="mb-3 h-6 w-6 text-indigo-500" />
                <CardTitle>Competitor Tracking</CardTitle>
                <CardDescription>Monitor listings, pricing, and product launches across platforms.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="mb-3 h-6 w-6 text-indigo-500" />
                <CardTitle>Review Intelligence</CardTitle>
                <CardDescription>Detect sentiment patterns, top complaints, and praise drivers.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Sparkles className="mb-3 h-6 w-6 text-indigo-500" />
                <CardTitle>AI Strategy Engine</CardTitle>
                <CardDescription>Get priority recommendations to improve conversion and retention.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section id="how-it-works" className="space-y-4">
          <h3 className="text-2xl font-bold">How it Works</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {["Connect products", "Track signals", "Execute AI strategy"].map((step, index) => (
              <Card key={step}>
                <CardHeader>
                  <CardDescription>Step {index + 1}</CardDescription>
                  <CardTitle>{step}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="testimonials" className="space-y-4">
          <h3 className="text-2xl font-bold">Testimonials</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>&quot;We improved Buy Box share by 17% in 6 weeks.&quot;</CardDescription>
                <CardTitle>Head of Growth, NovaCart</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>&quot;Review analytics gave us clear product roadmap priorities.&quot;</CardDescription>
                <CardTitle>Founder, Trendify Labs</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section id="pricing" className="space-y-4">
          <h3 className="text-2xl font-bold">Pricing</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Starter", price: "$29/mo" },
              { name: "Growth", price: "$79/mo" },
              { name: "Scale", price: "$149/mo" },
            ].map((plan) => (
              <Card key={plan.name}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.price}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="faq" className="space-y-4">
          <h3 className="text-2xl font-bold">FAQ</h3>
          <div className="space-y-3">
            {[
              "How often is competitor data updated? Every 30 minutes.",
              "Can I export reports? Yes, PDF and CSV exports are supported.",
              "Do you support multiple marketplaces? Yes, Amazon, Flipkart, and Shopify.",
            ].map((item) => (
              <Card key={item}>
                <CardHeader>
                  <CardDescription>{item}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/60 px-6 py-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
        <p className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          © {new Date().getFullYear()} MarketSense AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
