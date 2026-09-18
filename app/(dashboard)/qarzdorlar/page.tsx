"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  History,
  Edit3,
  Trash2,
  DollarSign,
  PlusCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { maskPhone, formatPhone } from "@/lib/utils/phone";
import { formatUzbekDate } from "@/lib/utils/date";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface DebtorItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  normalizedPhone: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface DebtTransactionItem {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  createdAt: string;
}

function QarzdorlarContent() {
  const searchParams = useSearchParams();
  const storeCode = searchParams.get("code") || "";

  const [debtors, setDebtors] = useState<DebtorItem[]>([]);
  const [totalActiveDebt, setTotalActiveDebt] = useState(0);
  const [totalActiveDebtors, setTotalActiveDebtors] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "paid" | "all">("active");
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Add Debtor Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Pay Debt Modal State
  const [payingDebtor, setPayingDebtor] = useState<DebtorItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Add More Debt Modal State
  const [addingDebtTo, setAddingDebtTo] = useState<DebtorItem | null>(null);
  const [moreDebtAmount, setMoreDebtAmount] = useState("");
  const [moreDebtNote, setMoreDebtNote] = useState("");
  const [isAddingDebt, setIsAddingDebt] = useState(false);

  // History Modal State
  const [historyDebtor, setHistoryDebtor] = useState<DebtorItem | null>(null);
  const [historyTransactions, setHistoryTransactions] = useState<DebtTransactionItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Edit Debtor State
  const [editingDebtor, setEditingDebtor] = useState<DebtorItem | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isUpdatingDebtor, setIsUpdatingDebtor] = useState(false);

  // Delete State
  const [deletingDebtorId, setDeletingDebtorId] = useState<string | null>(null);
  const [isDeletingDebtor, setIsDeletingDebtor] = useState(false);

  const fetchDebtors = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      params.set("filter", activeTab);
      if (storeCode) params.set("code", storeCode);

      const res = await fetch(`/api/debtors?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDebtors(data.debtors || []);
        setTotalActiveDebt(data.totalActiveDebt || 0);
        setTotalActiveDebtors(data.totalActiveDebtors || 0);
      }
    } catch (err) {
      console.error("Qarzdorlarni yuklashda xatolik:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, activeTab, storeCode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDebtors();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDebtors]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleCreateDebtor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFirstName.trim()) {
      setNotification({ message: "Ismni kiriting", type: "error" });
      return;
    }
    if (!newPhone.trim()) {
      setNotification({ message: "Telefon raqamini kiriting", type: "error" });
      return;
    }

    const numericDebt = newAmount ? parseInt(newAmount.replace(/\D/g, ""), 10) : 0;

    try {
      setIsSubmittingNew(true);
      const res = await fetch("/api/debtors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim() || undefined,
          phone: newPhone.trim(),
          initialDebt: numericDebt,
          description: newNote.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotification({ message: data.error || "Xatolik yuz berdi", type: "error" });
        return;
      }

      setNotification({
        message: data.message || "Qarzdor saqlandi!",
        type: "success",
      });

      setShowAddModal(false);
      setNewFirstName("");
      setNewLastName("");
      setNewPhone("");
      setNewAmount("");
      setNewNote("");
      fetchDebtors();
    } catch (err) {
      setNotification({ message: "Internet bilan aloqa uzildi", type: "error" });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebtor) return;

    const numericPay = parseInt(payAmount.replace(/\D/g, ""), 10);
    if (!numericPay || numericPay <= 0) {
      setNotification({ message: "To‘lov summasini kiriting", type: "error" });
      return;
    }

    try {
      setIsPaying(true);
      const res = await fetch(`/api/debtors/${payingDebtor.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericPay,
          description: payNote.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotification({ message: data.error || "Xatolik yuz berdi", type: "error" });
        return;
      }

      setNotification({
        message: data.message || "To‘lov qabul qilindi!",
        type: "success",
      });

      setPayingDebtor(null);
      setPayAmount("");
      setPayNote("");
      fetchDebtors();
    } catch (err) {
      setNotification({ message: "Xatolik yuz berdi", type: "error" });
    } finally {
      setIsPaying(false);
    }
  };

  const handleAddMoreDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingDebtTo) return;

    const numericAmount = parseInt(moreDebtAmount.replace(/\D/g, ""), 10);
    if (!numericAmount || numericAmount <= 0) {
      setNotification({ message: "Qarz summasini kiriting", type: "error" });
      return;
    }

    try {
      setIsAddingDebt(true);
      const res = await fetch(`/api/debtors/${addingDebtTo.id}/debt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          description: moreDebtNote.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotification({ message: data.error || "Xatolik yuz berdi", type: "error" });
        return;
      }

      setNotification({ message: data.message || "Qarz qo‘shildi!", type: "success" });
      setAddingDebtTo(null);
      setMoreDebtAmount("");
      setMoreDebtNote("");
      fetchDebtors();
    } catch (err) {
      setNotification({ message: "Xatolik yuz berdi", type: "error" });
    } finally {
      setIsAddingDebt(false);
    }
  };

  const handleOpenHistory = async (debtor: DebtorItem) => {
    setHistoryDebtor(debtor);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/debtors/${debtor.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryTransactions(data.debtor.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSaveEditDebtor = async () => {
    if (!editingDebtor) return;
    if (!editFirstName.trim() || !editPhone.trim()) {
      setNotification({ message: "Ism va telefon kiritilishi shart", type: "error" });
      return;
    }

    try {
      setIsUpdatingDebtor(true);
      const res = await fetch(`/api/debtors/${editingDebtor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim() || undefined,
          phone: editPhone.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setNotification({ message: data.error || "Xatolik yuz berdi", type: "error" });
        return;
      }

      setNotification({ message: "Qarzdor ma'lumotlari yangilandi", type: "success" });
      setEditingDebtor(null);
      fetchDebtors();
    } catch (err) {
      setNotification({ message: "Xatolik yuz berdi", type: "error" });
    } finally {
      setIsUpdatingDebtor(false);
    }
  };

  const handleConfirmDeleteDebtor = async () => {
    if (!deletingDebtorId) return;

    try {
      setIsDeletingDebtor(true);
      const res = await fetch(`/api/debtors/${deletingDebtorId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setNotification({ message: data.error || "Xatolik yuz berdi", type: "error" });
        return;
      }

      setNotification({ message: "Qarzdor o‘chirildi", type: "success" });
      setDeletingDebtorId(null);
      fetchDebtors();
    } catch (err) {
      setNotification({ message: "Xatolik yuz berdi", type: "error" });
    } finally {
      setIsDeletingDebtor(false);
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

      {/* Top Banner Stats — Ixcham 2 ustun */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-2xl p-3 shadow-2xs border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Jami qarz
          </span>
          <span className="text-xl font-extrabold text-red-600 mt-0.5 block">
            {formatCurrency(totalActiveDebt)}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-2xs border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Qarzdorlar
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
            {totalActiveDebtors} ta
          </span>
        </div>
      </div>

      {/* Search and Add Action Bar — Ixcham */}
      <div className="bg-white rounded-2xl p-3 shadow-2xs border border-slate-200/80 space-y-2">
        <div className="flex gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Ism yoki oxirgi 4 raqam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-slate-900 text-xs font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Add Debtor Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Qo‘shish</span>
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1 pt-0.5 border-t border-slate-100">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-lg transition-colors ${
              activeTab === "active"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Faol ({totalActiveDebtors})
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-lg transition-colors ${
              activeTab === "paid"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            To‘langan
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-lg transition-colors ${
              activeTab === "all"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Barchasi
          </button>
        </div>
      </div>

      {/* Debtors List — Paynet uslubidagi chiroyli kichik kartochkalar */}
      <div className="space-y-2">
        {isLoading && debtors.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">Yuklanmoqda...</div>
        ) : debtors.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 shadow-2xs space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Qarzdorlar yo‘q</p>
          </div>
        ) : (
          debtors.map((debtor) => {
            const isPaid = debtor.balance === 0;

            return (
              <div
                key={debtor.id}
                className="bg-white rounded-2xl p-3.5 shadow-2xs border border-slate-200/80 space-y-2.5 hover:border-slate-300 transition-colors"
              >
                {/* Paynet Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {debtor.firstName} {debtor.lastName}
                    </h3>
                    <p className="text-slate-400 text-xs font-medium flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {maskPhone(debtor.phone)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isPaid ? "Holati" : "Qarz"}
                    </span>
                    {isPaid ? (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs whitespace-nowrap">
                        To‘langan
                      </span>
                    ) : (
                      <span className="text-base sm:text-lg font-extrabold text-red-600 block whitespace-nowrap">
                        {formatCurrency(debtor.balance)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Compact Action Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-1.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setPayingDebtor(debtor);
                      setPayAmount(debtor.balance > 0 ? debtor.balance.toString() : "");
                    }}
                    disabled={isPaid}
                    className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>To‘lash</span>
                  </button>

                  <button
                    onClick={() => {
                      setAddingDebtTo(debtor);
                      setMoreDebtAmount("");
                    }}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Qarz</span>
                  </button>

                  <button
                    onClick={() => handleOpenHistory(debtor)}
                    className="py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center justify-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Tarix</span>
                  </button>

                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => {
                        setEditingDebtor(debtor);
                        setEditFirstName(debtor.firstName);
                        setEditLastName(debtor.lastName || "");
                        setEditPhone(debtor.phone);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-emerald-700"
                      title="Tahrirlash"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingDebtorId(debtor.id)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Debtor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="+ Qarzdor qo‘shish"
      >
        <form onSubmit={handleCreateDebtor} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ism *</label>
            <input
              type="text"
              required
              placeholder="Sayfulloh"
              value={newFirstName}
              onChange={(e) => setNewFirstName(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Familiya</label>
            <input
              type="text"
              placeholder="Aliyev"
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Telefon *</label>
            <input
              type="tel"
              required
              placeholder="+998 90 123 45 67"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-sm font-medium"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Mavjud qarzdor bo‘lsa, qarz summasi bitta qilib qo‘shiladi.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Qarz summasi (so‘m)</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={newAmount ? parseInt(newAmount, 10).toLocaleString("ru-RU") : ""}
              onChange={(e) => setNewAmount(e.target.value.replace(/\D/g, ""))}
              className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-lg font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmittingNew}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
            >
              {isSubmittingNew ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Pay Debt Modal */}
      <Modal
        isOpen={!!payingDebtor}
        onClose={() => setPayingDebtor(null)}
        title="Qarz to‘lash"
      >
        {payingDebtor && (
          <form onSubmit={handlePayDebt} className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {payingDebtor.firstName} {payingDebtor.lastName}
              </span>
              <span className="text-sm font-extrabold text-red-600">
                {formatCurrency(payingDebtor.balance)}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">To‘lov summasi</label>
                <button
                  type="button"
                  onClick={() => setPayAmount(payingDebtor.balance.toString())}
                  className="text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  To‘liq to‘lash
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                required
                value={payAmount ? parseInt(payAmount, 10).toLocaleString("ru-RU") : ""}
                onChange={(e) => setPayAmount(e.target.value.replace(/\D/g, ""))}
                className="w-full text-xl font-bold p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPayingDebtor(null)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isPaying}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
              >
                {isPaying ? "Qabul qilinmoqda..." : "To‘lovni qabul qilish"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add More Debt Modal */}
      <Modal
        isOpen={!!addingDebtTo}
        onClose={() => setAddingDebtTo(null)}
        title="Qarz qo‘shish"
      >
        {addingDebtTo && (
          <form onSubmit={handleAddMoreDebt} className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {addingDebtTo.firstName} {addingDebtTo.lastName}
              </span>
              <span className="text-sm font-bold text-slate-900">
                Qarz: {formatCurrency(addingDebtTo.balance)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Yangi qarz summasi
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={moreDebtAmount ? parseInt(moreDebtAmount, 10).toLocaleString("ru-RU") : ""}
                onChange={(e) => setMoreDebtAmount(e.target.value.replace(/\D/g, ""))}
                className="w-full text-xl font-bold p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAddingDebtTo(null)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isAddingDebt}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
              >
                {isAddingDebt ? "Qo‘shilmoqda..." : "Qarzni qo‘shish"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={!!historyDebtor}
        onClose={() => setHistoryDebtor(null)}
        title="Qarz tarixi"
      >
        {historyDebtor && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">{historyDebtor.firstName} {historyDebtor.lastName}</span>
              <span className="font-extrabold text-slate-900">Qoldiq: {formatCurrency(historyDebtor.balance)}</span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
              {isLoadingHistory ? (
                <div className="py-6 text-center text-slate-400 text-xs">Yuklanmoqda...</div>
              ) : historyTransactions.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">Tarix yo‘q</div>
              ) : (
                historyTransactions.map((tx) => {
                  const isAdd = tx.type === "DEBT_ADD";
                  return (
                    <div key={tx.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{isAdd ? "Qarz berildi" : "Qarz to‘landi"}</span>
                        <div className="text-[10px] text-slate-400">{formatUzbekDate(tx.createdAt)}</div>
                      </div>
                      <span className={`font-extrabold ${isAdd ? "text-red-600" : "text-emerald-600"}`}>
                        {isAdd ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Debtor Modal */}
      <Modal
        isOpen={!!editingDebtor}
        onClose={() => setEditingDebtor(null)}
        title="Qarzdorni tahrirlash"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ism</label>
            <input
              type="text"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Familiya</label>
            <input
              type="text"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditingDebtor(null)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSaveEditDebtor}
              disabled={isUpdatingDebtor}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
            >
              {isUpdatingDebtor ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingDebtorId}
        onClose={() => setDeletingDebtorId(null)}
        onConfirm={handleConfirmDeleteDebtor}
        title="Qarzdorni o‘chirish"
        message="Haqiqatan ham ushbu qarzdorni o‘chirmoqchimisiz?"
        confirmText="O‘chirish"
        cancelText="Bekor qilish"
        isDangerous={true}
        isLoading={isDeletingDebtor}
      />
    </div>
  );
}

export default function QarzdorlarPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-400">Yuklanmoqda...</div>}>
      <QarzdorlarContent />
    </Suspense>
  );
}
