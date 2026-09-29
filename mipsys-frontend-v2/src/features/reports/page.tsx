'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PageHeader } from '@/src/components/ui/page-header';
import { ReportTable } from './components/ReportTable';
import type { ReportColumn } from './components/ReportTable';
import { useAuth } from '@/src/lib/auth-context';
import { reportsApi } from './api/reports-api';
import type {
  InventoryValuation,
  ReceivableAging,
  ReportPeriod,
  ServiceSummary,
  StockCard,
} from './api/reports-api';

type TabKey =
  | 'service'
  | 'technician'
  | 'model'
  | 'valuation'
  | 'low-stock'
  | 'stock-card'
  | 'receivable';

/** Bentuk baris generik lintas laporan; kunci turunan dihitung saat pemuatan. */
type ReportRow = Record<string, unknown> & {
  id?: number;
  customerName?: string;
  modelName?: string;
  techName?: string;
  partCode?: string | null;
};

/**
 * Menyamakan baris laporan antar endpoint. Tipe antarmuka tidak
 * memiliki index signature, jadi konversi dilakukan di satu tempat.
 */
function toRows<T extends object>(items: T[]): ReportRow[] {
  return items as unknown as ReportRow[];
}

type ReportResult =
  | { data: ReportRow[]; summary: ServiceSummary | null }
  | { data: ReportRow[]; valuation: InventoryValuation }
  | { data: ReportRow[]; aging: ReceivableAging }
  | { data: ReportRow[]; stockCard: StockCard };

const TABS: { key: TabKey; label: string }[] = [
  { key: 'service', label: 'Layanan Servis' },
  { key: 'technician', label: 'Kinerja Teknisi' },
  { key: 'model', label: 'Popularitas Model' },
  { key: 'valuation', label: 'Valuasi Stok' },
  { key: 'low-stock', label: 'Stok Menipis' },
  { key: 'stock-card', label: 'Kartu Stok' },
  { key: 'receivable', label: 'Umur Piutang' },
];

const PERIOD_TABS: TabKey[] = ['service', 'technician', 'model'];

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function isoDay(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

function errorMessage(error: unknown): string {
  const data = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data;
  if (!data?.message) return 'Gagal memuat laporan';
  return Array.isArray(data.message) ? data.message.join(', ') : data.message;
}

export function ReportsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [tab, setTab] = useState<TabKey>('service');
  const [startDate, setStartDate] = useState(() => isoDay(30));
  const [endDate, setEndDate] = useState(() => isoDay(0));
  const [partId, setPartId] = useState('');
  const [data, setData] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<ServiceSummary | null>(null);
  const [valuation, setValuation] = useState<InventoryValuation | null>(null);
  const [aging, setAging] = useState<ReceivableAging | null>(null);
  const [stockCard, setStockCard] = useState<StockCard | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      toast.error('Halaman laporan hanya untuk admin');
      router.replace('/');
    }
  }, [isLoading, user, isAdmin, router]);

  const period = useMemo<ReportPeriod>(
    () => ({ startDate, endDate }),
    [startDate, endDate],
  );

  /**
   * Pengambilan data murni (tanpa setState) agar pemanggilan berada di
   * promise chain, mengikuti pola data fetching yang dipakai repo ini.
   */
  const fetchReport = useCallback(async (): Promise<ReportResult> => {
    switch (tab) {
      case 'service': {
        const summary = await reportsApi.getServiceSummary(period);
        return {
          summary,
          data: toRows(
            summary.byStatus.map((row) => ({
              ...row,
              total: Number(row.serviceFee) + Number(row.partFee),
            })),
          ),
        };
      }
      case 'technician': {
        const rows = await reportsApi.getTechnicianPerformance(period);
        return {
          summary: null,
          data: toRows(
            rows.map((row) => ({
              ...row,
              rate:
                Number(row.requestCount) > 0
                  ? Number(row.completedCount) / Number(row.requestCount)
                  : 0,
            })),
          ),
        };
      }
      case 'model':
        return {
          summary: null,
          data: toRows(await reportsApi.getModelPopularity(period)),
        };
      case 'valuation': {
        const valuation = await reportsApi.getValuation();
        return { valuation, data: toRows(valuation.items) };
      }
      case 'low-stock':
        return { summary: null, data: toRows(await reportsApi.getLowStock()) };
      case 'stock-card': {
        const id = Number(partId);
        if (!id) {
          const stockCard: StockCard = {
            part: { id: 0, partCode: null, partName: '', stock: 0 },
            opening: 0,
            closing: 0,
            rows: [],
          };
          return { stockCard, data: [] };
        }
        const stockCard = await reportsApi.getStockCard(id, period);
        return { stockCard, data: toRows(stockCard.rows) };
      }
      case 'receivable': {
        const aging = await reportsApi.getReceivableAging();
        return { aging, data: toRows(aging.rows) };
      }
    }
  }, [tab, period, partId]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    fetchReport()
      .then((result) => {
        if (!active) return;
        setData(result.data);
        if ('summary' in result) setSummary(result.summary);
        if ('valuation' in result) setValuation(result.valuation);
        if ('aging' in result) setAging(result.aging);
        if ('stockCard' in result) setStockCard(result.stockCard);
      })
      .catch((error: unknown) => {
        if (!active) return;
        toast.error(errorMessage(error));
        setData([]);
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [isAdmin, fetchReport]);

  function changeTab(next: TabKey) {
    setLoadingData(true);
    setTab(next);
  }

  function changePeriod(nextStart: string, nextEnd: string) {
    setLoadingData(true);
    if (nextStart) setStartDate(nextStart);
    if (nextEnd) setEndDate(nextEnd);
  }

  function changePartId(value: string) {
    setLoadingData(true);
    setPartId(value);
  }

  async function handleExport() {
    setExporting(true);
    try {
      switch (tab) {
        case 'service':
          await reportsApi.exportServiceSummary(period);
          break;
        case 'technician':
          await reportsApi.exportTechnicians(period);
          break;
        case 'model':
          await reportsApi.exportModels(period);
          break;
        case 'valuation':
          await reportsApi.exportValuation();
          break;
        case 'low-stock':
          await reportsApi.exportLowStock();
          break;
        case 'stock-card':
          await reportsApi.exportStockCard(Number(partId), period);
          break;
        case 'receivable':
          await reportsApi.exportReceivableAging();
          break;
      }
      toast.success('Laporan Excel berhasil diunduh');
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      toast.error(
        status === 429
          ? 'Terlalu sering mengunduh. Tunggu 1 menit sebelum mencoba lagi.'
          : 'Gagal mengunduh laporan Excel',
      );
    } finally {
      setExporting(false);
    }
  }

  const needsPeriod = PERIOD_TABS.includes(tab) || tab === 'stock-card';
  const canExport =
    tab === 'stock-card'
      ? Boolean(partId) && stockCard !== null
      : data.length > 0;

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader title="Laporan" />
        <p className="text-sm text-[var(--muted-foreground)]">
          Memverifikasi akses…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Laporan" />

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Jenis laporan"
      >
        {TABS.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => changeTab(item.key)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all motion-safe:active:scale-95 ${
              tab === item.key
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'border border-border text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {needsPeriod && (
          <>
            <label className="flex flex-col gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Dari
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => changePeriod(e.target.value, endDate)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-[var(--foreground)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Sampai
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => changePeriod(startDate, e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-[var(--foreground)]"
              />
            </label>
          </>
        )}

        {tab === 'stock-card' && (
          <label className="flex flex-col gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            ID Part
            <input
              type="number"
              min={1}
              value={partId}
              onChange={(e) => changePartId(e.target.value)}
              placeholder="mis. 5"
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-[var(--foreground)]"
            />
          </label>
        )}
      </div>

      <ReportTable<ReportRow>
        title={TABS.find((item) => item.key === tab)?.label ?? 'Laporan'}
        columns={buildColumns(tab)}
        data={data}
        rowKey={(row, index) => {
          const key = row.id ?? row.customerName ?? row.modelName ?? row.techName ?? row.partCode;
          return typeof key === 'string' || typeof key === 'number' ? key : index;
        }}
        isLoading={loadingData}
        isEmpty={!loadingData}
        onExport={canExport ? handleExport : undefined}
        isExporting={exporting}
        summary={buildSummary(tab, summary, valuation, aging, stockCard, startDate, endDate)}
      />
    </div>
  );
}

function buildColumns(tab: TabKey): ReportColumn<ReportRow>[] {
  switch (tab) {
    case 'service':
      return [
        { key: 'label', header: 'Status' },
        { key: 'count', header: 'Jumlah Unit', type: 'integer', total: true },
        { key: 'serviceFee', header: 'Biaya Servis', type: 'currency', total: true },
        { key: 'partFee', header: 'Biaya Part', type: 'currency', total: true },
        { key: 'total', header: 'Total', type: 'currency', total: true },
      ];
    case 'technician':
      return [
        { key: 'techName', header: 'Nama Teknisi' },
        { key: 'requestCount', header: 'Unit Ditangani', type: 'integer', total: true },
        { key: 'completedCount', header: 'Unit Selesai', type: 'integer', total: true },
        { key: 'avgDays', header: 'Rata-rata Durasi (hari)', type: 'number' },
        { key: 'rate', header: 'Penyelesaian', type: 'percent' },
      ];
    case 'model':
      return [
        { key: 'modelName', header: 'Model Unit' },
        { key: 'unitCount', header: 'Jumlah Unit', type: 'integer', total: true },
      ];
    case 'valuation':
      return [
        { key: 'partCode', header: 'Kode Part', align: 'center' },
        { key: 'partName', header: 'Nama Part' },
        { key: 'stock', header: 'Stok', type: 'integer', total: true },
        { key: 'price', header: 'Harga Satuan', type: 'currency' },
        { key: 'value', header: 'Nilai Persediaan', type: 'currency', total: true },
      ];
    case 'low-stock':
      return [
        { key: 'partCode', header: 'Kode Part', align: 'center' },
        { key: 'partName', header: 'Nama Part' },
        { key: 'location', header: 'Lokasi', align: 'center' },
        { key: 'stock', header: 'Stok', type: 'integer', total: true },
        { key: 'minStock', header: 'Stok Minimum', type: 'integer' },
        { key: 'shortage', header: 'Kekurangan', type: 'integer', total: true },
      ];
    case 'stock-card':
      return [
        { key: 'date', header: 'Tanggal', type: 'date' },
        { key: 'movementType', header: 'Jenis Mutasi' },
        { key: 'referenceId', header: 'Referensi', align: 'center' },
        { key: 'notes', header: 'Keterangan' },
        { key: 'in', header: 'Masuk', type: 'integer', total: true },
        { key: 'out', header: 'Keluar', type: 'integer', total: true },
        { key: 'balance', header: 'Saldo', type: 'integer' },
      ];
    case 'receivable':
      return [
        { key: 'customerName', header: 'Pelanggan' },
        { key: 'invoiceCount', header: 'Jumlah Invoice', type: 'integer', total: true },
        { key: 'current', header: '0-30 Hari', type: 'currency', total: true },
        { key: 'd31to60', header: '31-60 Hari', type: 'currency', total: true },
        { key: 'd61to90', header: '61-90 Hari', type: 'currency', total: true },
        { key: 'over90', header: '> 90 Hari', type: 'currency', total: true },
        { key: 'total', header: 'Total Tagihan', type: 'currency', total: true },
        { key: 'maxDays', header: 'Umur Tertua', type: 'integer', align: 'center' },
      ];
    default:
      return [];
  }
}

function buildSummary(
  tab: TabKey,
  summary: ServiceSummary | null,
  valuation: InventoryValuation | null,
  aging: ReceivableAging | null,
  stockCard: StockCard | null,
  startDate: string,
  endDate: string,
): { label: string; value: string }[] | undefined {
  switch (tab) {
    case 'service':
      return summary
        ? [
            { label: 'Periode', value: summary.period },
            { label: 'Total Unit', value: String(summary.totalRequests) },
            {
              label: 'Pendapatan Servis',
              value: rupiah.format(summary.totalServiceFee),
            },
            { label: 'Total Pendapatan', value: rupiah.format(summary.totalRevenue) },
          ]
        : undefined;
    case 'valuation':
      return valuation
        ? [
            { label: 'Jenis Part', value: String(valuation.partCount) },
            { label: 'Total Unit', value: String(valuation.totalStock) },
            { label: 'Nilai Persediaan', value: rupiah.format(valuation.totalValue) },
          ]
        : undefined;
    case 'receivable':
      return aging
        ? [
            { label: 'Posisi', value: aging.asOf },
            { label: 'Pelanggan Berutang', value: String(aging.totalCustomers) },
            { label: 'Total Piutang', value: rupiah.format(aging.totalOutstanding) },
          ]
        : undefined;
    case 'stock-card':
      return stockCard
        ? [
            { label: 'Part', value: stockCard.part.partName },
            { label: 'Periode', value: `${startDate} s/d ${endDate}` },
            { label: 'Saldo Awal', value: String(stockCard.opening) },
            { label: 'Saldo Akhir', value: String(stockCard.closing) },
          ]
        : undefined;
    default:
      return undefined;
  }
}
