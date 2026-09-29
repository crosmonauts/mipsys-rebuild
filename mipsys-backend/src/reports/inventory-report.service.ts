import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { spareParts, stockMovements } from '../database/schema';
import { assertRowLimit, resolvePeriod } from './report-period';
import { loadCompanyProfile } from './company-profile';
import { createReportFile } from './excel/sheet-builder';
import { buildStockCard } from './stock-card';
import { numberToWords } from './excel/terbilang';

export interface ValuationTotals {
  totalValue: number;
  partCount: number;
  totalStock: number;
}

export interface ValuationItem {
  partCode: string | null;
  partName: string;
  stock: number;
  price: number;
  value: number;
}

export interface InventoryValuation extends ValuationTotals {
  items: ValuationItem[];
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

@Injectable()
export class InventoryReportService {
  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
  ) {}

  async getValuation(): Promise<InventoryValuation> {
    const totals = await this.db
      .select({
        totalValue: sql<number>`coalesce(sum(${spareParts.stock} * ${spareParts.price}), 0)::float`,
        partCount: sql<number>`count(*)::int`,
        totalStock: sql<number>`coalesce(sum(${spareParts.stock}), 0)::int`,
      })
      .from(spareParts)
      .where(isNull(spareParts.deletedAt));

    const items = await this.db
      .select({
        partCode: spareParts.partCode,
        partName: spareParts.partName,
        stock: spareParts.stock,
        price: spareParts.price,
        value: sql<number>`(${spareParts.stock} * ${spareParts.price})::float`,
      })
      .from(spareParts)
      .where(isNull(spareParts.deletedAt))
      .orderBy(desc(sql<number>`${spareParts.stock} * ${spareParts.price}`))
      .limit(5001);

    assertRowLimit(items.length);

    const row = totals[0];
    return {
      totalValue: Number(row?.totalValue ?? 0),
      partCount: Number(row?.partCount ?? 0),
      totalStock: Number(row?.totalStock ?? 0),
      items: items.map((item) => ({
        partCode: item.partCode,
        partName: item.partName,
        stock: Number(item.stock),
        price: Number(item.price),
        value: Number(item.value),
      })),
    };
  }

  async getLowStock(): Promise<LowStockItem[]> {
    const rows = await this.db
      .select({
        id: spareParts.id,
        partCode: spareParts.partCode,
        partName: spareParts.partName,
        stock: spareParts.stock,
        minStock: spareParts.minStock,
        location: spareParts.location,
      })
      .from(spareParts)
      .where(
        and(
          isNull(spareParts.deletedAt),
          sql`${spareParts.stock} < ${spareParts.minStock}`,
        ),
      )
      .orderBy(asc(spareParts.partName))
      .limit(5001);

    assertRowLimit(rows.length);

    return rows.map((row) => ({
      id: Number(row.id),
      partCode: row.partCode,
      partName: row.partName,
      stock: Number(row.stock),
      minStock: Number(row.minStock),
      shortage: Number(row.minStock) - Number(row.stock),
      location: row.location,
    }));
  }

  private async loadStockCard(
    sparePartId: number,
    startDate?: string,
    endDate?: string,
  ) {
    const period = resolvePeriod(startDate, endDate);

    const parts = await this.db
      .select({
        id: spareParts.id,
        partCode: spareParts.partCode,
        partName: spareParts.partName,
        stock: spareParts.stock,
      })
      .from(spareParts)
      .where(and(eq(spareParts.id, sparePartId), isNull(spareParts.deletedAt)));

    const part = parts[0];
    if (!part) {
      throw new NotFoundException(`Part ID ${sparePartId} tidak ditemukan`);
    }

    const movements = await this.db
      .select({
        createdAt: stockMovements.createdAt,
        quantity: stockMovements.quantity,
        movementType: stockMovements.movementType,
        referenceType: stockMovements.referenceType,
        referenceId: stockMovements.referenceId,
        notes: stockMovements.notes,
      })
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.sparePartId, sparePartId),
          gte(stockMovements.createdAt, period.start),
          lt(stockMovements.createdAt, endExclusive(period.end)),
        ),
      )
      .orderBy(asc(stockMovements.createdAt))
      .limit(5001);

    assertRowLimit(movements.length);

    return { part, movements, period };
  }

  async getStockCard(
    sparePartId: number,
    startDate?: string,
    endDate?: string,
  ) {
    return buildStockCard(
      await this.loadStockCard(sparePartId, startDate, endDate),
    );
  }

  async exportValuationXlsx(printedBy?: string): Promise<Buffer> {
    const company = await loadCompanyProfile(this.db as any);
    const data = await this.getValuation();
    const printedAt = new Date();

    return createReportFile({
      sheetName: 'Valuasi Stok',
      title: 'LAPORAN VALUASI PERSEDIAAN',
      company,
      period: `Per ${formatTanggal(printedAt)}`,
      printedBy,
      parameters: [
        { label: 'Jumlah Part', value: String(data.partCount) },
        { label: 'Total Unit', value: String(data.totalStock) },
        {
          label: 'Nilai Persediaan',
          value: numberToWords(data.totalValue),
        },
      ],
      columns: [
        { key: 'partCode', header: 'Kode Part', width: 16, align: 'center' },
        { key: 'partName', header: 'Nama Part', width: 30 },
        { key: 'stock', header: 'Stok', width: 10, type: 'integer', total: true },
        { key: 'price', header: 'Harga Satuan', width: 16, type: 'currency' },
        { key: 'value', header: 'Nilai Persediaan', width: 20, type: 'currency', total: true },
      ],
      rows: data.items,
      totals: { stock: data.totalStock, value: data.totalValue },
    });
  }

  async exportLowStockXlsx(printedBy?: string): Promise<Buffer> {
    const company = await loadCompanyProfile(this.db as any);
    const data = await this.getLowStock();

    return createReportFile({
      sheetName: 'Stok Menipis',
      title: 'LAPORAN STOK MENIPIS',
      company,
      period: `Per ${formatTanggal(new Date())}`,
      printedBy,
      parameters: [
        { label: 'Part di Bawah Stok Minimum', value: String(data.length) },
      ],
      columns: [
        { key: 'partCode', header: 'Kode Part', width: 16, align: 'center' },
        { key: 'partName', header: 'Nama Part', width: 30 },
        { key: 'location', header: 'Lokasi', width: 16, align: 'center' },
        { key: 'stock', header: 'Stok', width: 10, type: 'integer', total: true },
        { key: 'minStock', header: 'Stok Minimum', width: 14, type: 'integer', total: true },
        { key: 'shortage', header: 'Kekurangan', width: 12, type: 'integer', total: true },
      ],
      rows: data,
    });
  }

  async exportStockCardXlsx(
    sparePartId: number,
    startDate?: string,
    endDate?: string,
    printedBy?: string,
  ): Promise<Buffer> {
    const company = await loadCompanyProfile(this.db as any);
    const card = buildStockCard(
      await this.loadStockCard(sparePartId, startDate, endDate),
    );

    return createReportFile({
      sheetName: 'Kartu Stok',
      title: `KARTU STOK - ${card.part.partName}`,
      company,
      printedBy,
      parameters: [
        { label: 'Kode Part', value: card.part.partCode ?? '-' },
        { label: 'Nama Part', value: card.part.partName },
        { label: 'Saldo Awal', value: String(card.opening) },
        { label: 'Saldo Akhir', value: String(card.closing) },
      ],
      columns: [
        { key: 'date', header: 'Tanggal', width: 13, type: 'date' },
        { key: 'movementType', header: 'Jenis Mutasi', width: 20 },
        { key: 'referenceId', header: 'Referensi', width: 16, align: 'center' },
        { key: 'notes', header: 'Keterangan', width: 34 },
        { key: 'in', header: 'Masuk', width: 12, type: 'integer', total: true },
        { key: 'out', header: 'Keluar', width: 12, type: 'integer', total: true },
        { key: 'balance', header: 'Saldo', width: 12, type: 'integer' },
      ],
      rows: card.rows,
      totalLabel: 'TOTAL MUTASI',
    });
  }
}

function endExclusive(end: Date): Date {
  return new Date(end.getTime() + 86400000);
}

function formatTanggal(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${date.getFullYear()}`;
}
