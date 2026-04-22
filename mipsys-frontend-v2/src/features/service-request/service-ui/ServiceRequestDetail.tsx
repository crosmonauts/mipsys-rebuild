'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  ArrowLeft,
  Printer,
  Stethoscope,
  User,
  Smartphone,
  MapPin,
  Printer as PrinterIcon,
  AlertCircle,
  Loader2,
  Wrench,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { srApi } from '../services/sr-api';
import { DiagnosisModal } from './DiagnosisModal';
import { ServiceRequest } from '../types';

interface ServiceRequestDetailProps {
  id: string; // Ticket Number dari URL
}

export default function ServiceRequestDetail({
  id,
}: ServiceRequestDetailProps) {
  const [data, setData] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDiagnosisOpen, setIsDiagnosisOpen] = useState(false);

  // --- 1. LOGIKA TARIK DATA ---
  const fetchTicketDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await srApi.getOne(id);
      setData(response || null);
    } catch (error: any) {
      console.error('Gagal menarik data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchTicketDetail();
  }, [id, fetchTicketDetail]);

  // --- 2. HELPER UI ---
  const isChecked = !['WAITING CHECK', 'PENDING CHECK', 'OPEN'].includes(
    data?.statusService?.toUpperCase() || '',
  );

  const canDiagnose = [
    'WAITING CHECK',
    'PENDING CHECK',
    'OPEN',
    'SERVICE',
  ].includes(data?.statusService?.toUpperCase() || '');

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'WAITING CHECK':
        return 'bg-blue-600 hover:bg-blue-600';
      case 'PENDING CHECK':
        return 'bg-orange-500 hover:bg-orange-500';
      case 'SERVICE':
        return 'bg-indigo-600 hover:bg-indigo-600';
      case 'DONE':
        return 'bg-green-600 hover:bg-green-600';
      case 'CANCEL':
        return 'bg-red-600 hover:bg-red-600';
      default:
        return 'bg-slate-500 hover:bg-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">
          Menghubungkan ke Server MIP...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-10 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <p className="text-slate-500 italic">
          Tiket tidak ditemukan di database.
        </p>
        <Link
          href="/service-request"
          className="text-blue-600 font-bold underline mt-4 block"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border shadow-sm gap-4 text-left">
        <div className="space-y-1">
          <Link
            href="/service-request"
            className="text-xs font-bold text-slate-400 flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={14} /> KEMBALI KE DASHBOARD
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">
              {data.ticketNumber}
            </h1>
            <Badge
              className={`${getStatusColor(data.statusService)} text-white border-none px-3 py-1 text-[10px] font-bold uppercase`}
            >
              {data.statusService}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Diterima pada:{' '}
            {new Date(data.incomingDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {canDiagnose && (
            <Button
              onClick={() => setIsDiagnosisOpen(true)}
              className="bg-[#0f172a] hover:bg-slate-800 text-white gap-2 flex-1 md:flex-none h-10 shadow-lg shadow-slate-200"
            >
              <Stethoscope size={18} /> Isi Diagnosa
            </Button>
          )}
          <Button variant="outline" size="icon" className="shrink-0 h-10 w-10">
            <Printer size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KOLOM KIRI: PELANGGAN & GARANSI */}
        <div className="space-y-6">
          <Card className="border shadow-sm bg-white overflow-hidden text-left">
            <CardHeader className="bg-slate-50/50 border-b py-3">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Informasi Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Nama Customer
                </label>
                <p className="font-bold text-slate-800 flex items-center gap-2 capitalize">
                  <User size={14} className="text-blue-500" />{' '}
                  {data.customerName}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Kontak
                </label>
                <p className="font-medium text-slate-700 flex items-center gap-2">
                  <Smartphone size={14} className="text-blue-500" />{' '}
                  {data.customerPhone}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Alamat
                </label>
                <p className="text-sm text-slate-600 flex items-start gap-2 leading-relaxed">
                  <MapPin size={14} className="text-blue-500 mt-1 shrink-0" />{' '}
                  {data.customerAddress}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-900 text-white p-6 rounded-xl shadow-xl shadow-blue-100 relative overflow-hidden text-left">
            <div className="relative z-10">
              <p className="text-[10px] font-bold opacity-60 uppercase mb-1">
                Tipe Servis
              </p>
              <h2 className="text-2xl font-black tracking-tighter uppercase">
                {data.serviceType}
              </h2>
              <p className="text-[10px] opacity-80 mt-4 italic font-medium">
                Mode: Carry-In Service
              </p>
            </div>
            <PrinterIcon className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
          </div>
        </div>

        {/* KOLOM KANAN: UNIT & HASIL PEMERIKSAAN */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border shadow-sm bg-white overflow-hidden text-left">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-6 space-y-6 border-r border-slate-100">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    Unit Perangkat
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Model Mesin
                      </label>
                      <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                        {data.modelName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Serial Number
                      </label>
                      <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono text-sm font-bold w-fit uppercase border border-blue-100">
                        {data.serialNumber}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-red-50/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={14} className="text-red-500" />
                    <label className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                      Keluhan Awal
                    </label>
                  </div>
                  <p className="text-lg font-bold text-red-700 leading-tight italic">
                    "{data.problemDescription}"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION HASIL DIAGNOSA DINAMIS */}
          <Card className="border shadow-sm bg-white overflow-hidden text-left">
            <CardHeader className="bg-slate-50/50 border-b py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Hasil Pemeriksaan Teknisi
              </CardTitle>
              {isChecked && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[9px] font-black">
                  SUDAH DICEK
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {!isChecked ? (
                <div className="py-10 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-100 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <Stethoscope size={24} />
                  </div>
                  <div className="max-w-xs">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Unit menunggu antrean pengecekan. Silakan klik tombol{' '}
                      <b>Isi Diagnosa</b> untuk memperbarui laporan.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Bagian Analisa Teknis */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
                    <div className="absolute right-4 top-4 text-slate-200">
                      <Wrench size={40} />
                    </div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      Analisa & Tindakan Akhir
                    </label>
                    <p className="text-sm text-slate-700 leading-relaxed font-semibold relative z-10">
                      {data.problemDescription ||
                        'Teknisi belum memberikan catatan detail.'}
                    </p>
                  </div>

                  {/* Rincian Biaya */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Biaya Part
                      </label>
                      <p className="text-xl font-black text-slate-900">
                        <span className="text-xs text-blue-600 mr-1">Rp</span>
                        {Number(data.partFee).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Jasa Servis
                      </label>
                      <p className="text-xl font-black text-slate-900">
                        <span className="text-xs text-blue-600 mr-1">Rp</span>
                        {Number(data.serviceFee).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Estimasi Total Tagihan */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Receipt size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Total Estimasi Biaya
                        </p>
                        <p className="text-3xl font-black text-blue-600 tracking-tighter">
                          Rp{' '}
                          {(
                            Number(data.partFee) + Number(data.serviceFee)
                          ).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black text-amber-700 uppercase">
                        Menunggu Pembayaran Kasir
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL INTEGRASI */}
      <DiagnosisModal
        sr={data}
        isOpen={isDiagnosisOpen}
        onClose={() => setIsDiagnosisOpen(false)}
        onSuccess={() => {
          setIsDiagnosisOpen(false);
          fetchTicketDetail();
        }}
      />
    </div>
  );
}
