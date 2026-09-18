"use client";

import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ha, o‘chirish",
  cancelText = "Bekor qilish",
  isDangerous = true,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl shrink-0 ${
              isDangerous ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-base text-slate-700 leading-relaxed pt-1">{message}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-base hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-base text-white transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-100"
                : "bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-100"
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
