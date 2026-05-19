'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, RefreshCcw, Plus, Minus } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from '@/src/components/ui/dialog';
import { stockActionSchema, StockActionValues } from '../schemas/part-schema';
import { SparePart } from '../types';
import { cn } from '@/src/lib/utils';
import { toast } from 'react-hot-toast';

interface AddStockModalProps {
  part: SparePart | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onStockAction: (id: number, qty: number, type: 'ADD' | 'SUBTRACT') => Promise<void>;
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
    defaultValues: { type: 'ADD' as const, quantity: 1 },
  });

  const currentType = watch('type');

  React.useEffect(() => {
    if (isOpen) reset({ type: 'ADD' as const, quantity: 1 });
  }, [isOpen, reset]);

  const onSubmit = async (values: StockActionValues) => {
    if (!part) return;

    if (values.type === 'SUBTRACT' && values.quantity > part.stock) {
      toast.error('Jumlah pengurangan melebihi stok yang tersedia!');
      return;
    }

    try {
      await onStockAction(part.id, values.quantity, values.type);
      toast.success(values.type === 'ADD' ? 'Stok berhasil ditambahkan' : 'Stok berhasil dikurangi');
      onSuccess();
      onClose();
    } catch {
      toast.error('Gagal memperbarui stok. Silakan coba lagi.');
    }
  };

  if (!part) return null;

  const theme = {
    ADD: { bg: 'bg-primary', text: 'text-primary', border: 'border-primary/30' },
    SUBTRACT: { bg: 'bg-destructive', text: 'text-destructive', border: 'border-destructive/30' },
  }[currentType];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card shadow-lg duration-200 sm:max-w-md p-0 overflow-hidden rounded-[2rem] border-border/20 outline-none',
            'animate-in fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-to-left-1/2 data-[state=open]:slide-in-to-top-1/2 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2',
          )}
        >
          <DialogDescription className="sr-only">
            Manajemen penyesuaian stok unit suku cadang
          </DialogDescription>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full text-left">
            {/* HEADER */}
            <div className={`p-8 text-white transition-colors duration-300 ${theme.bg}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    {currentType === 'ADD' && <Plus size={24} />}
                    {currentType === 'SUBTRACT' && <Minus size={24} />}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">
                      {currentType === 'ADD' && 'Tambah Stok'}
                      {currentType === 'SUBTRACT' && 'Kurangi Stok'}
                    </DialogTitle>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest">
                      {part.partCode}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all outline-none">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* TYPE SELECTOR */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-2xl">
                {(['ADD', 'SUBTRACT'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue('type', t)}
                    className={cn(
                      'py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all',
                      currentType === t
                        ? 'bg-card shadow-sm text-foreground scale-100'
                        : 'text-muted-foreground hover:text-foreground scale-95',
                    )}
                  >
                    {t === 'ADD' ? 'Tambah' : 'Kurangi'}
                  </button>
                ))}
              </div>

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
                <label className="text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">
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
          </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
