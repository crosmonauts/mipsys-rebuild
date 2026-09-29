import { BadRequestException } from '@nestjs/common';

/** Batas keras jumlah baris export XLSX (cegah OOM pada dataset besar). */
export const MAX_EXPORT_ROWS = 5000;

/** Rentang periode maksimum laporan, dalam hari. */
export const MAX_PERIOD_DAYS = 366;

const DAY_MS = 86400000;

export interface ResolvedPeriod {
  start: Date;
  end: Date;
  label: string;
}

function startOfUtcDay(value: Date): Date {
  const d = new Date(value);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function parseDateOnly(value: string, field: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new BadRequestException(
      `${field} harus berformat YYYY-MM-DD (contoh: 2026-03-01)`,
    );
  }
  const [, y, m, d] = match;
  const parsed = new Date(
    Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0),
  );
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== Number(y) ||
    parsed.getUTCMonth() !== Number(m) - 1 ||
    parsed.getUTCDate() !== Number(d)
  ) {
    throw new BadRequestException(`${field} bukan tanggal yang valid`);
  }
  return parsed;
}

function formatId(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${date.getUTCFullYear()}`;
}

/**
 * Menormalkan parameter periode laporan. Tanpa parameter, memakai 30 hari
 * terakhir. Menolak tanggal non-ISO, rentang terbalik, dan rentang lebih
 * dari {@link MAX_PERIOD_DAYS} hari.
 */
export function resolvePeriod(
  startDate?: string,
  endDate?: string,
): ResolvedPeriod {
  const hasStart = startDate !== undefined && startDate.trim() !== '';
  const hasEnd = endDate !== undefined && endDate.trim() !== '';

  let end: Date;
  let start: Date;

  if (!hasStart && !hasEnd) {
    end = startOfUtcDay(new Date());
    start = new Date(end.getTime() - 30 * DAY_MS);
  } else {
    if (!hasStart || !hasEnd) {
      throw new BadRequestException(
        'startDate dan endDate harus diisi berdua',
      );
    }
    start = parseDateOnly(startDate, 'startDate');
    end = parseDateOnly(endDate, 'endDate');
  }

  if (start.getTime() > end.getTime()) {
    throw new BadRequestException(
      'startDate tidak boleh melewati endDate',
    );
  }

  const spanDays = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  if (spanDays > MAX_PERIOD_DAYS) {
    throw new BadRequestException(
      `Rentang periode maksimal ${MAX_PERIOD_DAYS} hari per laporan`,
    );
  }

  return { start, end, label: `${formatId(start)} s/d ${formatId(end)}` };
}

/** Menolak hasil query yang melampaui batas aman export. */
export function assertRowLimit(
  rowCount: number,
  max: number = MAX_EXPORT_ROWS,
): void {
  if (rowCount > max) {
    throw new BadRequestException(
      `Data melebihi batas ${max.toLocaleString('id-ID')} baris. Persempit periode atau filter laporan.`,
    );
  }
}

/** Nama file export yang konsisten: Laporan-{jenis}-{YYYYMMDD}.xlsx */
export function buildReportFileName(kind: string, asOf = new Date()): string {
  const y = asOf.getFullYear();
  const m = String(asOf.getMonth() + 1).padStart(2, '0');
  const d = String(asOf.getDate()).padStart(2, '0');
  const safeKind = kind.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `Laporan-${safeKind}-${y}${m}${d}.xlsx`;
}
