"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Store, LogOut, Banknote, Users, BarChart3, KeyRound, Globe, Download } from "lucide-react";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { usePwaInstall } from "../pwa/usePwaInstall";
import { InstallModal } from "../pwa/InstallModal";

interface HeaderProps {
  storeName?: string;
  storeCode?: string;
  userName?: string;
}

function HeaderContent({
  storeName = "SY Tizim",
  storeCode,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCode = storeCode || searchParams.get("code") || "";

  const { isInstalled, isMounted, promptInstall, showIosGuide, setShowIosGuide, isIos } = usePwaInstall();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const navLinks = [
    { href: "/hisob", label: "NARX", icon: Banknote },
    { href: "/qarzdorlar", label: "QARZ", icon: Users },
    { href: "/natija", label: "NATIJA", icon: BarChart3 },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        {/* 1. Tepada: Do'kon nomi, ID va Chiqish */}
        <div className="max-w-4xl mx-auto px-3.5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-2xs shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-none truncate max-w-[160px] sm:max-w-xs">
                {storeName}
              </h1>
              {currentCode && (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-emerald-100">
                  {currentCode.includes(".") ? (
                    <>
                      <Globe className="w-2.5 h-2.5 text-emerald-600" />
                      IP: {currentCode}
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-2.5 h-2.5 text-emerald-600" />
                      ID: {currentCode}
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isMounted && !isInstalled && (
              <button
                onClick={promptInstall}
                className="flex items-center gap-1 px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all font-bold text-xs cursor-pointer shadow-2xs"
                title="Ilovani o‘rnatish / yuklab olish"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Yuklab olish</span>
              </button>
            )}

            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-xs cursor-pointer"
              title="Tizimdan chiqish"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>

        {/* 2. Shuni pastida: 3 ta Menyu (NARX, QARZ, NATIJA) */}
        <div className="max-w-4xl mx-auto px-3 pb-2 pt-0.5">
          <nav className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const targetHref = currentCode ? `${link.href}?code=${currentCode}` : link.href;

              return (
                <Link
                  key={link.href}
                  href={targetHref}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Tizimdan chiqish"
        message="Haqiqatan ham chiqmoqchimisiz? Do‘koningiz 6 xonali ID kodi orqali istalgan qurilmadan yana kirishingiz mumkin."
        confirmText="Chiqish"
        cancelText="Bekor qilish"
        isLoading={isLoggingOut}
      />

      {/* PWA Install Guide Modal */}
      <InstallModal
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        isIos={isIos}
      />
    </>
  );
}

export function Header(props: HeaderProps) {
  return (
    <Suspense fallback={null}>
      <HeaderContent {...props} />
    </Suspense>
  );
}
