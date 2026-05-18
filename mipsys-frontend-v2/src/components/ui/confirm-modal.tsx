'use client';

import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title = 'Konfirmasi Hapus',
  message,
  confirmLabel = 'Hapus',
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="text-sm text-slate-500 font-bold">{message}</p>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-2 font-black text-xs uppercase tracking-widest"
            >
              Batal
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest border-none disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}{' '}
              {confirmLabel}
            </Button>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-all"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
