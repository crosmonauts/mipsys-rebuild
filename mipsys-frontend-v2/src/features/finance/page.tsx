'use client';

import React, { useState } from 'react';
import {
  Search,
  TrendingUp,
  CreditCard,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import { InvoiceTableRow } from './components/InvoiceTableRow';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { PaymentForm } from './components/PaymentForm';
import { useInvoices, useFinanceStats } from './hooks/useFinance';
import { financeApi } from './api/finance-api';
import { Invoice } from './types';
import { toast } from 'react-hot-toast';
import { LoadingSkeleton } from '@/src/components/ui/loading-skeleton';

export default function FinancePage() {
  const [search, setSearch] = useState('');
  const { data: invoices, isLoading, refetch } = useInvoices(search);
  const { stats } = useFinanceStats();
  const [selectedInvoice, setSelectedInvoice] = useState<(Invoice & { payments?: any[] }) | null>(null);
  const [showPayInvoiceId, setShowPayInvoiceId] = useState<number | null>(null);
  const [payInvoiceTotal, setPayInvoiceTotal] = useState(0);

  const filtered = invoices.filter((inv) =>
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    inv.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.ticketNumber?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleView(invoice: Invoice) {
    try {
      const detail = await financeApi.getById(invoice.id);
      setSelectedInvoice(detail);
    } catch {
      toast.error('Gagal memuat detail invoice');
    }
  }

  function handlePay(invoice: Invoice) {
    setShowPayInvoiceId(invoice.id);
    setPayInvoiceTotal(parseFloat(invoice.total || '0'));
  }

  async function handleVoid(invoice: Invoice) {
    try {
      await financeApi.voidInvoice(invoice.id);
      toast.success('Invoice berhasil di-void');
      refetch();
    } catch {
      toast.error('Gagal void invoice');
    }
  }

  return (
    <main className="planner-bg min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12 space-y-8 animate-in fade-in duration-500">
        {/* HEADER */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 w-fit px-2.5 py-0.5 bg-primary/20 text-primary rounded text-[9px] font-black uppercase tracking-widest border border-primary/30">
              <CreditCard size={10} /> Penagihan
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
              Finance & <span className="text-primary">Billing</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground font-bold italic">
              &quot;Monitor pendapatan dan status penagihan secara real-time.&quot;
            </p>
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="paper-card p-6">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl w-fit mb-4">
              <TrendingUp size={20} />
            </div>
            <p className="micro-label text-muted-foreground">
              Total Pendapatan
            </p>
            <h3 className="text-2xl font-black text-foreground tracking-tighter">
              Rp {stats.totalRevenue.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="paper-card p-6">
            <div className="p-2.5 bg-accent/10 text-accent rounded-xl w-fit mb-4">
              <CreditCard size={20} />
            </div>
            <p className="micro-label text-muted-foreground">
              Menunggu Pembayaran
            </p>
            <h3 className="text-2xl font-black text-foreground tracking-tighter">
              Rp {stats.outstanding.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="paper-card p-6">
            <div className="p-2.5 bg-destructive/10 text-destructive rounded-xl w-fit mb-4">
              <AlertCircle size={20} />
            </div>
            <p className="micro-label text-muted-foreground">
              Tagihan Overdue
            </p>
            <h3 className="text-2xl font-black text-foreground tracking-tighter">
              {stats.overdueCount}
            </h3>
          </div>
        </section>

        {/* SEARCH */}
        <section className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari No. Invoice atau Nama Klien..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-input border border-border rounded-xl text-xs font-bold text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/50 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-3 bg-card border border-border rounded-xl text-xs font-black uppercase tracking-wider text-foreground hover:bg-muted transition-all flex items-center gap-2"
          >
            <RefreshCcw size={16} />
            Perbarui
          </button>
        </section>

        {/* DATA TABLE */}
        <section className="paper-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    No. Invoice
                  </th>
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    Klien
                  </th>
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    Tiket
                  </th>
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-right">
                    Total
                  </th>
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-center">
                    Status
                  </th>
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <LoadingSkeleton variant="table-row" className="h-8" />
                      <LoadingSkeleton variant="table-row" className="h-8 mt-2" />
                      <LoadingSkeleton variant="table-row" className="h-8 mt-2" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground font-bold italic text-sm">
                      Tidak ada invoice.
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => (
                    <InvoiceTableRow
                      key={inv.id}
                      invoice={inv}
                      onView={() => handleView(inv)}
                      onPay={() => handlePay(inv)}
                      onVoid={() => handleVoid(inv)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
          />
        )}

        {/* Payment Form Modal */}
        {showPayInvoiceId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPayInvoiceId(null)}>
            <div className="paper-card p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-black text-lg text-foreground mb-4">Catat Pembayaran</h3>
              <PaymentForm
                invoiceId={showPayInvoiceId}
                invoiceTotal={payInvoiceTotal}
                onSuccess={() => { setShowPayInvoiceId(null); refetch(); }}
                onCancel={() => setShowPayInvoiceId(null)}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
