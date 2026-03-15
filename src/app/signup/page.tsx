"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { validatePassword } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordCheck = validatePassword(password);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!passwordCheck.valid) {
      setError(`Password must include: ${passwordCheck.errors.join(", ")}.`);
      return;
    }

    setSubmitting(true);

    const result = await signup({ name, email, password });

    if (result.success) {
      router.push("/login");
      return;
    }

    setError(result.message ?? "Unable to create account.");
    setSubmitting(false);
  }

  return (
    <div className="saas-gradient flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>Start your free trial of MarketSense AI.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">Name</label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

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
              placeholder="Create a strong password"
              required
            />
            <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Rules: 8+ chars, uppercase, lowercase, number, special character, and no spaces.
            </div>
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account..." : "Sign Up"}
          </Button>

          <p className="text-center text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-indigo-600">Login</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
