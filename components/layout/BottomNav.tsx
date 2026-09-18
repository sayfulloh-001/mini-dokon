"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Banknote, Users, BarChart3 } from "lucide-react";

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const navItems = [
    {
      href: "/hisob",
      label: "NARX",
      icon: Banknote,
    },
    {
      href: "/qarzdorlar",
      label: "QARZ",
      icon: Users,
    },
    {
      href: "/natija",
      label: "NATIJA",
      icon: BarChart3,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-sm md:hidden">
      <div className="grid grid-cols-3 h-14 max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const targetHref = code ? `${item.href}?code=${code}` : item.href;

          return (
            <Link
              key={item.href}
              href={targetHref}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive
                  ? "text-emerald-600 font-bold"
                  : "text-slate-400 font-medium hover:text-slate-700"
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-all ${
                  isActive ? "bg-emerald-50 text-emerald-600" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] tracking-wider ${isActive ? "font-extrabold text-emerald-700" : "font-semibold"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}
