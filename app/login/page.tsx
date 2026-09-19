"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, ArrowRight, AlertCircle, Globe, KeyRound, Download } from "lucide-react";
import { usePwaInstall } from "@/components/pwa/usePwaInstall";
import { InstallModal } from "@/components/pwa/InstallModal";

export default function LoginPage() {
  const router = useRouter();
  const { isInstalled, isMounted, promptInstall, showIosGuide, setShowIosGuide, isIos } = usePwaInstall();
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const clean = inputVal.trim();
    if (!clean) {
      setError("1-bo‘lib do‘kon IP manzilini kiriting");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean, ip: clean }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "IP yoki kod noto‘g‘ri kiritildi");
        return;
      }

      if (data.redirectUrl) {
        router.push(data.redirectUrl);
        router.refresh();
      } else {
        router.push(`/hisob?code=${clean}`);
        router.refresh();
      }
    } catch (err) {
      setError("Internet bilan aloqa uzildi. Qayta urinib ko‘ring.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/50 border border-slate-100">
        {/* Logo & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200 mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            SY Tizim
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
            1-bo‘lib do‘kon IP manzilini kiriting
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-700 flex items-start gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1 Input va 1 Button */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Do‘kon IP manzili
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-5 h-5 text-emerald-600" />
              </div>
              <input
                type="text"
                placeholder="IP manzil: masalan 127.0.0.1"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 text-slate-900 text-lg font-bold text-center transition-all outline-none"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-base font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>KIRISH</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Agar o'rnatilmagan bo'lsa: Ilovani yuklab olish tugmasi */}
        {isMounted && !isInstalled && (
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={promptInstall}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 text-emerald-800 text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ilovani yuklab olish (Telefonga o‘rnatish)</span>
            </button>
          </div>
        )}
      </div>

      {/* PWA Install Guide Modal */}
      <InstallModal
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        isIos={isIos}
      />
    </main>
  );
}
