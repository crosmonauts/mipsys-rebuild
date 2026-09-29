import { apiClient } from '@/src/lib/api-client';

export interface ReportPeriod {
  startDate?: string;
  endDate?: string;
}

export interface ServiceSummary {
  period: string;
  totalRequests: number;
  totalServiceFee: number;
  totalPartFee: number;
  totalRevenue: number;
  byStatus: {
    status: string;
    label: string;
    count: number;
    serviceFee: number;
    partFee: number;
  }[];
}

export interface TechnicianPerformance {
  techName: string;
  requestCount: number;
  completedCount: number;
  avgDays: number;
}

export interface ModelPopularity {
  modelName: string;
  unitCount: number;
}

export interface InventoryValuation {
  totalValue: number;
  partCount: number;
  totalStock: number;
  items: {
    partCode: string | null;
    partName: string;
    stock: number;
    price: number;
    value: number;
  }[];
}

export interface LowStockItem {
  id: number;
  partCode: string | null;
  partName: string;
  stock: number;
  minStock: number;
  shortage: number;
  location: string | null;
}

export interface StockCardRow {
  kind: 'opening' | 'movement';
  date: string | null;
  movementType: string | null;
  referenceId: string | null;
  notes: string | null;
  in: number;
  out: number;
  quantity: number;
  balance: number;
}

export interface StockCard {
  part: { id: number; partCode: string | null; partName: string; stock: number };
  opening: number;
  closing: number;
  rows: StockCardRow[];
}

export interface ReceivableAging {
  asOf: string;
  totalOutstanding: number;
  totalCustomers: number;
  byBucket: { key: string; label: string; amount: number }[];
  rows: {
    customerName: string;
    invoiceCount: number;
    total: number;
    current: number;
    d31to60: number;
    d61to90: number;
    over90: number;
    maxDays: number;
  }[];
}

function periodParams(period: ReportPeriod) {
  const params: Record<string, string> = {};
  if (period.startDate) params.startDate = period.startDate;
  if (period.endDate) params.endDate = period.endDate;
  return { params };
}

function downloadBlob(blob: Blob, fallbackName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fileNameFromDisposition(
  disposition: string | undefined,
  fallback: string,
): string {
  if (!disposition) return fallback;
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match ? match[1] : fallback;
}

async function downloadExport(
  path: string,
  params: Record<string, string>,
  fallbackName: string,
): Promise<void> {
  const response = await apiClient.get(path, {
    params,
    responseType: 'blob',
  });
  const name = fileNameFromDisposition(
    response.headers['content-disposition'],
    fallbackName,
  );
  downloadBlob(response.data, name);
}

export const reportsApi = {
  getServiceSummary: (period: ReportPeriod = {}) =>
    apiClient
      .get<ServiceSummary>('/reports/service/summary', periodParams(period))
      .then((r) => r.data),

  getTechnicianPerformance: (period: ReportPeriod = {}) =>
    apiClient
      .get<TechnicianPerformance[]>(
        '/reports/service/technicians',
        periodParams(period),
      )
      .then((r) => r.data),

  getModelPopularity: (period: ReportPeriod = {}) =>
    apiClient
      .get<ModelPopularity[]>('/reports/service/models', periodParams(period))
      .then((r) => r.data),

  getValuation: () =>
    apiClient.get<InventoryValuation>('/reports/inventory/valuation').then((r) => r.data),

  getLowStock: () =>
    apiClient.get<LowStockItem[]>('/reports/inventory/low-stock').then((r) => r.data),

  getStockCard: (sparePartId: number, period: ReportPeriod = {}) =>
    apiClient
      .get<StockCard>(`/reports/inventory/stock-card/${sparePartId}`, periodParams(period))
      .then((r) => r.data),

  getReceivableAging: () =>
    apiClient.get<ReceivableAging>('/reports/receivable/aging').then((r) => r.data),

  exportServiceSummary: (period: ReportPeriod = {}) =>
    downloadExport('/reports/export/service-summary', periodParams(period).params, 'laporan-layanan-servis.xlsx'),

  exportTechnicians: (period: ReportPeriod = {}) =>
    downloadExport('/reports/export/service-technicians', periodParams(period).params, 'laporan-kinerja-teknisi.xlsx'),

  exportModels: (period: ReportPeriod = {}) =>
    downloadExport('/reports/export/service-models', periodParams(period).params, 'laporan-popularitas-model.xlsx'),

  exportValuation: () =>
    downloadExport('/reports/export/inventory-valuation', {}, 'laporan-valuasi-persediaan.xlsx'),

  exportLowStock: () =>
    downloadExport('/reports/export/inventory-low-stock', {}, 'laporan-stok-menipis.xlsx'),

  exportStockCard: (sparePartId: number, period: ReportPeriod = {}) =>
    downloadExport(
      `/reports/export/inventory-stock-card/${sparePartId}`,
      periodParams(period).params,
      'laporan-kartu-stok.xlsx',
    ),

  exportReceivableAging: () =>
    downloadExport('/reports/export/receivable-aging', {}, 'laporan-umur-piutang.xlsx'),
};
