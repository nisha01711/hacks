"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          MarketSense <span className="text-indigo-500">AI</span>
        </Link>
        <span className="hidden rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 md:inline-flex dark:bg-indigo-900/40 dark:text-indigo-300">
          SaaS Intelligence Suite
        </span>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="hidden text-sm text-slate-600 sm:block dark:text-slate-300">
          {user ? `Hi, ${user.name}` : "Welcome"}
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
