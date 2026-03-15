"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar onMenuToggle={() => setMobileOpen((prev) => !prev)} />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
          </div>
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
