import { Injectable, Inject } from '@nestjs/common';
import { and, desc, inArray, isNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { invoices } from '../database/schema';
import { assertRowLimit } from './report-period';
import { loadCompanyProfile } from './company-profile';
import { createReportFile } from './excel/sheet-builder';
import { numberToWords } from './excel/terbilang';
import { AGEING_BUCKETS, buildAgeingRows } from './receivable-buckets';
import type { AgeingRow } from './receivable-buckets';

const OPEN_STATUSES = ['UNPAID', 'OVERDUE'] as const;

export interface ReceivableAging {
  asOf: string;
  totalOutstanding: number;
  totalCustomers: number;
  byBucket: { key: string; label: string; amount: number }[];
  rows: AgeingRow[];
}

@Injectable()
export class ReceivableReportService {
  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
  ) {}

  private async loadOpenInvoices(asOf: Date) {
    const rows = await this.db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        customerName: invoices.clientName,
        total: invoices.total,
        invoiceDate: invoices.invoiceDate,
        status: invoices.status,
      })
      .from(invoices)
      .where(
        and(
          inArray(invoices.status, [...OPEN_STATUSES]),
          isNull(invoices.deletedAt),
          sql`${invoices.total} > 0`,
        ),
      )
      .orderBy(desc(invoices.invoiceDate))
      .limit(5001);

    assertRowLimit(rows.length);
    return rows;
  }

  async getAging(asOf?: Date): Promise<ReceivableAging> {
    const reference = asOf ?? new Date();
    const openInvoices = await this.loadOpenInvoices(reference);
    const rows = buildAgeingRows(openInvoices, reference);

    const byBucket = AGEING_BUCKETS.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      amount: rows.reduce((sum, row) => sum + row[bucket.key], 0),
    }));

    return {
      asOf: reference.toISOString().slice(0, 10),
      totalOutstanding: byBucket.reduce((sum, b) => sum + b.amount, 0),
      totalCustomers: rows.length,
      byBucket,
      rows,
    };
  }

  async exportAgingXlsx(
    asOf?: Date,
    printedBy?: string,
  ): Promise<Buffer> {
    const reference = asOf ?? new Date();
    const company = await loadCompanyProfile(this.db as any);
    const data = await this.getAging(reference);
    const openInvoices = await this.loadOpenInvoices(reference);

    const detailByCustomer = new Map<string, string[]>();
    for (const invoice of openInvoices) {
      const name = invoice.customerName?.trim();
      if (!name) continue;
      const list = detailByCustomer.get(name) ?? [];
      list.push(
        `${invoice.invoiceNumber} (${formatTanggal(invoice.invoiceDate)})`,
      );
      detailByCustomer.set(name, list);
    }

    return createReportFile({
      sheetName: 'Piutang',
      title: 'LAPORAN UMUR PIUTANG',
      company,
      period: `Per ${formatTanggal(reference)}`,
      printedBy,
      parameters: [
        { label: 'Pelanggan Berutang', value: String(data.totalCustomers) },
        { label: 'Total Piutang', value: numberToWords(data.totalOutstanding) },
      ],
      columns: [
        { key: 'customerName', header: 'Pelanggan', width: 28 },
        { key: 'invoiceCount', header: 'Jumlah Invoice', width: 14, type: 'integer', align: 'center', total: true },
        { key: 'current', header: '0-30 Hari', width: 16, type: 'currency', total: true },
        { key: 'd31to60', header: '31-60 Hari', width: 16, type: 'currency', total: true },
        { key: 'd61to90', header: '61-90 Hari', width: 16, type: 'currency', total: true },
        { key: 'over90', header: '> 90 Hari', width: 16, type: 'currency', total: true },
        { key: 'total', header: 'Total Tagihan', width: 18, type: 'currency', total: true },
        { key: 'maxDays', header: 'Umur Tertua (hari)', width: 16, type: 'integer', align: 'center' },
        {
          key: 'invoiceList',
          header: 'Rincian Invoice',
          width: 40,
          format: (_value, row) =>
            (detailByCustomer.get(String((row as any).customerName)) ?? []).join(
              ', ',
            ),
        },
      ],
      rows: data.rows,
      totals: {
        current: data.byBucket.find((b) => b.key === 'current')?.amount ?? 0,
        d31to60: data.byBucket.find((b) => b.key === 'd31to60')?.amount ?? 0,
        d61to90: data.byBucket.find((b) => b.key === 'd61to90')?.amount ?? 0,
        over90: data.byBucket.find((b) => b.key === 'over90')?.amount ?? 0,
        total: data.totalOutstanding,
      },
    });
  }
}

function formatTanggal(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}
