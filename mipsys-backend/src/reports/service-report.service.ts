import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { and, asc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { serviceRequests, staff } from '../database/schema';
import { assertRowLimit, resolvePeriod } from './report-period';
import { loadCompanyProfile } from './company-profile';
import { createReportFile } from './excel/sheet-builder';

const STATUS_LABELS: Record<string, string> = {
  WAITING_CHECK: 'Pending',
  CHECK: 'Check',
  WAITING_APPROVE: 'Menunggu Approve',
  SERVICE: 'In Service',
  AWAITING_PARTS: 'Menunggu Part',
  DONE: 'Ready',
  CLOSED: 'Closed',
  CANCEL: 'Cancelled',
  CANCELLED: 'Cancelled',
};

export interface ServiceStatusSummary {
  status: string;
  label: string;
  count: number;
  serviceFee: number;
  partFee: number;
}

export interface ServiceSummary {
  period: string;
  totalRequests: number;
  totalServiceFee: number;
  totalPartFee: number;
  totalRevenue: number;
  byStatus: ServiceStatusSummary[];
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

@Injectable()
export class ServiceReportService {
  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
  ) {}

  private bounds(startDate?: string, endDate?: string) {
    const period = resolvePeriod(startDate, endDate);
    const start = period.start.toISOString().slice(0, 10);
    const end = period.end.toISOString().slice(0, 10);
    return {
      period,
      where: and(
        gte(serviceRequests.incomingDate, start),
        lte(serviceRequests.incomingDate, end),
        isNull(serviceRequests.deletedAt),
      ),
    };
  }

  async getSummary(
    startDate?: string,
    endDate?: string,
  ): Promise<ServiceSummary> {
    const { period, where } = this.bounds(startDate, endDate);

    const rows = await this.db
      .select({
        status: serviceRequests.statusService,
        count: sql<number>`count(*)::int`,
        serviceFee: sql<number>`coalesce(sum(${serviceRequests.serviceFee}), 0)::float`,
        partFee: sql<number>`coalesce(sum(${serviceRequests.partFee}), 0)::float`,
      })
      .from(serviceRequests)
      .where(where)
      .groupBy(serviceRequests.statusService);

    const byStatus: ServiceStatusSummary[] = rows.map((row) => ({
      status: String(row.status),
      label: STATUS_LABELS[String(row.status)] ?? String(row.status),
      count: Number(row.count),
      serviceFee: Number(row.serviceFee),
      partFee: Number(row.partFee),
    }));

    const totalRequests = byStatus.reduce((s, r) => s + r.count, 0);
    const totalServiceFee = byStatus.reduce((s, r) => s + r.serviceFee, 0);
    const totalPartFee = byStatus.reduce((s, r) => s + r.partFee, 0);

    return {
      period: period.label,
      totalRequests,
      totalServiceFee,
      totalPartFee,
      totalRevenue: totalServiceFee + totalPartFee,
      byStatus,
    };
  }

  async getTechnicianPerformance(
    startDate?: string,
    endDate?: string,
  ): Promise<TechnicianPerformance[]> {
    const { where } = this.bounds(startDate, endDate);

    const rows = await this.db
      .select({
        techName: staff.name,
        requestCount: sql<number>`count(*)::int`,
        // Unit selesai = tiket yang benar-benar dikerjakan: sudah ditutup
        // (statusSystem='CLOSED') DAN punya readyDate. Tiket CANCEL ikut
        // membawa statusSystem='CLOSED' namun tidak pernah mengisi
        // readyDate, sehingga harus dikecualikan. Kedua syarat harus
        // terpenuhi bersamaan - bukan salah satunya saja.
        completedCount: sql<number>`count(*) filter (where ${serviceRequests.statusSystem} = 'CLOSED' and ${serviceRequests.readyDate} is not null)::int`,
        avgDays: sql<number>`coalesce(avg(extract(epoch from (${serviceRequests.closeDate}::timestamp - ${serviceRequests.incomingDate}::timestamp)) / 86400) filter (where ${serviceRequests.closeDate} is not null), 0)::float`,
      })
      .from(serviceRequests)
      .innerJoin(staff, eq(serviceRequests.technicianCheckId, staff.id))
      .where(where)
      .groupBy(staff.name)
      .orderBy(sql<number>`count(*) desc`);

    return rows.map((row) => ({
      techName: String(row.techName),
      requestCount: Number(row.requestCount),
      completedCount: Number(row.completedCount),
      avgDays: Math.round(Number(row.avgDays) * 100) / 100,
    }));
  }

  async getModelPopularity(
    startDate?: string,
    endDate?: string,
  ): Promise<ModelPopularity[]> {
    const { where } = this.bounds(startDate, endDate);

    const rows = await this.db
      .select({
        modelName: serviceRequests.modelName,
        unitCount: sql<number>`count(*)::int`,
      })
      .from(serviceRequests)
      .where(where)
      .groupBy(serviceRequests.modelName)
      .orderBy(sql<number>`count(*) desc`);

    return rows.map((row) => ({
      modelName: String(row.modelName),
      unitCount: Number(row.unitCount),
    }));
  }

  async exportSummaryXlsx(
    startDate?: string,
    endDate?: string,
    printedBy?: string,
  ): Promise<Buffer> {
    const { period, where } = this.bounds(startDate, endDate);
    const company = await loadCompanyProfile(this.db as any);

    const rows = await this.db
      .select({
        ticketNumber: serviceRequests.ticketNumber,
        modelName: serviceRequests.modelName,
        serialNumber: serviceRequests.serialNumber,
        statusService: serviceRequests.statusService,
        incomingDate: serviceRequests.incomingDate,
        closeDate: serviceRequests.closeDate,
        serviceFee: serviceRequests.serviceFee,
        partFee: serviceRequests.partFee,
      })
      .from(serviceRequests)
      .where(where)
      .orderBy(asc(serviceRequests.incomingDate))
      .limit(5001);

    assertRowLimit(rows.length);

    const items = rows.map((row) => ({
      ...row,
      revenue: Number(row.serviceFee ?? 0) + Number(row.partFee ?? 0),
    }));

    return createReportFile({
      sheetName: 'Laporan Servis',
      title: 'LAPORAN LAYANAN SERVIS',
      company,
      period: period.label,
      printedBy,
      parameters: [
        { label: 'Periode', value: period.label },
        { label: 'Jumlah Unit', value: String(items.length) },
      ],
      columns: [
        { key: 'ticketNumber', header: 'No. SR', width: 18, align: 'center' },
        { key: 'modelName', header: 'Model', width: 16 },
        { key: 'serialNumber', header: 'Serial Number', width: 18 },
        {
          key: 'statusService',
          header: 'Status',
          width: 16,
          align: 'center',
          format: (value) => STATUS_LABELS[String(value)] ?? String(value),
        },
        { key: 'incomingDate', header: 'Tgl Masuk', width: 13, type: 'date' },
        { key: 'closeDate', header: 'Tgl Selesai', width: 13, type: 'date' },
        {
          key: 'serviceFee',
          header: 'Biaya Servis',
          width: 15,
          type: 'currency',
          total: true,
        },
        {
          key: 'partFee',
          header: 'Biaya Part',
          width: 15,
          type: 'currency',
          total: true,
        },
        {
          key: 'revenue',
          header: 'Total',
          width: 16,
          type: 'currency',
          total: true,
        },
      ],
      rows: items,
    });
  }

  async exportTechnicianXlsx(
    startDate?: string,
    endDate?: string,
    printedBy?: string,
  ): Promise<Buffer> {
    const { period } = this.bounds(startDate, endDate);
    const company = await loadCompanyProfile(this.db as any);
    const data = await this.getTechnicianPerformance(startDate, endDate);
    assertRowLimit(data.length);

    return createReportFile({
      sheetName: 'Kinerja Teknisi',
      title: 'LAPORAN KINERJA TEKNISI',
      company,
      period: period.label,
      printedBy,
      parameters: [
        { label: 'Periode', value: period.label },
        { label: 'Jumlah Teknisi', value: String(data.length) },
      ],
      columns: [
        { key: 'techName', header: 'Nama Teknisi', width: 24 },
        {
          key: 'requestCount',
          header: 'Unit Ditangani',
          width: 16,
          type: 'integer',
          align: 'center',
          total: true,
        },
        {
          key: 'completedCount',
          header: 'Unit Selesai',
          width: 16,
          type: 'integer',
          align: 'center',
          total: true,
        },
        {
          key: 'avgDays',
          header: 'Rata-rata Durasi (hari)',
          width: 20,
          type: 'number',
          total: true,
        },
        {
          key: 'completionRate',
          header: 'Tingkat Penyelesaian',
          width: 20,
          type: 'percent',
          format: (_value, row) =>
            Number((row as any).requestCount) > 0
              ? Number((row as any).completedCount) /
                Number((row as any).requestCount)
              : 0,
        },
      ],
      rows: data,
    });
  }

  async exportModelXlsx(
    startDate?: string,
    endDate?: string,
    printedBy?: string,
  ): Promise<Buffer> {
    const { period } = this.bounds(startDate, endDate);
    const company = await loadCompanyProfile(this.db as any);
    const data = await this.getModelPopularity(startDate, endDate);
    assertRowLimit(data.length);

    const totalUnits = data.reduce((s, r) => s + r.unitCount, 0);

    return createReportFile({
      sheetName: 'Popularitas Model',
      title: 'LAPORAN POPULARITAS MODEL UNIT',
      company,
      period: period.label,
      printedBy,
      parameters: [
        { label: 'Periode', value: period.label },
        { label: 'Total Unit', value: String(totalUnits) },
      ],
      columns: [
        { key: 'modelName', header: 'Model Unit', width: 22 },
        {
          key: 'unitCount',
          header: 'Jumlah Unit',
          width: 14,
          type: 'integer',
          align: 'center',
          total: true,
        },
        {
          key: 'share',
          header: 'Porsi',
          width: 12,
          type: 'percent',
          format: (value) => (totalUnits > 0 ? Number(value) / totalUnits : 0),
        },
      ],
      rows: data,
      totals: { unitCount: totalUnits },
    });
  }
}
