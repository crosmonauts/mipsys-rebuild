'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
<<<<<<< HEAD
import {
  X,
  RefreshCcw,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

// Primitif Radix UI untuk kontrol penuh atas elemen Content (menghapus tombol close default)
import * as DialogPrimitive from '@radix-ui/react-dialog';

// Komponen dasar Shadcn
=======
import { X, RefreshCcw, Plus, Minus } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
>>>>>>> main
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from '@/src/components/ui/dialog';
<<<<<<< HEAD

import { stockActionSchema, StockActionValues } from '../schemas/part-schema';
import { SparePart } from '../types';
import { cn } from '@/src/lib/utils';
=======
import { stockActionSchema, StockActionValues } from '../schemas/part-schema';
import { SparePart } from '../types';
import { cn } from '@/src/lib/utils';
import { toast } from 'react-hot-toast';
>>>>>>> main

interface AddStockModalProps {
  part: SparePart | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
<<<<<<< HEAD
  onStockAction: (
    id: number,
    qty: number,
    type: 'ADD' | 'SUBTRACT' | 'RESET',
  ) => Promise<void>;
=======
  onStockAction: (id: number, qty: number, type: 'ADD' | 'SUBTRACT' | 'RESET') => Promise<void>;
>>>>>>> main
}

export function AddStockModal({
  part,
  isOpen,
  onClose,
  onSuccess,
  onStockAction,
}: AddStockModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StockActionValues>({
    resolver: zodResolver(stockActionSchema) as any,
<<<<<<< HEAD
    defaultValues: { type: 'ADD', quantity: 1 },
=======
    defaultValues: { type: 'ADD' as const, quantity: 1 },
>>>>>>> main
  });

  const currentType = watch('type');

<<<<<<< HEAD
  // Reset form setiap kali modal dibuka
  React.useEffect(() => {
    if (isOpen) reset({ type: 'ADD', quantity: 1 });
=======
  React.useEffect(() => {
    if (isOpen) reset({ type: 'ADD' as const, quantity: 1 });
>>>>>>> main
  }, [isOpen, reset]);

  const onSubmit = async (values: StockActionValues) => {
    if (!part) return;

<<<<<<< HEAD
    // Proteksi: Pengurangan tidak boleh melebihi stok tersedia
    if (values.type === 'SUBTRACT' && values.quantity > part.stock) {
      alert('Jumlah pengurangan melebihi stok yang tersedia!');
=======
    if (values.type === 'SUBTRACT' && values.quantity > part.stock) {
      toast.error('Jumlah pengurangan melebihi stok yang tersedia!');
>>>>>>> main
      return;
    }

    try {
      await onStockAction(part.id, values.quantity, values.type);
<<<<<<< HEAD
      onSuccess();
      onClose();
    } catch (error) {
      alert('Gagal memperbarui stok. Silakan coba lagi.');
=======
      toast.success(values.type === 'ADD' ? 'Stok berhasil ditambahkan' : values.type === 'RESET' ? 'Stok berhasil direset' : 'Stok berhasil dikurangi');
      onSuccess();
      onClose();
    } catch {
      toast.error('Gagal memperbarui stok. Silakan coba lagi.');
>>>>>>> main
    }
  };

  if (!part) return null;

<<<<<<< HEAD
  // Pemetaan tema dinamis berdasarkan tipe aksi
  const theme = {
    ADD: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
    },
    SUBTRACT: {
      bg: 'bg-amber-600',
      text: 'text-amber-600',
      border: 'border-amber-200',
    },
    RESET: {
      bg: 'bg-red-600',
      text: 'text-red-600',
      border: 'border-red-200',
    },
  }[currentType];
=======
  const theme = {
    ADD: { bg: 'bg-primary', fg: 'text-primary-foreground', border: 'border-primary/30' },
    SUBTRACT: { bg: 'bg-destructive', fg: 'text-destructive-foreground', border: 'border-destructive/30' },
    RESET: { bg: 'bg-amber-500', fg: 'text-primary-foreground', border: 'border-amber-500/30' },
  }[currentType] ?? { bg: 'bg-primary', fg: 'text-primary-foreground', border: 'border-primary/30' };
>>>>>>> main

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
<<<<<<< HEAD
        <DialogOverlay />
        {/* Menggunakan DialogPrimitive.Content agar tombol 'X' bawaan Shadcn tidak muncul */}
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white shadow-lg duration-200 sm:max-w-md p-0 overflow-hidden rounded-[2rem] border-none outline-none',
            'animate-in fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-to-left-1/2 data-[state=open]:slide-in-to-top-1/2 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2',
=======
        <DialogOverlay className="backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card shadow-lg duration-200 sm:max-w-md p-0 overflow-hidden rounded-[2rem] border-border/20 outline-none',
            'motion-safe:animate-in motion-safe:fade-in data-[state=closed]:motion-safe:animate-out data-[state=closed]:motion-safe:fade-out-0 data-[state=open]:motion-safe:zoom-in-95 data-[state=closed]:motion-safe:zoom-out-95 data-[state=open]:motion-safe:slide-in-from-left-1/2 data-[state=open]:motion-safe:slide-in-from-top-1/2 data-[state=closed]:motion-safe:slide-out-to-left-1/2 data-[state=closed]:motion-safe:slide-out-to-top-1/2',
>>>>>>> main
          )}
        >
          <DialogDescription className="sr-only">
            Manajemen penyesuaian stok unit suku cadang
          </DialogDescription>

<<<<<<< HEAD
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col h-full text-left"
          >
            {/* 1. HEADER DINAMIS (Bebas Tombol Close Double) */}
            <div
              className={`p-8 text-white transition-colors duration-300 ${theme.bg}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    {currentType === 'ADD' && <Plus size={24} />}
                    {currentType === 'SUBTRACT' && <Minus size={24} />}
                    {currentType === 'RESET' && <Trash2 size={24} />}
=======
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full text-left">
            {/* HEADER */}
            <div className={`p-8 ${theme.fg} transition-colors duration-300 ${theme.bg}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl backdrop-blur-md bg-black/10" aria-hidden="true">
                    {currentType === 'ADD' && <Plus size={24} />}
                    {currentType === 'SUBTRACT' && <Minus size={24} />}
                    {currentType === 'RESET' && <RefreshCcw size={24} />}
>>>>>>> main
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">
                      {currentType === 'ADD' && 'Tambah Stok'}
                      {currentType === 'SUBTRACT' && 'Kurangi Stok'}
<<<<<<< HEAD
                      {currentType === 'RESET' && 'Reset/Hapus Stok'}
=======
>>>>>>> main
                    </DialogTitle>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest">
                      {part.partCode}
                    </p>
                  </div>
                </div>
<<<<<<< HEAD
                {/* Tombol Close Kustom */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all outline-none"
                >
                  <X size={20} />
=======
                <button type="button" onClick={onClose} className="p-2 hover:bg-black/10 rounded-xl transition-all outline-none" aria-label="Tutup dialog">
                  <X size={20} aria-hidden="true" />
>>>>>>> main
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
<<<<<<< HEAD
              {/* 2. SELECTOR AKSI */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                {(['ADD', 'SUBTRACT', 'RESET'] as const).map((t) => (
=======
              {/* TYPE SELECTOR */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-2xl">
                {(['ADD', 'SUBTRACT'] as const).map((t) => (
>>>>>>> main
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue('type', t)}
                    className={cn(
                      'py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all',
                      currentType === t
<<<<<<< HEAD
                        ? 'bg-white shadow-sm text-slate-900 scale-100'
                        : 'text-slate-400 hover:text-slate-600 scale-95',
                    )}
                  >
                    {t === 'ADD'
                      ? 'Tambah'
                      : t === 'SUBTRACT'
                        ? 'Kurangi'
                        : 'Reset'}
=======
                        ? 'bg-card shadow-sm text-foreground scale-100'
                        : 'text-muted-foreground hover:text-foreground scale-95',
                    )}
                  >
                    {t === 'ADD' ? 'Tambah' : 'Kurangi'}
>>>>>>> main
                  </button>
                ))}
              </div>

<<<<<<< HEAD
              {/* 3. INFORMASI ITEM */}
              <div
                className={cn(
                  'p-5 border-2 rounded-2xl space-y-1 transition-colors bg-slate-50/50',
                  theme.border,
                )}
              >
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Informasi Item
                </p>
                <p className="text-sm font-black text-slate-900">
                  {part.partName}
                </p>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase">
                    Stok Saat Ini
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    {part.stock} Unit
                  </span>
                </div>
              </div>

              {/* 4. AREA INPUT / PERINGATAN */}
              {currentType !== 'RESET' ? (
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-1">
                    Jumlah yang di{' '}
                    {currentType === 'ADD' ? 'tambahkan' : 'kurangi'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      {...register('quantity')}
                      className="w-full h-14 pl-5 pr-14 border-2 border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:border-slate-900 focus:ring-0 transition-all outline-none"
                      placeholder="0"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xs uppercase">
                      Unit
                    </div>
                  </div>
                  {errors.quantity && (
                    <p className="text-[10px] font-bold text-red-600 ml-1">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="text-red-600 shrink-0" size={18} />
                  <p className="text-[11px] font-bold text-red-900 leading-relaxed">
                    Perhatian: Aksi ini akan mengatur stok menjadi{' '}
                    <span className="underline font-black">NOL (0)</span>.
                    Gunakan hanya jika barang dinyatakan rusak total,
                    kadaluarsa, atau hilang.
                  </p>
                </div>
              )}
            </div>

            {/* 5. FOOTER PEMBAYARAN / AKSI */}
            <div className="p-8 bg-slate-50 border-t flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-14 bg-white hover:bg-slate-100 text-slate-400 font-black text-xs uppercase rounded-2xl border-2 border-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'flex-1 h-14 text-white font-black text-xs uppercase rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2',
                  theme.bg,
                )}
              >
                {isSubmitting ? (
                  <RefreshCcw className="animate-spin" size={18} />
                ) : (
                  <>
                    <RefreshCcw size={18} />
                    Konfirmasi
                  </>
                )}
              </button>
            </div>
=======
              {/* ITEM INFO */}
              <div className={cn('p-5 border-2 rounded-2xl space-y-1 transition-colors bg-muted/30', theme.border)}>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  Informasi Item
                </p>
                <p className="text-sm font-black text-foreground">{part.partName}</p>
                <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase">Stok Saat Ini</span>
                  <span className="text-xs font-black text-foreground">{part.stock} Unit</span>
                </div>
              </div>

              {/* INPUT */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">
                  Jumlah yang di {currentType === 'ADD' ? 'tambahkan' : 'kurangi'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    {...register('quantity')}
                    className="w-full h-14 pl-5 pr-14 border-2 border-border rounded-2xl text-lg font-black text-foreground bg-input focus:border-ring focus:ring-[3px] focus:ring-ring/50 outline-none transition-all"
                    placeholder="0"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-xs uppercase">Unit</div>
                </div>
                {errors.quantity && (
                  <p className="text-[10px] font-bold text-destructive ml-1">{errors.quantity.message}</p>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-8 bg-muted/30 border-t border-border flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-14 bg-card hover:bg-muted text-muted-foreground font-black text-xs uppercase rounded-2xl border border-border transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'flex-1 h-14 font-black text-xs uppercase rounded-2xl shadow-xl transition-all hover:shadow-2xl active:opacity-80 flex items-center justify-center gap-2',
                  theme.bg,
                  theme.fg,
                )}
              >
                {isSubmitting ? (
                  <RefreshCcw className="motion-safe:animate-spin" size={18} aria-hidden="true" />
                ) : (
                  <>
                    <RefreshCcw size={18} aria-hidden="true" />
                    Konfirmasi
                  </>
                )}
              </button>
            </div>
>>>>>>> main
          </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
