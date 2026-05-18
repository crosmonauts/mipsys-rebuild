'use client';
import React, { useState } from 'react';
import { financeApi } from '../api/finance-api';
import { toast } from 'react-hot-toast';

interface Props {
  invoiceId: number;
  invoiceTotal: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({ invoiceId, invoiceTotal, onSuccess, onCancel }: Props) {
  const [method, setMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS'>('CASH');
  const [amount, setAmount] = useState(String(invoiceTotal));
  const [ref, setRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await financeApi.recordPayment(invoiceId, {
        amount: parseFloat(amount),
        paymentMethod: method,
        referenceNumber: ref || undefined,
      });
      toast.success('Pembayaran berhasil dicatat');
      onSuccess();
    } catch (err) {
      toast.error('Gagal mencatat pembayaran');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-bold block mb-1">Metode Pembayaran</label>
        <select value={method} onChange={(e) => setMethod(e.target.value as any)}
          className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none">
          <option value="CASH">Cash</option>
          <option value="TRANSFER">Transfer</option>
          <option value="QRIS">QRIS</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-bold block mb-1">Jumlah</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none" required />
      </div>
      <div>
        <label className="text-xs font-bold block mb-1">No. Referensi <span className="text-slate-400">(opsional)</span></label>
        <input type="text" value={ref} onChange={(e) => setRef(e.target.value)}
          className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all">
          {submitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
          Batal
        </button>
      </div>
    </form>
  );
}
