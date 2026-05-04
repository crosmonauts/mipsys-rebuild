'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PackagePlus, X, RefreshCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/src/components/ui/dialog';
import { addStockSchema, AddStockFormValues } from '../schemas/part-schema';
import { SparePart } from '../types';

interface AddStockModalProps {
  part: SparePart | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onAddStockSubmit: (id: number, qty: number) => Promise<void>;
}

export function AddStockModal({
  part,
  isOpen,
  onClose,
  onSuccess,
  onAddStockSubmit,
}: AddStockModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddStockFormValues>({
    resolver: zodResolver(addStockSchema) as any, // <-- Ditambahkan 'as any' untuk melewati type mismatch
    defaultValues: { quantity: 1 },
  });

  React.useEffect(() => {
    if (isOpen) reset({ quantity: 1 });
  }, [isOpen, reset]);

  const onSubmit = async (values: AddStockFormValues) => {
    if (!part) return;
    try {
      await onAddStockSubmit(part.id, values.quantity);
      onSuccess();
      onClose();
    } catch (error) {
      alert('Terjadi kesalahan saat menambahkan stok.');
    }
  };

  if (!part) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-2xl outline-none">
        <DialogDescription className="sr-only">
          Formulir penambahan stok unit suku cadang inventory.
        </DialogDescription>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col h-full text-left"
        >
          {/* Header */}
          <div className="p-6 bg-slate-950 text-white flex justify-between items-center border-b-2 border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <PackagePlus size={20} className="text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-black uppercase tracking-tight">
                  Restock Item
                </DialogTitle>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                  Update Stok Master Suku Cadang
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Tutup Dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-4 bg-white">
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Nama Barang
              </p>
              <p className="text-sm font-black text-slate-950 tracking-tight">
                {part.partName}
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Stok Saat Ini
                </span>
                <span className="text-xs font-black text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                  {part.stock} Unit
                </span>
              </div>
            </div>

            {/* Input Quantity */}
            <div className="space-y-2">
              <label
                htmlFor="quantity"
                className="text-xs font-black uppercase text-slate-900 tracking-wider"
              >
                Jumlah Tambahan Unit <span className="text-red-700">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                {...register('quantity')}
                className="w-full h-12 px-4 py-2 border-2 border-slate-300 rounded-xl text-base font-black text-slate-950 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                placeholder="Contoh: 15"
                min={1}
              />
              {errors.quantity && (
                <p
                  className="text-xs font-black text-red-900 mt-1 bg-red-50 border border-red-300 p-1.5 rounded"
                  role="alert"
                >
                  {errors.quantity.message}
                </p>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 bg-slate-50 border-t-2 border-slate-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-800 font-black text-xs uppercase rounded-xl border-2 border-slate-300 outline-none focus-visible:ring-4 focus-visible:ring-slate-300 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-slate-950 hover:bg-blue-800 text-white font-black text-xs uppercase rounded-xl border-2 border-slate-950 outline-none focus-visible:ring-4 focus-visible:ring-blue-600 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <RefreshCcw className="animate-spin" size={16} />
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
