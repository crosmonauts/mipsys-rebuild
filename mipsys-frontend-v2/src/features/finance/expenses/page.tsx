'use client';
import React, { useState } from 'react';
import { Wallet, Plus, RefreshCw } from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';
import { ExpenseTable } from '../components/ExpenseTable';
import { ExpenseForm } from '../components/ExpenseForm';
import { financeApi } from '../api/finance-api';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { PageHeader } from '@/src/components/ui/page-header';
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
    <div className="space-y-8">
      <PageHeader
        title="Pengeluaran (Expenses)"
        badge={{ icon: <Wallet size={10} aria-hidden="true" />, label: 'Keuangan' }}
      >
        <div className="flex gap-2">
          <Button onClick={handleSyncPo} variant="outline" className="h-12 px-6 rounded-2xl gap-2 text-xs font-black uppercase">
            <RefreshCw size={14} aria-hidden="true" /> Sync PO
          </Button>
          <Button onClick={() => { setEditExpense(null); setShowForm(true); }} className="h-12 px-6 rounded-2xl gap-2 text-xs font-black uppercase bg-primary hover:bg-primary/90 text-primary-foreground border-none">
            <Plus size={14} aria-hidden="true" /> Tambah
          </Button>
        </div>
      </PageHeader>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none rounded-[2rem] shadow-sm">
          <CardContent className="p-6">
            <Wallet className="text-destructive mb-3" size={24} />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Pengeluaran</p>
            <h3 className="text-2xl font-black text-foreground">Rp {totalExpenses.toLocaleString('id-ID')}</h3>
          </CardContent>
        </Card>
        <Card className="border-none rounded-[2rem] shadow-sm">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Jumlah Transaksi</p>
            <h3 className="text-2xl font-black text-foreground">{expenses.length}</h3>
          </CardContent>
        </Card>
        <Card className="border-none rounded-[2rem] shadow-sm">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rata-rata</p>
            <h3 className="text-2xl font-black text-foreground">
              Rp {expenses.length > 0 ? Math.round(totalExpenses / expenses.length).toLocaleString('id-ID') : 0}
            </h3>
          </CardContent>
        </Card>
      </section>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-bold text-muted-foreground">Memuat data...</div>
        ) : (
          <ExpenseTable expenses={expenses} onEdit={(exp) => { setEditExpense(exp); setShowForm(true); }} onDelete={handleDelete} />
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-[2.5rem] p-6 max-w-md w-full mx-4 shadow-2xl border border-border/30 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-lg text-foreground mb-4">{editExpense ? 'Edit Expense' : 'Tambah Expense'}</h3>
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
