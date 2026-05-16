'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Pencil,
  AlertCircle,
  XCircle,
  RefreshCcw,
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
import { usePurchaseOrders, useUpdatePurchaseOrderStatus } from '@/src/features/part-order/hooks/usePurchaseOrder';
import { PurchaseOrder } from '@/src/features/part-order/api/po-api';

export default function PartOrderPage() {
  const { data: orders, isLoading, refetch } = usePurchaseOrders();
  const { updateStatus } = useUpdatePurchaseOrderStatus();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredOrders = orders.filter((order: PurchaseOrder) => {
    const matchesSearch =
      order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o: PurchaseOrder) => o.status === 'PENDING').length,
    selesai: orders.filter((o: PurchaseOrder) => o.status === 'SELESAI').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] px-3 uppercase tracking-tighter shadow-none">Pending</Badge>;
      case 'PROSES':
        return <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[9px] px-3 uppercase tracking-tighter shadow-none">Proses</Badge>;
      case 'SELESAI':
        return <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[9px] px-3 uppercase tracking-tighter shadow-none">Selesai</Badge>;
      case 'BATAL':
        return <Badge className="bg-red-100 text-red-700 border-none font-black text-[9px] px-3 uppercase tracking-tighter shadow-none">Batal</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-none font-black text-[9px] px-3 uppercase tracking-tighter shadow-none">{status}</Badge>;
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    await updateStatus(id, newStatus);
    refetch();
  };

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

        <div className="flex gap-2">
          <Button
            onClick={refetch}
            variant="outline"
            className="h-12 w-12 p-0 rounded-2xl border-2 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Link href="/part-order/new">
            <Button className="bg-slate-950 hover:bg-blue-700 text-white font-black px-6 py-6 rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex gap-2 uppercase text-xs tracking-widest border-none">
              <Plus size={18} strokeWidth={3} /> Buat Order Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Stats Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Order"
          value={String(stats.total)}
          icon={<ShoppingBag className="text-blue-600" />}
          subtitle="Semua pesanan"
        />
        <StatCard
          title="Pending"
          value={String(stats.pending).padStart(2, '0')}
          icon={<Clock className="text-amber-500" />}
          subtitle="Menunggu Konfirmasi"
        />
        <StatCard
          title="Selesai"
          value={String(stats.selesai).padStart(2, '0')}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 border-none bg-slate-50/50 rounded-xl font-bold focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'PROSES', 'SELESAI', 'BATAL'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                statusFilter === status
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {status === 'ALL' ? 'Semua' : status}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Table Section */}
      <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-950 text-white p-6">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <ShoppingBag size={16} /> Daftar Pesanan Suku Cadang
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCcw className="animate-spin mx-auto mb-4 text-slate-400" size={32} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Memuat data pesanan...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tidak ada pesanan ditemukan.</p>
            </div>
          ) : (
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
                  {filteredOrders.map((order: PurchaseOrder) => (
                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-5 pl-8 font-black text-slate-950">
                        {order.poNumber}
                      </td>
                      <td className="p-5 font-bold text-slate-700">
                        {order.supplier}
                      </td>
                      <td className="p-5 text-sm text-slate-500 font-medium">
                        {order.items.map((item) => `${item.partName} (x${item.qty})`).join(', ')}
                      </td>
                      <td className="p-5 text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="p-5 text-right font-black text-blue-800 tracking-tight">
                        Rp {order.totalEstimation.toLocaleString('id-ID')}
                      </td>
                      <td className="p-5 text-center pr-8">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/part-order/new?id=${order.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-blue-600 hover:text-white transition-all border-2 border-transparent hover:border-blue-700"
                            >
                              <Pencil size={18} />
                            </Button>
                          </Link>
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'PROSES')}
                              className="h-10 w-10 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border-2 border-transparent hover:border-emerald-700 bg-slate-50 text-slate-500"
                              title="Mark as Proses"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          )}
                          {order.status !== 'BATAL' && order.status !== 'SELESAI' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'BATAL')}
                              className="h-10 w-10 rounded-xl hover:bg-red-600 hover:text-white transition-all border-2 border-transparent hover:border-red-700 bg-slate-50 text-slate-500"
                              title="Cancel Order"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-8 text-center bg-slate-50/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              Menampilkan {filteredOrders.length} dari {orders.length} pesanan
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle }: { title: string; value: string; icon: React.ReactNode; subtitle: string }) {
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
