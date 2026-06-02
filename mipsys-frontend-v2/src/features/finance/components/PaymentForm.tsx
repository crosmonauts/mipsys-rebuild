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
        <label className="text-xs font-bold block mb-1 text-[var(--foreground)]/80">Metode Pembayaran</label>
        <select value={method} onChange={(e) => setMethod(e.target.value as any)}
          className="w-full p-2.5 border border-border rounded-xl text-sm font-bold focus:border-primary focus:ring-2 focus:ring-ring outline-none bg-background text-[var(--foreground)]">
          <option value="CASH">Cash</option>
          <option value="TRANSFER">Transfer</option>
          <option value="QRIS">QRIS</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-bold block mb-1 text-[var(--foreground)]/80">Jumlah</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2.5 border border-border rounded-xl text-sm font-bold focus:border-primary focus:ring-2 focus:ring-ring outline-none bg-background text-[var(--foreground)]" required />
      </div>
      <div>
        <label className="text-xs font-bold block mb-1 text-[var(--foreground)]/80">No. Referensi <span className="text-[var(--muted-foreground)]/70">(opsional)</span></label>
        <input type="text" value={ref} onChange={(e) => setRef(e.target.value)}
          className="w-full p-2.5 border border-border rounded-xl text-sm font-bold focus:border-primary focus:ring-2 focus:ring-ring outline-none bg-background text-[var(--foreground)]" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-xl py-2.5 text-sm font-bold hover:bg-[var(--accent)]/90 disabled:opacity-50 transition-all motion-safe:active:scale-95">
          {submitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-[var(--muted)]/50 transition-all motion-safe:active:scale-95 text-[var(--foreground)]/80">
          Batal
        </button>
      </div>
    </form>
  );
}
