"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  DollarSign,
  RefreshCw,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatUzbekDate } from "@/lib/utils/date";

interface SummaryData {
  totalSales: number;
  salesCount: number;
  todaySales?: number;
  todaySalesCount?: number;
  allTimeSales?: number;
  allTimeSalesCount?: number;
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  periodDebtGiven: number;
  periodDebtCollected: number;
  totalActiveDebt: number;
  totalActiveDebtors: number;
}

interface ActivityItem {
  id: string;
  type: "SALE" | "INCOME" | "EXPENSE" | "DEBT_ADD" | "DEBT_PAYMENT" | "ADJUSTMENT";
  amount: number;
  title: string;
  description?: string;
  createdAt: string;
}

function NatijaContent() {
  const searchParams = useSearchParams();
  const storeCode = searchParams.get("code") || "";

  const [period, setPeriod] = useState<string>("today");
  const [periodLabel, setPeriodLabel] = useState<string>("Bugun");
  const [summary, setSummary] = useState<SummaryData>({
    totalSales: 0,
    salesCount: 0,
    todaySales: 0,
    todaySalesCount: 0,
    allTimeSales: 0,
    allTimeSalesCount: 0,
    totalIncome: 0,
    totalExpense: 0,
    netResult: 0,
    periodDebtGiven: 0,
    periodDebtCollected: 0,
    totalActiveDebt: 0,
    totalActiveDebtors: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const periods = [
    { key: "today", label: "Bugun" },
    { key: "7days", label: "7 kun" },
    { key: "this_month", label: "Bu oy" },
    { key: "2months", label: "2 oy" },
    { key: "3months", label: "3 oy" },
    { key: "4months", label: "4 oy" },
    { key: "5months", label: "5 oy" },
    { key: "6months", label: "6 oy" },
    { key: "1year", label: "1 yil" },
    { key: "2years", label: "2 yil" },
    { key: "all", label: "Barchasi" },
  ];

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      const url = storeCode
        ? `/api/dashboard?period=${period}&code=${storeCode}`
        : `/api/dashboard?period=${period}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        if (data.periodLabel) setPeriodLabel(data.periodLabel);
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error("Dashboard yuklashda xatolik:", err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [period, storeCode]);

  useEffect(() => {
    fetchDashboardData();

    // 24 soatlik tushum va barcha ma'lumotlarni doimiy yangilab turish uchun
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 20000); // har 20 soniyada fonda yangilaydi

    return () => clearInterval(interval);
  }, [fetchDashboardData]);
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-lg text-xs font-bold text-white flex items-center gap-2 animate-in slide-in-from-top-2 ${
            notification.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Vaqt filtri — Ixcham va scrollbarsiz */}
      <div className="bg-white rounded-2xl p-3 shadow-2xs border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Vaqt filtri ({periodLabel})</span>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Yangilash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Scrollable compact period chips — no scrollbar */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {periods.map((p) => {
            const isSelected = period === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Asosiy 4 ta ko'rsatkich — Foydalanuvchi talabiga ko'ra aynan 4 ta */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* 1. Tanlangan davr / Jami Tushum */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-2xs border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              {period === "all" ? "Jami Tushum" : `${periodLabel} Tushumi`}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight whitespace-nowrap">
            {formatCurrency(period === "all" ? (summary.allTimeSales ?? summary.totalSales) : summary.totalSales)}
          </div>
          <p className="text-[10px] text-slate-400 font-medium truncate">
            {period === "all" ? (summary.allTimeSalesCount ?? summary.salesCount) : summary.salesCount} ta savdo
          </p>
        </div>

        {/* 2. Bugungi Tushum (24 soatda yangilanib turadi) */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-2xs border border-emerald-100 bg-linear-to-b from-white to-emerald-50/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Bugungi Tushum
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-extrabold text-emerald-600 leading-tight whitespace-nowrap">
            {formatCurrency(summary.todaySales ?? 0)}
          </div>
          <p className="text-[10px] text-emerald-600/80 font-medium truncate flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            24 soatlik ({summary.todaySalesCount ?? 0} ta savdo)
          </p>
        </div>

        {/* 3. Qarzdorlar */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-2xs border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Qarzdorlar
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight whitespace-nowrap">
            {summary.totalActiveDebtors} ta
          </div>
          <p className="text-[10px] text-slate-400 font-medium truncate">
            Faol qarzdorlar soni
          </p>
        </div>

        {/* 4. Qarzdorlarning Jami Qarzi */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-2xs border border-red-100 bg-linear-to-b from-white to-red-50/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-red-600 uppercase tracking-wider">
              Jami Qarz
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-extrabold text-red-600 leading-tight whitespace-nowrap">
            {formatCurrency(summary.totalActiveDebt)}
          </div>
          <p className="text-[10px] text-red-500/80 font-medium truncate">
            Qarzdorlarning jami qarzi
          </p>
        </div>
      </div>

      {/* Tarix / Oxirgi faoliyatlar lentasi — Paynet uslubidagi ixcham qatorlar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-2xs border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Tarix (Oxirgi amallar)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Tranzaksiyalar</span>
        </div>

        {isLoading && activities.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">Yuklanmoqda...</div>
        ) : activities.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">Bu davrda faoliyat mavjud emas</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((act) => {
              const isPositive =
                act.type === "SALE" || act.type === "INCOME" || act.type === "DEBT_PAYMENT";
              const isNegative = act.type === "EXPENSE" || act.type === "DEBT_ADD";

              return (
                <div
                  key={act.id}
                  className="py-2.5 px-1 flex items-center justify-between gap-2 hover:bg-slate-50/60 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        act.type === "SALE"
                          ? "bg-emerald-50 text-emerald-600"
                          : act.type === "INCOME"
                          ? "bg-blue-50 text-blue-600"
                          : act.type === "EXPENSE"
                          ? "bg-red-50 text-red-600"
                          : act.type === "DEBT_ADD"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {act.type === "SALE" ? (
                        <Banknote className="w-3.5 h-3.5" />
                      ) : isPositive ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{act.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatUzbekDate(act.createdAt)}
                        {act.description && ` • ${act.description}`}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-xs sm:text-sm font-extrabold whitespace-nowrap shrink-0 text-right ${
                      isPositive ? "text-emerald-600" : isNegative ? "text-red-600" : "text-slate-800"
                    }`}
                  >
                    {isPositive ? "+" : "-"}
                    {formatCurrency(act.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NatijaPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-400">Yuklanmoqda...</div>}>
      <NatijaContent />
    </Suspense>
  );
}
