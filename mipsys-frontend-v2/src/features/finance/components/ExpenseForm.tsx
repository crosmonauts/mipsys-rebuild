'use client';
import React, { useState } from 'react';
import { financeApi } from '../api/finance-api';
import { toast } from 'react-hot-toast';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  initial?: { description: string; amount: number; expenseDate: string; category: string };
  editId?: number;
}

export function ExpenseForm({ onSuccess, onCancel, initial, editId }: Props) {
  const [description, setDescription] = useState(initial?.description || '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [expenseDate, setExpenseDate] = useState(initial?.expenseDate || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(initial?.category || 'OTHER');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await financeApi.updateExpense(editId, { description, amount: parseFloat(amount), expenseDate, category });
        toast.success('Expense berhasil diupdate');
      } else {
        await financeApi.createExpense({ description, amount: parseFloat(amount), expenseDate, category });
        toast.success('Expense berhasil ditambahkan');
      }
      onSuccess();
    } catch {
      toast.error('Gagal menyimpan expense');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-bold block mb-1 text-foreground/80">Deskripsi</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2.5 border border-border rounded-xl text-sm font-bold focus:border-primary focus:ring-2 focus:ring-ring outline-none bg-background text-foreground" required />
      </div>
      <div>
        <label className="text-xs font-bold block mb-1 text-foreground/80">Jumlah</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2.5 border border-border rounded-xl text-sm font-bold focus:border-primary focus:ring-2 focus:ring-ring outline-none bg-background text-foreground" required />
      </div>
      <div>
        <label className="text-xs font-bold block mb-1 text-foreground/80">Tanggal</label>
        <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)}
          className="w-full p-2.5 border border-border rounded-xl text-sm font-bold focus:border-primary focus:ring-2 focus:ring-ring outline-none bg-background text-foreground" required />
      </div>
      <div>
        <label className="text-xs font-bold block mb-1 text-foreground/80">Kategori</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2.5 border border-border rounded-xl text-sm font-bold focus:border-primary focus:ring-2 focus:ring-ring outline-none bg-background text-foreground">
          <option value="UTILITY">Utility</option>
          <option value="RENT">Rent</option>
          <option value="SALARY">Salary</option>
          <option value="TRANSPORT">Transport</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all motion-safe:active:scale-95">
          {submitting ? 'Menyimpan…' : editId ? 'Update' : 'Tambah'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-muted/50 transition-all motion-safe:active:scale-95 text-foreground/80">
          Batal
        </button>
      </div>
    </form>
  );
}
