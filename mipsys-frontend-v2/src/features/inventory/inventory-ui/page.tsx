'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCcw,
  Globe,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { partsApi } from '@/src/features/inventory/services/parts-api';
import { SparePart } from '@/src/features/inventory/types';
import { PartTableRow } from '@/src/features/inventory/inventory-ui/PartTableRow';
import { AddStockModal } from '@/src/features/inventory/inventory-ui/AddStockModal';

export default function InventoryPage() {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // --- STATE PAGINASI ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const limitPerPage = 10;

  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [isRestockOpen, setIsRestockOpen] = useState<boolean>(false);

  const fetchParts = useCallback(async () => {
    try {
      setLoading(true);
      // 'response: any' digunakan untuk mematikan pengecekan ketat TypeScript pada meta & data
      const response: any = await partsApi.getAllParts({
        search,
        page: currentPage,
        limit: limitPerPage,
      });

      // 1. Ekstrak data array dari response
      let rawData: SparePart[] = [];
      if (response && response.data) {
        rawData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        rawData = response;
      }

      // 2. Logika Penentuan Paginasi (Server-Side atau Client-Side fallback)
      if (response && response.meta && response.meta.totalPages) {
        // Kasus A: Backend mendukung metadata pagination
        setParts(rawData);
        setTotalPages(response.meta.totalPages);
      } else if (rawData.length > limitPerPage) {
        // Kasus B: Client-side pagination (Backend mengirimkan semua data sekaligus)
        setTotalPages(Math.ceil(rawData.length / limitPerPage));
        const start = (currentPage - 1) * limitPerPage;
        setParts(rawData.slice(start, start + limitPerPage));
      } else {
        // Kasus C: Backend memotong data secara server-side tapi tidak mengirimkan metadata
        setParts(rawData);
        setTotalPages(
          rawData.length === limitPerPage ? currentPage + 1 : currentPage,
        );
      }
    } catch (error) {
      console.error('Gagal memuat suku cadang:', error);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // Reset ke halaman 1 jika user mengetik sesuatu di kotak pencarian
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRestockClick = (part: SparePart) => {
    setSelectedPart(part);
    setIsRestockOpen(true);
  };

  const handleAddStockSubmit = async (id: number, qty: number) => {
    await partsApi.addStock(id, qty);
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-360 mx-auto space-y-8 animate-in fade-in duration-500 text-left">
      {/* --- HEADER --- */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
            Inventory & <span className="text-blue-800">Parts</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-700 font-bold italic">
            "Manajemen stok suku cadang terpusat Mipsys Enterprise."
          </p>
        </div>

        <button
          onClick={() => {
            setCurrentPage(1);
            fetchParts();
          }}
          className="p-3 bg-white hover:bg-slate-100 rounded-xl transition-all border-2 border-slate-300 text-slate-900 focus-visible:ring-4 focus-visible:ring-blue-600 focus-visible:outline-none flex items-center gap-2 shadow-sm"
          aria-label="Segarkan database"
        >
          <RefreshCcw
            size={16}
            className={loading ? 'animate-spin' : ''}
            aria-hidden="true"
          />
          <span className="text-xs font-black uppercase tracking-wider">
            Perbarui Data
          </span>
        </button>
      </section>

      {/* --- PENCARIAN (AAA CONTRAST RING) --- */}
      <section
        className="flex flex-col sm:flex-row gap-4"
        aria-label="Filter Pencarian"
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-950"
            size={18}
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Cari part code, nama barang, atau model mesin..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-950 placeholder-slate-600 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition-all"
            aria-label="Input pencarian suku cadang"
          />
        </div>
      </section>

      {/* --- TABEL INVENTARIS --- */}
      <section className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            aria-label="Tabel Data Suku Cadang"
          >
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300">
                <th
                  scope="col"
                  className="p-4 text-[11px] font-black text-slate-900 uppercase tracking-widest"
                >
                  Part Code
                </th>
                <th
                  scope="col"
                  className="p-4 text-[11px] font-black text-slate-900 uppercase tracking-widest"
                >
                  Nama Barang
                </th>
                <th
                  scope="col"
                  className="p-4 text-[11px] font-black text-slate-900 uppercase tracking-widest"
                >
                  Model Mesin
                </th>
                <th
                  scope="col"
                  className="p-4 text-[11px] font-black text-slate-900 uppercase tracking-widest text-center"
                >
                  Stok
                </th>
                <th
                  scope="col"
                  className="p-4 text-[11px] font-black text-slate-900 uppercase tracking-widest"
                >
                  Harga
                </th>
                <th
                  scope="col"
                  className="p-4 text-[11px] font-black text-slate-900 uppercase tracking-widest"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="p-4 text-[11px] font-black text-slate-900 uppercase tracking-widest text-center"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-slate-900 font-black italic text-sm"
                  >
                    <RefreshCcw
                      className="animate-spin inline mr-3"
                      size={18}
                      aria-hidden="true"
                    />
                    Menyinkronkan data suku cadang...
                  </td>
                </tr>
              ) : parts.length > 0 ? (
                parts.map((part) => (
                  <PartTableRow
                    key={part.id}
                    part={part}
                    onOpenRestock={handleRestockClick}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-slate-900 font-black italic text-sm"
                  >
                    Suku cadang tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- KONTROL PAGINASI --- */}
        <div className="p-4 bg-slate-50 border-t-2 border-slate-300 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Halaman <span className="text-blue-800">{currentPage}</span> dari{' '}
            <span className="text-slate-700">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="flex-1 sm:flex-initial h-10 px-4 bg-white hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400 text-slate-900 font-black text-xs uppercase rounded-xl border-2 border-slate-300 outline-none focus-visible:ring-4 focus-visible:ring-blue-600 transition-all flex items-center justify-center gap-1 select-none"
            >
              <ChevronLeft size={16} aria-hidden="true" /> Sebelumnya
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || loading}
              className="flex-1 sm:flex-initial h-10 px-4 bg-white hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400 text-slate-900 font-black text-xs uppercase rounded-xl border-2 border-slate-300 outline-none focus-visible:ring-4 focus-visible:ring-blue-600 transition-all flex items-center justify-center gap-1 select-none"
            >
              Selanjutnya <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Modal Penambahan Stok */}
      <AddStockModal
        part={selectedPart}
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        onSuccess={fetchParts}
        onAddStockSubmit={handleAddStockSubmit}
      />

      {/* --- FOOTER SINKRON --- */}
      <footer className="pt-6 border-t-2 border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] text-center md:text-left">
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border-2 border-slate-200">
          <Globe size={12} className="text-blue-900" aria-hidden="true" />{' '}
          Central Java, Indonesia
        </div>
        <p className="bg-slate-950 text-white px-3 py-1.5 rounded-lg italic select-none">
          © 2026 PT Mitrainfoparama — V2.1.0-AAA
        </p>
      </footer>
    </div>
  );
}
