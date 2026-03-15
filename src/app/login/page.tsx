"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    logout();
  }, [logout]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message ?? "Login failed.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="saas-gradient flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Login to access your MarketSense AI workspace.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </Button>

          <p className="text-center text-sm text-slate-600 dark:text-slate-300">
            No account yet?{" "}
            <Link href="/signup" className="font-semibold text-indigo-600">Sign up</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
