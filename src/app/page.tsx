import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="saas-gradient min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 sm:py-6">
        <h1 className="text-lg font-bold tracking-tight sm:text-xl">MarketSense AI</h1>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="sm:size-default">Login</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="sm:size-default"><span className="hidden sm:inline">Start Free Trial</span><span className="sm:hidden">Sign Up</span></Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-16 px-6 pb-16 pt-6">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-5 sm:space-y-6">
            <p className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              Built for smart everyday shoppers
            </p>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Compare Prices, Reviews, and Value Before You Buy
            </h2>
            <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              Check Amazon, Flipkart, and Meesho side-by-side and get instant buying guidance powered by data.
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

          <Card className="rounded-3xl border-0 bg-linear-to-br from-blue-600 to-purple-700 text-white shadow-2xl shadow-indigo-700/30">
            <CardHeader>
              <CardTitle className="text-white">Why shoppers choose MarketSense AI</CardTitle>
              <CardDescription className="text-indigo-100">
                Real-time comparison plus clear buy-now or wait guidance.
              </CardDescription>
            </CardHeader>
            <div className="grid gap-4 px-5 pb-5">
              <div className="rounded-xl bg-white/10 p-4">Compare low, medium, and high price tiers instantly</div>
              <div className="rounded-xl bg-white/10 p-4">Understand what real customers praise and complain about</div>
              <div className="rounded-xl bg-white/10 p-4">Get smart suggestions on where and when to buy</div>
            </div>
          </Card>
        </section>

        <section id="features" className="space-y-5">
          <h3 className="text-2xl font-bold">Features</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <BarChart3 className="mb-3 h-6 w-6 text-indigo-500" />
                <CardTitle>Price Comparison</CardTitle>
                <CardDescription>Track prices across stores and quickly spot the best deal.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="mb-3 h-6 w-6 text-indigo-500" />
                <CardTitle>Review Intelligence</CardTitle>
                <CardDescription>See top complaints and loved features before checkout.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Sparkles className="mb-3 h-6 w-6 text-indigo-500" />
                <CardTitle>Smart Buy Guidance</CardTitle>
                <CardDescription>Get AI-backed advice on best store, timing, and value picks.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section id="how-it-works" className="space-y-4">
          <h3 className="text-2xl font-bold">How it Works</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {["Search a product", "Compare live listings", "Buy with confidence"].map((step, index) => (
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
                <CardDescription>&quot;I saved over ₹1,800 in one month by timing my purchases better.&quot;</CardDescription>
                <CardTitle>Priya M, Bengaluru</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>&quot;The review summary warned me about quality issues before I ordered.&quot;</CardDescription>
                <CardTitle>Arun K, Chennai</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section id="pricing" className="space-y-4">
          <h3 className="text-2xl font-bold">Pricing</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Free", price: "₹0/mo" },
              { name: "Plus", price: "₹199/mo" },
              { name: "Pro", price: "₹399/mo" },
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
              "How often are prices updated? The app refreshes marketplace signals regularly.",
              "Can I export my shopping reports? Yes, PDF and CSV exports are available.",
              "Which stores are supported? Amazon, Flipkart, and Meesho.",
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
