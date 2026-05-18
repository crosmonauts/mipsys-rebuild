'use client';
import React, { useState } from 'react';
import { Wallet, Plus, RefreshCw } from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';
import { ExpenseTable } from '../components/ExpenseTable';
import { ExpenseForm } from '../components/ExpenseForm';
import { financeApi } from '../api/finance-api';
import { toast } from 'react-hot-toast';
import { Expense } from '../types';

export default function ExpensesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const { data: expenses, isLoading, refetch } = useExpenses();

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  async function handleSyncPo() {
    try {
      const result = await financeApi.syncPoExpenses();
      toast.success(`${result.synced} expense dari PO berhasil disync`);
      refetch();
    } catch {
      toast.error('Gagal sync PO');
    }
  }

  async function handleDelete(id: number) {
    try {
      await financeApi.deleteExpense(id);
      toast.success('Expense berhasil dihapus');
      refetch();
    } catch {
      toast.error('Gagal menghapus expense');
    }
  }

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-500">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
            <Wallet className="inline mr-2 mb-1" size={28} />
            Pengeluaran <span className="text-blue-800">(Expenses)</span>
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSyncPo}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-all">
            <RefreshCw size={14} /> Sync PO
          </button>
          <button onClick={() => { setEditExpense(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all">
            <Plus size={14} /> Tambah
          </button>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl shadow-sm">
          <Wallet className="text-red-700 mb-3" size={24} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Pengeluaran</p>
          <h3 className="text-2xl font-black text-slate-950">Rp {totalExpenses.toLocaleString('id-ID')}</h3>
        </div>
        <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jumlah Transaksi</p>
          <h3 className="text-2xl font-black text-slate-950">{expenses.length}</h3>
        </div>
        <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rata-rata</p>
          <h3 className="text-2xl font-black text-slate-950">
            Rp {expenses.length > 0 ? Math.round(totalExpenses / expenses.length).toLocaleString('id-ID') : 0}
          </h3>
        </div>
      </section>

      {/* Table */}
      <section className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-md">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500">Memuat data...</div>
        ) : (
          <ExpenseTable expenses={expenses} onEdit={(exp) => { setEditExpense(exp); setShowForm(true); }} onDelete={handleDelete} />
        )}
      </section>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-lg mb-4">{editExpense ? 'Edit Expense' : 'Tambah Expense'}</h3>
            <ExpenseForm
              onSuccess={() => { setShowForm(false); setEditExpense(null); refetch(); }}
              onCancel={() => { setShowForm(false); setEditExpense(null); }}
              initial={editExpense ? { description: editExpense.description, amount: editExpense.amount, expenseDate: editExpense.expenseDate, category: editExpense.category } : undefined}
              editId={editExpense?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
