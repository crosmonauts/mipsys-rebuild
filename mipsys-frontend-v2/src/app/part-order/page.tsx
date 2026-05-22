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
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight uppercase">
            Part Order <span className="text-primary">Management</span>
          </h1>
          <p className="text-sm text-muted-foreground font-bold italic">
            &quot;Sistem pengadaan suku cadang dan pemesanan ke supplier.&quot;
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={refetch}
            variant="outline"
            className="h-12 w-12 p-0 rounded-2xl border-2 border-border/20 hover:bg-muted"
          >
            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Link href="/part-order/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-6 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all flex gap-2 uppercase text-xs tracking-widest border-none">
              <Plus size={18} strokeWidth={3} /> Buat Order Baru
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Order"
          value={String(stats.total)}
          icon={<ShoppingBag className="text-primary" />}
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

      <div className="flex flex-col md:flex-row gap-4 bg-card p-3 rounded-[2rem] border border-border/20 shadow-sm">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground"
            size={18}
          />
          <Input
            placeholder="Cari nomor PO atau nama supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 border-none bg-muted/50 rounded-xl font-bold focus-visible:ring-1 focus-visible:ring-primary text-foreground"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
              statusFilter === 'ALL'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border/20 hover:border-border'
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
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border/20 hover:border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-card">
        <CardHeader className="bg-card text-foreground p-6 border-b border-border/20">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <ShoppingBag size={16} /> Daftar Pesanan Suku Cadang
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-muted-foreground" size={32} />
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Memuat data pesanan...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <PackageOpen className="mx-auto mb-4 text-muted-foreground/50" size={40} />
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                {searchTerm || statusFilter !== 'ALL' ? 'Tidak ada hasil filter' : 'Belum ada purchase order'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border/10 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  <tr>
                    <th className="p-5 pl-8">No. PO</th>
                    <th className="p-5">Supplier</th>
                    <th className="p-5">Item</th>
                    <th className="p-5">Model</th>
                    <th className="p-5 text-center">Status</th>
                    <th className="p-5 text-right">Total Estimasi</th>
                    <th className="p-5 text-center pr-8">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => setSelectedPoId(order.id)} tabIndex={0} role="button" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPoId(order.id); } }}>
                      <td className="p-5 pl-8 font-bold text-foreground">
                        {order.poNumber}
                      </td>
                      <td className="p-5 font-bold text-muted-foreground">
                        {order.supplierName}
                      </td>
                        <td className="p-5 text-sm text-muted-foreground font-medium max-w-[200px] truncate">
                        {order.items
                          ? order.items.map((i) => `${i.partName || `#${i.sparePartId}`} (x${i.quantity})`).join(', ')
                          : '-'}
                      </td>
                      <td className="p-5 text-sm text-muted-foreground font-medium max-w-[150px] truncate">
                        {order.items
                          ? [...new Set(order.items.map((i) => i.modelName).filter(Boolean))].join(', ') || '-'
                          : '-'}
                      </td>
                      <td className="p-5 text-center">
                        <Badge className={`${PO_STATUS_BADGE[order.status]} border-none font-black text-[9px] px-3 uppercase tracking-tighter shadow-none`}>
                          {PO_STATUS_LABEL[order.status]}
                        </Badge>
                      </td>
                      <td className="p-5 text-right font-bold text-primary tracking-tight">
                        Rp {parseFloat(order.totalAmount || '0').toLocaleString('id-ID')}
                      </td>
                      <td className="p-5 text-center pr-8">
                        <div className="flex items-center justify-center gap-2">
                            {order.status === 'DRAFT' && (
                              <Link href={`/part-order/new?id=${order.id}`} onClick={(e) => e.stopPropagation()} aria-label="Edit part order">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                    className="h-10 w-10 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all border-2 border-transparent hover:border-primary"
                                >
                                  <Pencil size={18} />
                                </Button>
                              </Link>
                            )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPoId(order.id); }}
                            className="h-10 w-10 rounded-xl hover:bg-muted hover:text-foreground transition-all border-2 border-transparent hover:border-border bg-muted/50 text-muted-foreground"
                            title="Lihat Detail"
                            aria-label="Lihat detail part order"
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
          <div className="p-8 text-center bg-muted/30">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
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
    <Card className="border-none rounded-[2rem] shadow-sm hover:shadow-md transition-all group overflow-hidden bg-card">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="p-3 bg-muted/50 rounded-2xl group-hover:bg-primary/10 transition-colors text-foreground">
            {icon}
          </div>
          <ArrowUpRight size={18} className="text-muted-foreground" />
        </div>
        <div className="mt-4 space-y-0.5">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            <span className="text-[10px] font-bold text-muted-foreground">
              {subtitle}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
