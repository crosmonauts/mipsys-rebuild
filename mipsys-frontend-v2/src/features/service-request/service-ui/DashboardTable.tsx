'use client';

import { useEffect, useState } from 'react';
import { srApi } from '../services/sr-api';
import { ServiceRequest } from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/src/components/ui/card';
import Link from 'next/link';
import {
  Search,
  Loader2,
  ExternalLink,
  ChevronLeft,
  Plus,
  ClipboardList,
} from 'lucide-react';

// HELPER: Logika Status Badge (Visual Mapping)
const getStatusConfig = (statusService: string, statusSystem: string) => {
  if (statusSystem === 'CLOSED') {
    return {
      label: 'Selesai',
      variant: 'secondary' as const,
      className: 'bg-slate-100 text-slate-500 border-none',
    };
  }

  switch (statusService) {
    case 'WAITING CHECK':
    case 'PENDING CHECK':
      return {
        label: 'Baru (Antre)',
        variant: 'default' as const,
        className: 'bg-slate-900 text-white hover:bg-slate-800',
      };

    case 'SERVICE':
    case 'IN SERVICE':
      return {
        label: 'Dikerjakan',
        variant: 'default' as const,
        className: 'bg-blue-600 text-white hover:bg-blue-700',
      };

    case 'WITH PART':
    case 'PENDING PART':
      return {
        label: 'Menunggu Part',
        variant: 'outline' as const,
        className: 'border-amber-500 text-amber-600 font-bold bg-amber-50',
      };

    case 'DONE':
    case 'READY':
      return {
        label: 'Siap Ambil',
        variant: 'default' as const,
        className:
          'bg-emerald-600 text-white animate-pulse hover:bg-emerald-700',
      };

    default:
      return {
        label: statusService || 'Unknown',
        variant: 'outline' as const,
        className: 'text-slate-500',
      };
  }
};

export function DashboardTable() {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchServiceRequests = async () => {
    try {
      setIsLoading(true);
      const result = await srApi.getAll(searchTerm, page, limit);
      const dataArray = Array.isArray(result) ? result : result.data || [];
      setData(dataArray);
    } catch (error) {
      console.error('Gagal fetch data SR:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRequests();
  }, [page, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. HEADER HALAMAN (BACK, JUDUL, TOMBOL BARU) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Service Request
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Daftar seluruh tiket permintaan servis yang terdaftar di sistem
            Mipsys.
          </p>
        </div>
      </div>

      {/* 2. SEKSI SEARCH BAR */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm max-w-2xl">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari pelanggan, model, atau No SR..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-11 h-12 border-none bg-transparent focus-visible:ring-0 text-base font-medium"
            />
          </div>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-10 font-bold"
          >
            Cari
          </Button>
          <Link href="/service-request/new">
            <Button className="bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl px-6 h-12 shadow-lg shadow-slate-900/10 transition-all flex gap-2">
              <Plus size={18} strokeWidth={3} />
              Buat SR Baru
            </Button>
          </Link>
        </form>
      </div>

      {/* 3. SEKSI TABEL UTAMA */}
      <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden rounded-[2rem] bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ClipboardList size={20} />
            </div>
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Daftar Antrean Servis Mipsys
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-black text-[11px] uppercase tracking-wider text-slate-400 pl-8">
                    No. SR
                  </TableHead>
                  <TableHead className="font-black text-[11px] uppercase tracking-wider text-slate-400">
                    Pelanggan
                  </TableHead>
                  <TableHead className="font-black text-[11px] uppercase tracking-wider text-slate-400">
                    Model Mesin
                  </TableHead>
                  <TableHead className="font-black text-[11px] uppercase tracking-wider text-blue-600/70">
                    Serial Number
                  </TableHead>
                  <TableHead className="font-black text-[11px] uppercase tracking-wider text-slate-400">
                    Mode
                  </TableHead>
                  <TableHead className="font-black text-[11px] uppercase tracking-wider text-slate-400 text-center">
                    Status
                  </TableHead>
                  <TableHead className="font-black text-[11px] uppercase tracking-wider text-slate-400">
                    Masuk
                  </TableHead>
                  <TableHead className="text-right font-black text-[11px] uppercase tracking-wider text-slate-400 pr-8">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-32">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500/20" />
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">
                          Menghubungkan ke Database...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-32 text-slate-400 font-medium italic"
                    >
                      Belum ada data permintaan servis yang terdaftar.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((sr) => {
                    const config = getStatusConfig(
                      sr.statusService,
                      sr.statusSystem,
                    );
                    return (
                      <TableRow
                        key={sr.id}
                        className="hover:bg-blue-50/30 transition-colors group border-slate-50"
                      >
                        <TableCell className="font-black text-slate-900 pl-8">
                          {sr.ticketNumber}
                        </TableCell>
                        <TableCell className="font-bold text-slate-700">
                          {sr.customerName}
                        </TableCell>
                        <TableCell className="text-slate-500 font-medium">
                          {sr.modelName}
                        </TableCell>
                        <TableCell>
                          <code className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100 font-bold shadow-sm">
                            {sr.serialNumber || '-'}
                          </code>
                        </TableCell>
                        <TableCell className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          {sr.serviceType}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`${config.className} rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-none`}
                          >
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs font-bold">
                          {new Date(sr.incomingDate).toLocaleDateString(
                            'id-ID',
                            {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            },
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Link href={`/service-request/${sr.ticketNumber}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl font-bold text-xs hover:bg-slate-900 hover:text-white transition-all gap-2"
                            >
                              Detail <ExternalLink size={14} />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 4. SEKSI PAGINASI */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 pb-10">
        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
          Menampilkan <span className="text-slate-900">{data.length}</span>{' '}
          catatan aktif
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold px-4 border-slate-200 hover:bg-white hover:text-blue-600 transition-all shadow-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Kembali
          </Button>
          <div className="h-9 w-9 flex items-center justify-center bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-900/20">
            {page}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold px-4 border-slate-200 hover:bg-white hover:text-blue-600 transition-all shadow-sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={data.length < limit || isLoading}
          >
            Lanjut
          </Button>
        </div>
      </div>
    </div>
  );
}
