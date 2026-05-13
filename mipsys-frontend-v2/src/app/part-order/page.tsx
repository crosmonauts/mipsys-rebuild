'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Pencil, // Hanya icon Pencil yang kita pakai
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';

export default function PartOrderPage() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 text-left">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black text-slate-950 tracking-tight uppercase">
            Part Order <span className="text-blue-700">Management</span>
          </h1>
          <p className="text-sm text-slate-500 font-bold italic">
            "Sistem pengadaan suku cadang dan pemesanan ke supplier."
          </p>
        </div>

        <Link href="/part-order/new">
          <Button className="bg-slate-950 hover:bg-blue-700 text-white font-black px-6 py-6 rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex gap-2 uppercase text-xs tracking-widest border-none">
            <Plus size={18} strokeWidth={3} /> Buat Order Baru
          </Button>
        </Link>
      </div>

      {/* 2. Stats Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Order"
          value="12"
          icon={<ShoppingBag className="text-blue-600" />}
          subtitle="Bulan ini"
        />
        <StatCard
          title="Pending"
          value="04"
          icon={<Clock className="text-amber-500" />}
          subtitle="Menunggu Konfirmasi"
        />
        <StatCard
          title="Selesai"
          value="08"
          icon={<CheckCircle2 className="text-emerald-500" />}
          subtitle="Barang Diterima"
        />
      </div>

      {/* 3. Filter & Search Bar Section */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-3 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-950"
            size={18}
          />
          <Input
            placeholder="Cari nomor PO atau nama supplier..."
            className="pl-12 h-12 border-none bg-slate-50/50 rounded-xl font-bold focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900"
          />
        </div>
        <Button
          variant="outline"
          className="h-12 rounded-xl border-2 border-slate-100 font-black flex gap-2 hover:bg-slate-50"
        >
          <Filter size={18} /> Filter Status
        </Button>
      </div>

      {/* 4. Main Table Section */}
      <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-950 text-white p-6">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <ShoppingBag size={16} /> Daftar Pesanan Suku Cadang
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b-2 border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="p-5 pl-8">No. PO</th>
                  <th className="p-5">Supplier</th>
                  <th className="p-5">Item</th>
                  <th className="p-5 text-center">Status</th>
                  <th className="p-5 text-right">Total Estimasi</th>
                  <th className="p-5 text-center pr-8">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-5 pl-8 font-black text-slate-950">
                    PO-2026-001
                  </td>
                  <td className="p-5 font-bold text-slate-700">
                    PT. Epson Indonesia
                  </td>
                  <td className="p-5 text-sm text-slate-500 font-medium">
                    Head L3210 (x2), Roller (x5)
                  </td>
                  <td className="p-5 text-center">
                    <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] px-3 uppercase tracking-tighter shadow-none">
                      Proses
                    </Badge>
                  </td>
                  <td className="p-5 text-right font-black text-blue-800 tracking-tight">
                    Rp 4.500.000
                  </td>
                  <td className="p-5 text-center pr-8">
                    <div className="flex items-center justify-center gap-2">
                      {/* Hanya Tombol Edit */}
                      <Link href="/part-order/edit/PO-2026-001">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-blue-600 hover:text-white transition-all border-2 border-transparent hover:border-blue-700"
                        >
                          <Pencil size={18} />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-8 text-center bg-slate-50/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              Menampilkan 1 dari 12 pesanan
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle }: any) {
  return (
    <Card className="border-none rounded-[2rem] shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors text-slate-950">
            {icon}
          </div>
          <ArrowUpRight size={18} className="text-slate-300" />
        </div>
        <div className="mt-4 space-y-0.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-950">{value}</h3>
            <span className="text-[10px] font-bold text-slate-500">
              {subtitle}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
