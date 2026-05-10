'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { InvoiceTableRow } from './components/InvoiceTableRow';
import { Invoice } from './types';

const mockInvoices: Invoice[] = [
  {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    clientName: 'PT. Global Tech',
    date: '04 Mei 2026',
    amount: 4500000,
    status: 'PAID',
    method: 'Transfer',
  },
  {
    id: 2,
    invoiceNumber: 'INV-2024-002',
    clientName: 'CV. Maju Jaya',
    date: '05 Mei 2026',
    amount: 1250000,
    status: 'OVERDUE',
    method: 'Cash',
  },
  {
    id: 3,
    invoiceNumber: 'INV-2024-003',
    clientName: 'Bapak Ahmad',
    date: '05 Mei 2026',
    amount: 750000,
    status: 'UNPAID',
    method: 'Pending',
  },
];

export default function FinancePage() {
  return (
    <div className="px-6 md:px-10 py-8 max-w-360 mx-auto space-y-8 text-left animate-in fade-in duration-500">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
            Finance & <span className="text-blue-800">Billing</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-700 font-bold italic">
            "Monitor pendapatan dan status penagihan secara real-time."
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-slate-950 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-800 transition-all shadow-lg">
          <Download size={16} /> Export Laporan
        </button>
      </section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl shadow-sm">
          <TrendingUp className="text-emerald-700 mb-3" size={24} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Total Pendapatan (Bulan Ini)
          </p>
          <h3 className="text-2xl font-black text-slate-950">
            IDR 124.500.000
          </h3>
        </div>
        <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl shadow-sm">
          <CreditCard className="text-blue-700 mb-3" size={24} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Menunggu Pembayaran
          </p>
          <h3 className="text-2xl font-black text-slate-950">IDR 12.800.000</h3>
        </div>
        <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl shadow-sm">
          <AlertCircle className="text-red-700 mb-3" size={24} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Tagihan Overdue
          </p>
          <h3 className="text-2xl font-black text-slate-950">IDR 4.200.000</h3>
        </div>
      </section>

      {/* FILTER & SEARCH */}
      <section className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-950"
            size={18}
          />
          <input
            type="text"
            placeholder="Cari No. Invoice atau Nama Klien..."
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-950 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none"
          />
        </div>
        <button className="px-5 py-3 bg-white border-2 border-slate-300 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-slate-100 transition-all">
          <Filter size={16} /> Filter
        </button>
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
                  Tanggal
                </th>
                <th className="p-4 text-[11px] font-black text-slate-900 uppercase">
                  Nominal
                </th>
                <th className="p-4 text-[11px] font-black text-slate-900 uppercase">
                  Status
                </th>
                <th className="p-4 text-[11px] font-black text-slate-900 uppercase text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((inv) => (
                <InvoiceTableRow key={inv.id} invoice={inv} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
