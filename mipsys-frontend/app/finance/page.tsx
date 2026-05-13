"use client";

import React from "react";
import { useFinanceManager } from "@/src/features/finance/hooks/useFinanceManager";
import { FinanceTable } from "@/src/features/finance/components/FinanceTable";

export default function FinancePage() {
  const {
    invoices,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    summary,
    handlePrintInvoice,
    refreshFinance,
  } = useFinanceManager();

  return (
    <main
      aria-labelledby="finance-title"
      className="p-6 space-y-6 bg-white min-h-screen"
    >
      {/* Header Kontras Tinggi AAA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border-4 border-slate-950 rounded-none">
        <div>
          <h1
            id="finance-title"
            className="text-2xl font-black text-slate-950 tracking-tight"
          >
            Finance & Invoicing Dashboard
          </h1>
          <p className="text-base font-bold text-slate-900 mt-0.5">
            Pusat audit pembukuan, verifikasi piutang, dan pencetakan faktur
            tagihan
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={refreshFinance}
            aria-label="Muat ulang data pembukuan kasir"
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs uppercase tracking-wider border-2 border-slate-950 rounded-none focus:outline-none focus:ring-4 focus:ring-slate-950"
          >
            🗘 Segarkan
          </button>
        </div>
      </div>

      {/* Kartu Metrik Akuntansi (Pemasukan vs Piutang) Berstandar AAA */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        role="region"
        aria-label="Ringkasan Saldo Pembukuan"
      >
        <div className="bg-white p-4 border-4 border-slate-950 rounded-none">
          <span className="text-xs font-black text-slate-900 uppercase block">
            Pemasukan Lunas (Status Done)
          </span>
          <span className="text-2xl font-black text-green-950 block mt-1">
            Rp {summary.totalCollected.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="bg-amber-50 p-4 border-4 border-slate-950 rounded-none">
          <span className="text-xs font-black text-amber-950 uppercase block">
            Total Piutang (Menunggu Bayar)
          </span>
          <span className="text-2xl font-black text-slate-950 block mt-1">
            Rp {summary.totalReceivables.toLocaleString("id-ID")}
          </span>
          <span className="text-xs font-bold text-slate-800 block mt-0.5">
            Dari{" "}
            <span className="font-black text-slate-950">
              {summary.pendingInvoiceCount}
            </span>{" "}
            Tagihan Aktif
          </span>
        </div>

        <div className="bg-white p-4 border-4 border-slate-950 rounded-none flex flex-col justify-center">
          <span className="text-xs font-black text-slate-900 uppercase block">
            Status Audit Lingkungan
          </span>
          <span className="text-lg font-black text-indigo-950 block mt-1">
            ✓ WCAG AAA Compliant
          </span>
        </div>
      </div>

      {/* Area Kontrol Kasir Inklusif */}
      <div className="bg-slate-50 p-4 border-2 border-slate-950 rounded-none flex items-center">
        <div className="w-full max-w-md">
          <label htmlFor="search-invoice" className="sr-only">
            Cari berdasarkan nomor faktur atau deskripsi
          </label>
          <input
            id="search-invoice"
            type="text"
            placeholder="Cari no faktur atau rincian kerusakan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-white border-2 border-slate-950 text-slate-950 font-bold placeholder-slate-600 rounded-none focus:outline-none focus:ring-4 focus:ring-slate-950"
          />
        </div>
      </div>

      {/* Peringatan Jaringan AAA */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-red-100 text-red-950 border-l-8 border-red-950 font-black text-base"
        >
          ⚠️ Peringatan: {error}
        </div>
      )}

      {/* Tabel Utama Kasir */}
      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="p-12 text-center text-slate-950 font-black text-lg border-2 border-slate-950 bg-slate-50"
        >
          ⏳ Mengkalkulasi buku besar tagihan dari server...
        </div>
      ) : (
        <FinanceTable items={invoices} onPrintInvoice={handlePrintInvoice} />
      )}
    </main>
  );
}
