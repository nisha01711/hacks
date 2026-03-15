"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  LineChart,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/products", label: "Price Compare", icon: ClipboardList },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/strategy", label: "Recommendations", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: LineChart },
];

export function Sidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const navLinks = (
    <nav className="space-y-1">
      {links.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/70 bg-white/70 p-4 backdrop-blur lg:block dark:border-slate-800 dark:bg-slate-950/50">
        {navLinks}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white p-4 shadow-xl transition-transform duration-200 ease-in-out lg:hidden dark:bg-slate-950",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
            MarketSense <span className="text-indigo-500">AI</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {navLinks}
      </div>
    </>
  );
}
