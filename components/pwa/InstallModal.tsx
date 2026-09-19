'use client';

import React from 'react';
import { X, Share, PlusSquare, Smartphone, Download, CheckCircle2 } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIos?: boolean;
}

export function InstallModal({ isOpen, onClose, isIos }: InstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200'>
      <div className='relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200'>
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer'
        >
          <X className='w-4 h-4' />
        </button>

        {/* Ilova belgisi */}
        <div className='w-16 h-16 rounded-2xl bg-emerald-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-200 mb-4'>
          <Download className='w-8 h-8' />
        </div>

        <h3 className='text-lg font-extrabold text-slate-900 mb-1'>
          SY Tizim ilovasini o‘rnatish
        </h3>
        <p className='text-xs text-slate-500 mb-5 leading-relaxed'>
          Ilovani telefoningiz bosh ekraniga o‘rnating va undan ilova sifatida tezkor foydalaning!
        </p>

        {/* Qadam-baqadam ko'rsatma */}
        <div className='space-y-3 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-5 text-xs'>
          {isIos ? (
            <>
              <div className='flex items-start gap-3'>
                <div className='w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5'>
                  1
                </div>
                <div className='text-slate-700'>
                  Safari brauzeri pastidagi <Share className='w-3.5 h-3.5 inline text-blue-600 mx-0.5' />{' '}
                  <span className='font-bold text-slate-900'>«Ulashish» (??????????)</span> tugmasini bosing.
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <div className='w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5'>
                  2
                </div>
                <div className='text-slate-700'>
                  Pastga surib, <PlusSquare className='w-3.5 h-3.5 inline text-slate-800 mx-0.5' />{' '}
                  <span className='font-bold text-slate-900'>«Bosh ekranga» (?? ????? «?????»)</span> ni tanlang.
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <div className='w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5'>
                  3
                </div>
                <div className='text-slate-700'>
                  Yuqori o‘ng burchakdagi <span className='font-bold text-emerald-700'>«Qo‘shish» (????????)</span> tugmasini bosing.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className='flex items-start gap-3'>
                <div className='w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5'>
                  1
                </div>
                <div className='text-slate-700'>
                  Brauzeringizning o‘ng yuqori qismidagi <span className='font-bold text-slate-900'>uchta nuqta (?)</span> ni bosing.
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <div className='w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5'>
                  2
                </div>
                <div className='text-slate-700'>
                  <Smartphone className='w-3.5 h-3.5 inline text-emerald-600 mx-0.5' />{' '}
                  <span className='font-bold text-slate-900'>«Ilovani o‘rnatish» (?????????? ??????????)</span> yoki <span className='font-bold text-slate-900'>«Bosh ekranga qo‘shish»</span> ni bosing.
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className='w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer'
        >
          Tushunarli
        </button>
      </div>
    </div>
  );
}
