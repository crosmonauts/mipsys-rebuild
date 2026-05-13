"use client";

import React from "react";
import { usePurchaseOrder } from "@/src/features/purchase-order/hooks/usePurchaseOrder";
import { PurchaseOrderTable } from "@/src/features/purchase-order/components/PurchaseOrderTable";

export default function PurchaseOrderPage() {
  const { orders, isLoading, error, totalCommittedSpend, refreshOrders } =
    usePurchaseOrder();

  return (
    <main
      aria-labelledby="page-title"
      className="p-6 space-y-6 bg-white min-h-screen"
    >
      {/* Header Berkontras Tinggi (Rasio > 15:1) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-none border-4 border-slate-950">
        <div>
          <h1
            id="page-title"
            className="text-2xl font-black text-slate-950 tracking-tight"
          >
            Purchase Order (Pengadaan Barang)
          </h1>
          <p className="text-base font-medium text-slate-900 mt-0.5">
            Manajemen pemesanan suku cadang ke pemasok eksternal
          </p>
        </div>
        <div className="bg-slate-100 p-3 border-2 border-slate-950 text-right w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-900 uppercase block">
            Total Komitmen Biaya
          </span>
          <span className="text-xl font-black text-indigo-950">
            Rp {totalCommittedSpend.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Tombol Aksi Inklusif (Ring Fokus AAA & Keyboard Navigable) */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={refreshOrders}
          aria-label="Muat ulang data pesanan pembelian saat ini"
          className="px-5 py-3 bg-indigo-900 hover:bg-indigo-950 text-white font-black text-sm uppercase tracking-wider rounded-none border-2 border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950 focus:ring-offset-2 active:translate-y-0.5 transition-all"
        >
          🗘 Segarkan Data Pesanan
        </button>
      </div>

      {/* Area Notifikasi Peringatan AAA */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-red-100 text-red-950 border-l-8 border-red-900 font-bold text-base"
        >
          <span aria-hidden="true">⚠️</span> Peringatan: {error}
        </div>
      )}

      {/* Area Tabel Utama */}
      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="p-12 text-center text-slate-950 font-black text-lg border-2 border-slate-900 bg-slate-50"
        >
          ⏳ Memuat data pengadaan barang dari sistem...
        </div>
      ) : (
        <PurchaseOrderTable items={orders} />
      )}
    </main>
  );
}
