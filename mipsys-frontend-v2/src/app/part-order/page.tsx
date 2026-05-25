'use client';

<<<<<<< HEAD
import React from 'react';
=======
import React, { useState, useMemo } from 'react';
>>>>>>> main
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  Search,
<<<<<<< HEAD
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
=======
  ArrowUpRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Pencil,
  RefreshCcw,
  Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { PageHeader } from '@/src/components/ui/page-header';
import { DataTable } from '@/src/components/ui/data-table';
import type { Column } from '@/src/components/ui/data-table';
import { PODetailModal } from '@/src/features/part-order/components/PODetailModal';
import { usePurchaseOrders } from '@/src/features/part-order/hooks/usePurchaseOrder';
import {
  PO_STATUS_LABEL,
  PO_STATUS_BADGE,
} from '@/src/features/part-order/types';
import type { PurchaseOrder, PoStatus } from '@/src/features/part-order/types';

const PENDING_STATUSES: PoStatus[] = [
  'DRAFT',
  'REQUESTED',
  'APPROVED',
  'ORDERED',
];

export default function PartOrderPage() {
  const router = useRouter();
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
          o.supplierName.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((o) => o.status === statusFilter);
    }
    return result;
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => PENDING_STATUSES.includes(o.status)).length,
      completed: orders.filter((o) => o.status === 'RECEIVED').length,
    }),
    [orders],
  );

  const statusFilters = [
    { value: 'ALL' as const, label: 'Semua' },
    ...Object.entries(PO_STATUS_LABEL).map(([key, label]) => ({
      value: key as PoStatus,
      label,
    })),
  ];

  const columns: Column<PurchaseOrder>[] = [
    {
      header: 'No. PO',
      cell: (order) => (
        <span className="font-bold text-foreground">{order.poNumber}</span>
      ),
    },
    {
      header: 'Supplier',
      cell: (order) => (
        <span className="font-bold text-muted-foreground">
          {order.supplierName}
        </span>
      ),
    },
    {
      header: 'Item',
      cell: (order) => (
        <span className="text-sm text-muted-foreground font-medium max-w-[200px] truncate block">
          {order.items
            ? order.items
                .map(
                  (i) =>
                    `${i.partName || `#${i.sparePartId}`} (x${i.quantity})`,
                )
                .join(', ')
            : '-'}
        </span>
      ),
    },
    {
      header: 'Model',
      cell: (order) => (
        <span className="text-sm text-muted-foreground font-medium max-w-[150px] truncate block">
          {order.items
            ? [
                ...new Set(order.items.map((i) => i.modelName).filter(Boolean)),
              ].join(', ') || '-'
            : '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      headerClassName: 'text-center',
      cell: (order) => (
        <div className="flex justify-center">
          <Badge
            className={`${PO_STATUS_BADGE[order.status]} border-none font-black text-[9px] px-3 uppercase tracking-tighter shadow-none`}
          >
            {PO_STATUS_LABEL[order.status]}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Total Estimasi',
      headerClassName: 'text-right',
      cell: (order) => (
        <span className="font-bold text-primary tracking-tight block text-right">
          Rp {parseFloat(order.totalAmount || '0').toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      header: 'Aksi',
      headerClassName: 'text-center',
      cell: (order) => (
        <div className="flex items-center justify-center gap-2">
          {order.status === 'DRAFT' && (
            <Link href={`/part-order/new?id=${order.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
                aria-label="Edit pesanan"
              >
                <Pencil size={18} aria-hidden="true" />
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedPoId(order.id)}
            className="h-10 w-10 rounded-xl hover:bg-muted hover:text-foreground"
            aria-label="Lihat detail pesanan"
          >
            <Eye size={18} aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Part Order Management"
        subtitle="Sistem pengadaan suku cadang dan pemesanan ke supplier."
      >
        <div className="flex gap-2">
          <Button
            onClick={refetch}
            variant="outline"
            className="h-12 w-12 p-0 rounded-2xl"
            aria-label="Muat ulang data"
          >
            <RefreshCcw
              size={18}
              className={isLoading ? 'motion-safe:animate-spin' : ''}
              aria-hidden="true"
            />
          </Button>
          <Link href="/part-order/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-6 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all flex gap-2 uppercase text-xs tracking-widest border-none">
              <Plus size={18} strokeWidth={3} /> Buat Order Baru
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Total Order',
            value: String(stats.total),
            icon: <ShoppingBag size={16} className="text-primary" />,
            subtitle: 'Semua pesanan',
          },
          {
            title: 'Pending',
            value: String(stats.pending).padStart(2, '0'),
            icon: <Clock size={16} className="text-amber-500" />,
            subtitle: 'Menunggu Proses',
          },
          {
            title: 'Selesai',
            value: String(stats.completed).padStart(2, '0'),
            icon: <CheckCircle2 size={16} className="text-emerald-500" />,
            subtitle: 'Barang Diterima',
          },
        ].map(({ title, value, icon, subtitle }) => (
          <Card
            key={title}
            className="border-none rounded-[2rem] shadow-sm hover:shadow-md transition-all group overflow-hidden bg-card"
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-muted/50 rounded-2xl group-hover:bg-primary/10 transition-colors text-foreground" aria-hidden="true">
                  {icon}
                </div>
                <ArrowUpRight size={14} className="text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {title}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-foreground">
                    {value}
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {subtitle}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-3 rounded-[2rem] border border-border/20 shadow-sm">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
            aria-hidden="true"
          />
          <Input
            placeholder="Cari nomor PO atau nama supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 border-none bg-muted/50 rounded-2xl font-bold focus-visible:ring-1 focus-visible:ring-primary text-foreground"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(({ value, label }) => (
            <Button
              key={value}
              variant={statusFilter === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(value)}
              className="rounded-2xl text-xs font-black tracking-wider"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        keyExtractor={(order) => order.id}
        isLoading={isLoading}
        headerTitle={
          <>
            <ShoppingBag size={16} aria-hidden="true" /> Daftar Pesanan Suku Cadang
          </>
        }
        footer={
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
            Menampilkan {filteredOrders.length} dari {orders.length} pesanan
          </p>
        }
        onRowClick={(order) => setSelectedPoId(order.id)}
      />

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
>>>>>>> main
