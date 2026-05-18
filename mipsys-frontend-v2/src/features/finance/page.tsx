'use client';

import React, { useState } from 'react';
import {
  Search,
  TrendingUp,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { InvoiceTableRow } from './components/InvoiceTableRow';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { PaymentForm } from './components/PaymentForm';
import { useInvoices, useFinanceStats } from './hooks/useFinance';
import { financeApi } from './api/finance-api';
import { Invoice } from './types';
import { toast } from 'react-hot-toast';

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

  async function handleGenerateInvoice(ticketNumber: string) {
    try {
      await financeApi.generateFromSR(ticketNumber);
      toast.success('Invoice berhasil dibuat');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat invoice');
    }
  }

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
    <div className="px-6 md:px-10 py-8 max-w-360 mx-auto space-y-8 text-left animate-in fade-in duration-500">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
            Finance & <span className="text-blue-800">Billing</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-700 font-bold italic">
            &quot;Monitor pendapatan dan status penagihan secara real-time.&quot;
          </p>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl shadow-sm">
          <TrendingUp className="text-emerald-700 mb-3" size={24} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Total Pendapatan
          </p>
          <h3 className="text-2xl font-black text-slate-950">
            Rp {stats.totalRevenue.toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl shadow-sm">
          <CreditCard className="text-blue-700 mb-3" size={24} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Menunggu Pembayaran
          </p>
          <h3 className="text-2xl font-black text-slate-950">
            Rp {stats.outstanding.toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl shadow-sm">
          <AlertCircle className="text-red-700 mb-3" size={24} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Tagihan Overdue
          </p>
          <h3 className="text-2xl font-black text-slate-950">
            {stats.overdueCount}
          </h3>
        </div>
      </section>

      {/* SEARCH */}
      <section className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-950"
            size={18}
          />
          <input
            type="text"
            placeholder="Cari No. Invoice atau Nama Klien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-950 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none"
          />
        </div>
      </section>

      {/* DATA TABLE */}
      <section className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300">
                <th className="p-4 text-[11px] font-black text-slate-900 uppercase">
                  No. Invoice
                </th>
                <th className="p-4 text-[11px] font-black text-slate-900 uppercase">
                  Klien
                </th>
                <th className="p-4 text-[11px] font-black text-slate-900 uppercase">
                  Tiket
                </th>
                <th className="p-4 text-[11px] font-black text-slate-900 uppercase text-right">
                  Total
                </th>
                <th className="p-4 text-[11px] font-black text-slate-900 uppercase text-center">
                  Status
                </th>
                <th className="p-4 text-[11px] font-black text-slate-900 uppercase text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs font-bold text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs font-bold text-slate-500">
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-lg mb-4">Catat Pembayaran</h3>
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
  );
}
