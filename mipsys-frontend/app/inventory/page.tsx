"use client";

import React from "react";
import { useInventoryManager } from "@/src/features/inventory/hooks/useInventoryManager";
import { InventoryTable } from "@/src/features/inventory/components/InventoryTable";

export default function InventoryPage() {
  const { parts, isLoading, error, searchQuery, setSearchQuery, metrics } =
    useInventoryManager();

  return (
    <div className="p-6 space-y-6">
      {/* Header Halaman & Kartu Valuasi Aset */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium uppercase">
            Total Item Fisik
          </span>
          <span className="text-2xl font-bold text-slate-800">
            {metrics.totalItems} Unit
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium uppercase">
            Valuasi Aset Gudang
          </span>
          <span className="text-2xl font-bold text-indigo-600">
            Rp {metrics.totalValuation.toLocaleString("id-ID")}
          </span>
        </div>
        <div
          className={`p-4 rounded-lg border shadow-sm ${metrics.criticalStockCount > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}
        >
          <span className="text-xs text-slate-400 block font-medium uppercase">
            Peringatan Stok Kritis
          </span>
          <span
            className={`text-2xl font-bold ${metrics.criticalStockCount > 0 ? "text-amber-700" : "text-slate-800"}`}
          >
            {metrics.criticalStockCount} Jenis Part
          </span>
        </div>
      </div>

      {/* Area Kontrol (Pencarian Data Instan) */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari nama part atau kode rak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="text-xs text-slate-500">
          Menampilkan{" "}
          <span className="font-bold text-slate-700">{parts.length}</span> suku
          cadang
        </div>
      </div>

      {/* Area Pesan Kesalahan */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Area Tabel Utama */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse font-medium">
          Memindai rak inventaris...
        </div>
      ) : (
        <InventoryTable items={parts} />
      )}
    </div>
  );
}
