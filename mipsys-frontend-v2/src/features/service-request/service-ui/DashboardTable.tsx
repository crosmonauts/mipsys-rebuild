'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx'; // Import library Excel
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
import {
  Search,
  Loader2,
  ExternalLink,
  Plus,
  ClipboardList,
  FileDown, // Icon untuk Export
  FileText,
} from 'lucide-react';

// HELPER: Logika Status Badge (Visual Mapping)
const getStatusConfig = (statusService: string, statusSystem: string) => {
  if (statusSystem === 'CLOSED') {
    return {
      label: 'Selesai',
      className: 'bg-slate-100 text-slate-500 border-none',
    };
  }

  switch (statusService) {
    case 'WAITING CHECK':
    case 'PENDING CHECK':
      return {
        label: 'Baru (Antre)',
        className: 'bg-slate-900 text-white hover:bg-slate-800',
      };
    case 'SERVICE':
    case 'IN SERVICE':
      return {
        label: 'Dikerjakan',
        className: 'bg-blue-600 text-white hover:bg-blue-700',
      };
    case 'WITH PART':
    case 'PENDING PART':
      return {
        label: 'Menunggu Part',
        className: 'border-amber-500 text-amber-600 font-bold bg-amber-50',
      };
    case 'DONE':
    case 'READY':
      return {
        label: 'Siap Ambil',
        className:
          'bg-emerald-600 text-white animate-pulse hover:bg-emerald-700',
      };
    default:
      return {
        label: statusService || 'Unknown',
        className: 'text-slate-500',
      };
  }
};

export function DashboardTable() {
  // --- STATE MANAGEMENT ---
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // --- DATA FETCHING ---
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

  // --- LOGIKA EXPORT EXCEL ---
  const handleExportExcel = async () => {
    try {
      setIsLoading(true);
      // Tips: Menarik data tanpa limit agar semua record ter-export (sesuaikan dengan API kamu)
      const result: any = await srApi.getAll(searchTerm, 1, 9999);
      const allData: ServiceRequest[] = Array.isArray(result)
        ? result
        : result.data || [];

      if (allData.length === 0) {
        alert('Tidak ada data untuk diekspor');
        return;
      }

      // Mapping data agar sesuai dengan kolom Excel yang kamu minta
      const excelData = allData.map((item) => ({
        'No. SR': item.ticketNumber,
        'Nama Pelanggan': item.customerName || '-',
        'Model Mesin': item.modelName || '-',
        'Serial Number': item.serialNumber || '-',
        'Status Servis': item.statusService || '-',
        Teknisi: item.technicianCheckId || '-', // Nanti tinggal sesuaikan field teknisi dari API
        'Analisa Teknisi': item.remarksHistory || '-',
        'Daftar Part': item.parts?.map((p) => p.partName).join(', ') || '-',
        'Total Biaya': Number(item.serviceFee || 0) + Number(item.partFee || 0),
        'Tanggal Masuk': item.incomingDate
          ? new Date(item.incomingDate).toLocaleDateString('id-ID')
          : '-',
      }));

      // Proses pembuatan file Excel
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Lengkap_SR');

      // Trigger download
      XLSX.writeFile(
        workbook,
        `Mipsys_SR_Report_${new Date().toISOString().split('T')[0]}.xlsx`,
      );
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengeksport data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* 1. SEKSI HEADER & ACTION (Export & Create) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-slate-950 tracking-tight">
            Dashboard <span className="text-blue-700">Service Request</span>
          </h2>
          <p className="text-sm text-slate-500 font-bold italic">
            "Sistem monitoring antrean servis Mipsys Enterprise."
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Tombol Export - WCAG AAA High Contrast */}
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="flex-1 md:flex-none h-12 px-6 border-2 border-slate-950 text-slate-950 font-black text-xs uppercase rounded-xl hover:bg-slate-100 transition-all flex gap-2"
          >
            <FileDown size={18} aria-hidden="true" /> Export Excel
          </Button>

          <Link href="/service-request/new" className="flex-1 md:flex-none">
            <Button className="w-full h-12 px-6 bg-slate-950 text-white font-black text-xs uppercase rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-slate-900/10 flex gap-2">
              <Plus size={18} strokeWidth={3} aria-hidden="true" /> Buat SR Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. SEKSI SEARCH BAR */}
      <div className="bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-sm max-w-2xl">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-950"
              aria-hidden="true"
            />
            <Input
              placeholder="Cari pelanggan, model mesin, atau No SR..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-12 h-12 border-none bg-transparent focus-visible:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <Button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-8 h-10 font-black text-xs uppercase tracking-wider shadow-md"
          >
            Cari
          </Button>
        </form>
      </div>

      {/* 3. SEKSI TABEL UTAMA */}
      <Card className="border-2 border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden rounded-[2.5rem] bg-white">
        <CardHeader className="bg-slate-50 border-b-2 border-slate-100 py-6 px-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950 text-white rounded-xl">
              <ClipboardList size={20} />
            </div>
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              Daftar Antrean Aktif
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-900 pl-8 py-5">
                    No. SR
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-900">
                    Pelanggan
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-900">
                    Model Mesin
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-blue-800">
                    Serial Number
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-900 text-center">
                    Status
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-900">
                    Masuk
                  </TableHead>
                  <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-slate-900 pr-8">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-32">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        <p className="text-slate-900 text-xs font-black uppercase tracking-widest animate-pulse">
                          Menyinkronkan Database...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-32 text-slate-500 font-black uppercase text-[10px] tracking-widest italic"
                    >
                      Belum ada data permintaan servis.
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
                        className="hover:bg-blue-50/50 transition-colors border-slate-100"
                      >
                        <TableCell className="font-black text-slate-950 pl-8">
                          {sr.ticketNumber}
                        </TableCell>
                        <TableCell className="font-bold text-slate-800">
                          {sr.customerName}
                        </TableCell>
                        <TableCell className="text-slate-600 font-bold">
                          {sr.modelName}
                        </TableCell>
                        <TableCell>
                          <code className="text-[10px] bg-blue-50 text-blue-900 px-2 py-1 rounded-md border-2 border-blue-100 font-black">
                            {sr.serialNumber || '-'}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`${config.className} rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-none`}
                          >
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs font-black">
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
                              className="rounded-xl font-black text-[10px] uppercase hover:bg-slate-950 hover:text-white transition-all gap-2 border-2 border-transparent hover:border-slate-950"
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
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 pb-12">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 rounded-lg">
            <FileText size={14} className="text-slate-500" />
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            Menampilkan <span className="text-slate-950">{data.length}</span>{' '}
            Catatan aktif
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl font-black text-[10px] uppercase px-6 border-2 border-slate-300 hover:border-slate-950 transition-all shadow-sm disabled:opacity-30"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Kembali
          </Button>
          <div className="h-10 w-10 flex items-center justify-center bg-slate-950 text-white rounded-2xl text-xs font-black shadow-xl">
            {page}
          </div>
          <Button
            variant="outline"
            className="rounded-xl font-black text-[10px] uppercase px-6 border-2 border-slate-300 hover:border-slate-950 transition-all shadow-sm disabled:opacity-30"
            onClick={() => setPage((p) => p + 1)}
            disabled={data.length < limit || isLoading}
          >
            Lanjut
          </Button>
        </div>
      </footer>
    </div>
  );
}
