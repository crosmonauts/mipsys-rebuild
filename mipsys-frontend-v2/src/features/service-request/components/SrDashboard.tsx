'use client';

import { useEffect, useState } from 'react';
import { srApi } from '../services/sr-api';
import { SrStatsCards } from './SrStatsCards';
import { SrFilterBar } from './SrFilterBar';
import Link from 'next/link';
import { Loader2, ExternalLink } from 'lucide-react';
import { EmptyState } from '@/src/components/ui/empty-state';

interface ServiceRequest {
  id: number;
  ticketNumber: string;
  statusService: string;
  statusSystem: string;
  incomingDate: string;
  customerName: string;
  customerPhone?: string;
  modelName?: string;
  serialNumber?: string;
  serviceType?: string;
}

const statusBadge = (statusService: string) => {
  const map: Record<string, { label: string; className: string }> = {
    WAITING_CHECK: { label: 'Pending', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    WAITING_APPROVE: { label: 'Menunggu Approve', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    SERVICE: { label: 'In Service', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    AWAITING_PARTS: { label: 'Menunggu Part', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    DONE: { label: 'Ready', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    CLOSED: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border/20' },
    CANCEL: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  return map[statusService] || { label: statusService, className: 'bg-muted text-muted-foreground border-border/20' };
};

export function SrDashboard() {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [result, statsResult] = await Promise.all([
        srApi.getAll(searchTerm, page, limit, activeFilter),
        srApi.getDashboardStats(),
      ]);
      const dataArray = Array.isArray(result) ? result : result.data || [];
      setData(dataArray);
      setStats(statsResult);
    } catch (error) {
      console.error('Gagal fetch data SR:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchTerm, activeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-foreground">
          Service Request
        </h1>
        <p className="text-muted-foreground font-medium">
          Daftar seluruh tiket permintaan servis di sistem MiPSys.
        </p>
      </div>

      {stats && <SrStatsCards stats={stats} />}

      <SrFilterBar
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      <div className="paper-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/20">
                <th className="micro-label text-muted-foreground text-left p-5 pl-8">No. SR</th>
                <th className="micro-label text-muted-foreground text-left p-5">Pelanggan</th>
                <th className="micro-label text-muted-foreground text-left p-5">Model</th>
                <th className="micro-label text-muted-foreground text-left p-5">Serial</th>
                <th className="micro-label text-muted-foreground text-left p-5">Tipe</th>
                <th className="micro-label text-muted-foreground text-center p-5">Status</th>
                <th className="micro-label text-muted-foreground text-left p-5">Tanggal</th>
                <th className="micro-label text-muted-foreground text-right p-5 pr-8">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-32">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                      <p className="micro-label text-muted-foreground animate-pulse">
                        Memuat data...
                      </p>
                    </div>
                  </td>
                </tr>
               ) : data.length === 0 ? (
                 <tr>
                   <td colSpan={8} className="py-24">
                     <EmptyState
                       title="Belum ada tiket servis"
                       description="Tambahkan permintaan service pertama Anda untuk memulai."
                       actionLabel="Buat Permintaan Baru"
                       onAction={() => {
                         // Navigate to new service request form
                         // This would typically use useRouter or Link component
                         // For now, we'll just show the concept
                         console.log('Navigate to new SR form');
                       }}
                     />
                   </td>
                 </tr>
              ) : (
                data.map((sr) => {
                  const badge = statusBadge(sr.statusService);
                  return (
                    <tr key={sr.id} className="border-b border-border/10 hover:bg-card/50 transition-colors group">
                      <td className="p-5 pl-8">
                        <span className="font-bold text-foreground font-mono text-sm">{sr.ticketNumber}</span>
                      </td>
                      <td className="p-5 font-medium text-foreground/80">{sr.customerName}</td>
                      <td className="p-5 text-muted-foreground">{sr.modelName}</td>
                      <td className="p-5">
                        <code className="micro-label text-primary bg-primary/10 px-2 py-1 rounded-lg">
                          {sr.serialNumber || '-'}
                        </code>
                      </td>
                      <td className="p-5">
                        <span className="micro-label text-muted-foreground">{sr.serviceType}</span>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-5 text-xs text-muted-foreground font-mono">
                        {sr.incomingDate ? new Date(sr.incomingDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-5 pr-8 text-right">
                        <Link href={`/service-request/${sr.ticketNumber}`}>
                          <button className="px-4 py-2 rounded-xl bg-background/50 border border-border/20 text-muted-foreground hover:text-foreground hover:border-primary/30 text-[11px] font-bold tracking-wider transition-all flex items-center gap-2 ml-auto">
                            Detail <ExternalLink size={12} />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pb-8">
        <p className="micro-label text-muted-foreground">
          Menampilkan <span className="text-foreground">{data.length}</span> catatan
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="px-4 py-2 rounded-xl bg-card border border-border/20 text-muted-foreground disabled:opacity-30 hover:text-foreground text-[11px] font-bold tracking-wider transition-all"
          >
            Kembali
          </button>
          <div className="h-9 w-9 flex items-center justify-center command-strip text-white rounded-xl text-xs font-black shadow-lg">
            {page}
          </div>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={data.length < limit || isLoading}
            className="px-4 py-2 rounded-xl bg-card border border-border/20 text-muted-foreground disabled:opacity-30 hover:text-foreground text-[11px] font-bold tracking-wider transition-all"
          >
            Lanjut
          </button>
        </div>
      </div>
    </div>
  );
}
