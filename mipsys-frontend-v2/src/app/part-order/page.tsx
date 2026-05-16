'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  Search,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Pencil,
  RefreshCcw,
  Loader2,
  PackageOpen,
  Eye,
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
import { PODetailModal } from '@/src/features/part-order/components/PODetailModal';
import { usePurchaseOrders } from '@/src/features/part-order/hooks/usePurchaseOrder';
import { PO_STATUS_LABEL, PO_STATUS_BADGE } from '@/src/features/part-order/types';
import type { PurchaseOrder, PoStatus } from '@/src/features/part-order/types';

const PENDING_STATUSES: PoStatus[] = ['DRAFT', 'REQUESTED', 'APPROVED', 'ORDERED'];

export default function PartOrderPage() {
  const { data: orders, isLoading, refetch } = usePurchaseOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PoStatus | 'ALL'>('ALL');
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.poNumber.toLowerCase().includes(q) ||
          o.supplierName.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((o) => o.status === statusFilter);
    }
    return result;
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => PENDING_STATUSES.includes(o.status)).length,
    completed: orders.filter((o) => o.status === 'RECEIVED').length,
  }), [orders]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black text-slate-950 tracking-tight uppercase">
            Part Order <span className="text-blue-700">Management</span>
          </h1>
          <p className="text-sm text-slate-500 font-bold italic">
            &quot;Sistem pengadaan suku cadang dan pemesanan ke supplier.&quot;
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
          subtitle="Menunggu Proses"
        />
        <StatCard
          title="Selesai"
          value={String(stats.completed).padStart(2, '0')}
          icon={<CheckCircle2 className="text-emerald-500" />}
          subtitle="Barang Diterima"
        />
      </div>

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
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-950 text-white border-slate-950'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            Semua
          </button>
          {Object.entries(PO_STATUS_LABEL).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as PoStatus)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                statusFilter === key
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-950 text-white p-6">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <ShoppingBag size={16} /> Daftar Pesanan Suku Cadang
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-slate-400" size={32} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Memuat data pesanan...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <PackageOpen className="mx-auto mb-4 text-slate-300" size={40} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {searchTerm || statusFilter !== 'ALL' ? 'Tidak ada hasil filter' : 'Belum ada purchase order'}
              </p>
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
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedPoId(order.id)}>
                      <td className="p-5 pl-8 font-black text-slate-950">
                        {order.poNumber}
                      </td>
                      <td className="p-5 font-bold text-slate-700">
                        {order.supplierName}
                      </td>
                      <td className="p-5 text-sm text-slate-500 font-medium max-w-[200px] truncate">
                        {order.items
                          ? order.items.map((i) => `${i.partName || `#${i.sparePartId}`} (x${i.quantity})`).join(', ')
                          : '-'}
                      </td>
                      <td className="p-5 text-center">
                        <Badge className={`${PO_STATUS_BADGE[order.status]} border-none font-black text-[9px] px-3 uppercase tracking-tighter shadow-none`}>
                          {PO_STATUS_LABEL[order.status]}
                        </Badge>
                      </td>
                      <td className="p-5 text-right font-black text-blue-800 tracking-tight">
                        Rp {parseFloat(order.totalAmount || '0').toLocaleString('id-ID')}
                      </td>
                      <td className="p-5 text-center pr-8">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/part-order/new?id=${order.id}`} onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-blue-600 hover:text-white transition-all border-2 border-transparent hover:border-blue-700"
                            >
                              <Pencil size={18} />
                            </Button>
                          </Link>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPoId(order.id); }}
                            className="h-10 w-10 rounded-xl hover:bg-slate-600 hover:text-white transition-all border-2 border-transparent hover:border-slate-700 bg-slate-50 text-slate-500"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </button>
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
      {selectedPoId && (
        <PODetailModal
          poId={selectedPoId}
          onClose={() => setSelectedPoId(null)}
          onRefresh={refetch}
        />
      )}
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
