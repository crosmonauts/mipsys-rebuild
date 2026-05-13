"use client";

import React from "react";
import { useServiceDashboard } from "@/src/features/service-request/hooks/useServiceDashboard";
import { ServiceDashboardTable } from "@/src/features/service-request/components/ServiceDashboardTable";

export default function ServiceRequestPage() {
  const {
    requests,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    metrics,
    handleStatusAdvance,
  } = useServiceDashboard();

  // Kamus filter statis O(1)
  const filterOptions = [
    { key: "ALL", label: "Semua Tiket" },
    { key: "WAITING_CHECK", label: "Menunggu Cek" },
    { key: "CHECK", label: "Sedang Dicek" },
    { key: "WAITING_APPROVE", label: "Menunggu Persetujuan" },
    { key: "SERVICE", label: "Proses Servis" },
    { key: "DONE", label: "Selesai" },
  ];

  return (
    <main
      aria-labelledby="sr-title"
      className="p-6 space-y-6 bg-white min-h-screen"
    >
      {/* Header Kontras Tinggi AAA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border-4 border-slate-950 rounded-none">
        <div>
          <h1
            id="sr-title"
            className="text-2xl font-black text-slate-950 tracking-tight"
          >
            Service Request Dashboard
          </h1>
          <p className="text-base font-bold text-slate-900 mt-0.5">
            Pusat kendali perbaikan unit, estimasi biaya, dan pelacakan teknisi
          </p>
        </div>
        <div className="bg-slate-100 p-3 border-2 border-slate-950 text-right w-full sm:w-auto">
          <span className="text-xs font-black text-slate-900 uppercase block">
            Estimasi Pendapatan Aktif
          </span>
          <span className="text-xl font-black text-indigo-950">
            Rp {metrics.totalEstimatedRevenue.toLocaleString("id-ID")}
          </span>
          <span className="text-xs font-bold text-slate-700 block mt-0.5">
            Dari{" "}
            <span className="text-slate-950 font-black">
              {metrics.activeTickets}
            </span>{" "}
            Tiket Diproses
          </span>
        </div>
      </div>

      {/* Area Kontrol Inklusif (Pencarian & Filter Papan Ketik) */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-50 p-4 border-2 border-slate-950 rounded-none">
        {/* Input Pencarian Ramah Screen Reader */}
        <div className="flex-1 max-w-md">
          <label htmlFor="search-ticket" className="sr-only">
            Cari nomor tiket atau deskripsi kendala
          </label>
          <input
            id="search-ticket"
            type="text"
            placeholder="Ketik pencarian no tiket atau kerusakan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-white border-2 border-slate-950 text-slate-950 font-bold placeholder-slate-600 rounded-none focus:outline-none focus:ring-4 focus:ring-slate-950"
          />
        </div>

        {/* Deretan Tombol Filter Radio AAA */}
        <div
          role="group"
          aria-label="Filter berdasarkan status perbaikan"
          className="flex flex-wrap gap-1.5"
        >
          {filterOptions.map((opt) => {
            const isSelected = statusFilter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                aria-pressed={isSelected}
                className={`px-3 py-1.5 border-2 border-slate-950 font-black text-xs uppercase tracking-wider rounded-none focus:outline-none focus:ring-4 focus:ring-slate-950 transition-all ${
                  isSelected
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-white text-slate-950 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
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

      {/* Tabel Utama */}
      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="p-12 text-center text-slate-950 font-black text-lg border-2 border-slate-950 bg-slate-50"
        >
          ⏳ Mengambil data tiket perbaikan aktif dari server...
        </div>
      ) : (
        <ServiceDashboardTable
          items={requests}
          onAdvanceStatus={handleStatusAdvance}
        />
      )}
    </main>
  );
}
