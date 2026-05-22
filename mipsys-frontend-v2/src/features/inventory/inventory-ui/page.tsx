'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCcw,
  Globe,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { partsApi } from '@/src/features/inventory/services/parts-api';
import { SparePart } from '@/src/features/inventory/types';
import { PartTableRow } from '@/src/features/inventory/inventory-ui/PartTableRow';
import { AddStockModal } from '@/src/features/inventory/inventory-ui/AddStockModal';
import { LoadingSkeleton } from '@/src/components/ui/loading-skeleton';
import { toast } from 'react-hot-toast';

export default function InventoryPage() {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const limitPerPage = 10;
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [isRestockOpen, setIsRestockOpen] = useState<boolean>(false);

  const fetchParts = useCallback(async () => {
    try {
      setLoading(true);
      const response: any = await partsApi.getAllParts({
        search,
        page: currentPage,
        limit: limitPerPage,
      });

      let rawData: SparePart[] = [];
      if (response && response.data) {
        rawData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        rawData = response;
      }

      if (response && response.meta && response.meta.totalPages) {
        setParts(rawData);
        setTotalPages(response.meta.totalPages);
      } else if (rawData.length > limitPerPage) {
        setTotalPages(Math.ceil(rawData.length / limitPerPage));
        const start = (currentPage - 1) * limitPerPage;
        setParts(rawData.slice(start, start + limitPerPage));
      } else {
        setParts(rawData);
        setTotalPages(
          rawData.length === limitPerPage ? currentPage + 1 : currentPage,
        );
      }
    } catch (error) {
      console.error('Gagal memuat suku cadang:', error);
      toast.error('Gagal memuat data suku cadang');
    } finally {
      setLoading(false);
    }
  }, [search, currentPage]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRestockClick = (part: SparePart) => {
    setSelectedPart(part);
    setIsRestockOpen(true);
  };

  const handleStockAction = async (id: number, qty: number, type: 'ADD' | 'SUBTRACT' | 'RESET') => {
    if (type === 'ADD') await partsApi.addStock(id, qty);
    else if (type === 'SUBTRACT') await partsApi.reduceStock(id, qty);
    else if (type === 'RESET') await partsApi.reduceStock(id, qty);
  };

  return (
    <main className="planner-bg min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12 space-y-8 animate-in fade-in duration-500">
        {/* HEADER */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 w-fit px-2.5 py-0.5 bg-primary/20 text-primary rounded text-[9px] font-black uppercase tracking-widest border border-primary/30">
              <Package size={10} /> Inventaris
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
              Inventory & <span className="text-primary">Parts</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground font-bold italic">
              &quot;Manajemen stok suku cadang terpusat Mipsys Enterprise.&quot;
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentPage(1);
              fetchParts();
            }}
            className="px-4 py-3 bg-card border border-border rounded-xl text-xs font-black uppercase tracking-wider text-foreground hover:bg-muted transition-all flex items-center gap-2 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label="Segarkan database"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>Perbarui Data</span>
          </button>
        </section>

        {/* SEARCH */}
        <section className="flex flex-col sm:flex-row gap-4" aria-label="Filter Pencarian">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Cari part code, nama barang, atau model mesin..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-11 pr-4 py-3 bg-input border border-border rounded-xl text-xs font-bold text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/50 outline-none transition-all"
              aria-label="Input pencarian suku cadang"
            />
          </div>
        </section>

        {/* TABLE */}
        <section className="paper-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" aria-label="Tabel Data Suku Cadang">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Part Code</th>
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Nama Barang</th>
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Model Mesin</th>
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-center">Stok</th>
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Harga</th>
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                  <th scope="col" className="p-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8">
                      <LoadingSkeleton variant="table-row" className="h-8" />
                      <LoadingSkeleton variant="table-row" className="h-8 mt-2" />
                      <LoadingSkeleton variant="table-row" className="h-8 mt-2" />
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
                    <td colSpan={7} className="p-12 text-center text-muted-foreground font-bold italic text-sm">
                      Suku cadang tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-4 bg-muted/30 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">
              Halaman <span className="text-foreground">{currentPage}</span> dari{' '}
              <span className="text-muted-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="flex-1 sm:flex-initial h-10 px-4 bg-card hover:bg-muted disabled:opacity-40 text-foreground font-black text-xs uppercase rounded-xl border border-border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all flex items-center justify-center gap-1 select-none"
              >
                <ChevronLeft size={16} aria-hidden="true" /> Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="flex-1 sm:flex-initial h-10 px-4 bg-card hover:bg-muted disabled:opacity-40 text-foreground font-black text-xs uppercase rounded-xl border border-border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all flex items-center justify-center gap-1 select-none"
              >
                Selanjutnya <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {/* Add Stock Modal */}
        <AddStockModal
          part={selectedPart}
          isOpen={isRestockOpen}
          onClose={() => setIsRestockOpen(false)}
          onSuccess={fetchParts}
          onStockAction={handleStockAction}
        />

        {/* FOOTER */}
        <footer className="pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center md:text-left">
          <div className="flex items-center gap-2">
            <Globe size={12} className="text-primary" aria-hidden="true" />
            Central Java, Indonesia
          </div>
          <p className="text-muted-foreground">
            &copy; 2026 PT Mitrainfoparama &mdash; V2.1.0-AAA
          </p>
        </footer>
      </div>
    </main>
  );
}
