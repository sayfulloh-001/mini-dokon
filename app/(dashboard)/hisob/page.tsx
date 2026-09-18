"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Banknote, Trash2, Edit3, RefreshCw, Check, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatUzbekDate } from "@/lib/utils/date";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface SaleItem {
  id: string;
  amount: number;
  note?: string | null;
  createdAt: string;
}

function HisobContent() {
  const searchParams = useSearchParams();
  const storeCode = searchParams.get("code") || "";

  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Edit State
  const [editingSale, setEditingSale] = useState<SaleItem | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTodaySales = useCallback(async () => {
    try {
      setIsFetching(true);
      const url = storeCode
        ? `/api/sales?period=today&limit=50&code=${storeCode}`
        : `/api/sales?period=today&limit=50`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales || []);
        setTodayTotal(data.total || 0);
        setTodayCount(data.count || 0);
      }
    } catch (err) {
      console.error("Savdolarni yuklashda xatolik:", err);
    } finally {
      setIsFetching(false);
    }
  }, [storeCode]);

  useEffect(() => {
    fetchTodaySales();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [fetchTodaySales]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleCompleteSale = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const numericAmount = parseInt(amount.replace(/\D/g, ""), 10);

    if (!numericAmount || numericAmount <= 0) {
      setNotification({ message: "Narxni kiriting", type: "error" });
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotification({ message: data.error || "Xatolik yuz berdi", type: "error" });
        return;
      }

      setAmount("");
      setNote("");
      setNotification({
        message: `${formatCurrency(numericAmount)} qo‘shildi!`,
        type: "success",
      });

      fetchTodaySales();

      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err) {
      setNotification({ message: "Internet bilan aloqa uzildi", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPreset = (value: number) => {
    const current = parseInt(amount.replace(/\D/g, ""), 10) || 0;
    setAmount((current + value).toString());
    if (inputRef.current) inputRef.current.focus();
  };

  const handleStartEdit = (sale: SaleItem) => {
    setEditingSale(sale);
    setEditAmount(sale.amount.toString());
    setEditNote(sale.note || "");
  };

  const handleSaveEdit = async () => {
    if (!editingSale) return;
    const numeric = parseInt(editAmount.replace(/\D/g, ""), 10);
    if (!numeric || numeric <= 0) {
      setNotification({ message: "Summa 0 dan katta bo‘lsin", type: "error" });
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch(`/api/sales/${editingSale.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numeric,
          note: editNote.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setNotification({ message: data.error || "Yangilashda xatolik", type: "error" });
        return;
      }

      setNotification({ message: "Savdo o‘zgartirildi", type: "success" });
      setEditingSale(null);
      fetchTodaySales();
    } catch (err) {
      setNotification({ message: "Xatolik yuz berdi", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSaleId) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/sales/${deletingSaleId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setNotification({ message: data.error || "O‘chirishda xatolik", type: "error" });
        return;
      }

      setNotification({ message: "Savdo o‘chirildi", type: "success" });
      setDeletingSaleId(null);
      fetchTodaySales();
    } catch (err) {
      setNotification({ message: "Xatolik yuz berdi", type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3 max-w-xl mx-auto">
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

      {/* Main Fast Sale Card — Ixcham */}
      <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
            NARX KIRITISH
          </span>
          <span className="text-[10px] text-slate-400">Enter bilan ham saqlanadi</span>
        </div>

        <form onSubmit={handleCompleteSale} className="space-y-3" noValidate>
          {/* Amount Input */}
          <div>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount ? parseInt(amount, 10).toLocaleString("ru-RU") : ""}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, "");
                setAmount(clean);
              }}
              className="w-full text-center text-3xl font-extrabold text-slate-900 bg-slate-50/80 py-3.5 px-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 focus:bg-white outline-none transition-all placeholder:text-slate-300"
              autoFocus
            />
            <span className="block text-center text-slate-400 text-xs font-semibold mt-1">
              Narxni kiriting (so‘m)
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[10000, 20000, 50000, 100000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleAddPreset(val)}
                className="py-1.5 px-1 text-center bg-slate-100 hover:bg-slate-200 active:bg-emerald-100 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-200/60"
              >
                +{(val / 1000).toLocaleString()} ming
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleAddPreset(5000)}
              className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200/60"
            >
              +5 000
            </button>
            <button
              type="button"
              onClick={() => setAmount("")}
              className="py-1 px-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-semibold text-xs rounded-lg transition-colors border border-slate-200/60"
            >
              Tozalash
            </button>
          </div>

          {/* QO'SHISH Button */}
          <button
            type="submit"
            disabled={isLoading || !amount}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-lg font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>QO‘SHISH</span>
            )}
          </button>
        </form>
      </div>

      {/* Today's Sales Summary Header — Ixcham */}
      <div className="bg-white rounded-2xl p-3 shadow-2xs border border-slate-200/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Bugungi tushum
          </span>
          <span className="text-xl font-extrabold text-slate-900">
            {formatCurrency(todayTotal)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Savdolar soni
          </span>
          <span className="text-lg font-bold text-emerald-600">
            {todayCount} ta
          </span>
        </div>
      </div>

      {/* Tarix (Kassadagi savdolar) — Paynet uslubidagi ixcham ro'yxat */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-2xs border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Tarix (Bugungi savdolar)</span>
          </div>
          <button
            onClick={fetchTodaySales}
            disabled={isFetching}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            title="Yangilash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isFetching && sales.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">Savdolar yuklanmoqda...</div>
        ) : sales.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">Bugun hali savdo kiritilmagan</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="py-2 px-1 flex items-center justify-between gap-2 hover:bg-slate-50/60 rounded-lg transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-slate-900 whitespace-nowrap">
                    {formatCurrency(sale.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {formatUzbekDate(sale.createdAt)}
                    {sale.note && ` • ${sale.note}`}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(sale)}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Tahrirlash"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingSaleId(sale.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Sale Modal */}
      <Modal
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
        title="Savdoni tahrirlash"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Yangi summa (so‘m)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={editAmount ? parseInt(editAmount, 10).toLocaleString("ru-RU") : ""}
              onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, ""))}
              className="w-full text-xl font-bold p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Sabab..."
              className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditingSale(null)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isUpdating}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isUpdating ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSaleId}
        onClose={() => setDeletingSaleId(null)}
        onConfirm={handleConfirmDelete}
        title="Savdoni o‘chirish"
        message="Haqiqatan ham ushbu savdoni o‘chirmoqchimisiz?"
        confirmText="O‘chirish"
        cancelText="Bekor qilish"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function HisobPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-400">Yuklanmoqda...</div>}>
      <HisobContent />
    </Suspense>
  );
}
