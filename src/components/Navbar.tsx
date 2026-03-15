"use client";

import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export function Navbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          MarketSense <span className="text-indigo-500">AI</span>
        </Link>
        <span className="hidden rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 md:inline-flex dark:bg-indigo-900/40 dark:text-indigo-300">
          Smart Shopper Assistant
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div className="hidden text-sm text-slate-600 sm:block dark:text-slate-300">
          {user ? `Hi, ${user.name}` : "Welcome"}
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
