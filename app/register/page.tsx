"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, User, Lock, Phone, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!storeName.trim()) {
      setError("Do‘kon nomini kiriting");
      return;
    }
    if (!firstName.trim()) {
      setError("Ismingizni kiriting");
      return;
    }
    if (!lastName.trim()) {
      setError("Familiyangizni kiriting");
      return;
    }
    if (!phone.trim()) {
      setError("Telefon raqamingizni kiriting");
      return;
    }
    if (pin.length < 4) {
      setError("PIN yoki parol kamida 4 ta belgidan iborat bo‘lishi kerak");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          firstName,
          lastName,
          phone,
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ro‘yxatdan o‘tishda xatolik yuz berdi");
        return;
      }

      // Muvaffaqiyatli ro'yxatdan o'tish -> Dashboard ochiladi
      router.push("/hisob");
      router.refresh();
    } catch (err) {
      setError("Internet bilan aloqa uzildi. Qayta urinib ko‘ring.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        {/* Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            DO‘KON OCHISH
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">
            Yangi do‘kon hisobini 1 daqiqada yarating
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <p className="text-sm font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Do‘kon nomi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Store className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Masalan: Sayfulloh Savdo"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 text-slate-900 text-base font-medium outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Ism
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Sayfulloh"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 text-slate-900 text-base font-medium outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Familiya
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Aliyev"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 text-slate-900 text-base font-medium outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Telefon raqami
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                inputMode="tel"
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 text-slate-900 text-base font-medium outline-none transition-all"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 pl-1">
              Bu raqam orqali yangi telefon yoki kompyuterda tizimga kirasiz
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Maxfiy PIN yoki parol
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                placeholder="Kamida 4 ta belgi"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 text-slate-900 text-base font-medium outline-none transition-all tracking-wider"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-lg font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>RO‘YXATDAN O‘TISH</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-600 text-sm">
            Oldin ro‘yxatdan o‘tganmisiz?{" "}
            <Link
              href="/login"
              className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              Tizimga kirish
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
