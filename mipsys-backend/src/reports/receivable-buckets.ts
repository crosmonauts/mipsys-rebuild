/**
 * Perhitungan umurnya piutang (AR aging) sesuai standar akuntansi:
 * bucket 0-30, 31-60, 61-90, dan >90 hari sejak tanggal invoice.
 */
export interface AgeingBucket {
  key: 'current' | 'd31to60' | 'd61to90' | 'over90';
  label: string;
  min: number;
  max: number | null;
}

export const AGEING_BUCKETS: AgeingBucket[] = [
  { key: 'current', label: '0-30 Hari', min: 0, max: 30 },
  { key: 'd31to60', label: '31-60 Hari', min: 31, max: 60 },
  { key: 'd61to90', label: '61-90 Hari', min: 61, max: 90 },
  { key: 'over90', label: '> 90 Hari', min: 91, max: null },
];

export interface AgeingSource {
  customerName?: string | null;
  total: number | string | null;
  invoiceDate: string | Date;
}

export interface AgeingRow {
  customerName: string;
  invoiceCount: number;
  total: number;
  current: number;
  d31to60: number;
  d61to90: number;
  over90: number;
  maxDays: number;
}

const DAY_MS = 86400000;

/** Umur tagihan dalam hari penuh, tidak pernah negatif. */
export function countDaysOverdue(invoiceDate: string | Date, asOf: Date): number {
  const due = invoiceDate instanceof Date ? invoiceDate : new Date(invoiceDate);
  if (Number.isNaN(due.getTime())) return 0;
  const reference = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()),
  );
  const days = Math.floor((reference.getTime() - due.getTime()) / DAY_MS);
  return days < 0 ? 0 : days;
}

function bucketFor(days: number): AgeingBucket {
  return (
    AGEING_BUCKETS.find(
      (bucket) =>
        days >= bucket.min && (bucket.max === null || days <= bucket.max),
    ) ?? AGEING_BUCKETS[AGEING_BUCKETS.length - 1]
  );
}

function toAmount(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * Mengelompokkan tagihan belum lunat per customer dan menghimpun
 * nominal ke setiap bucket umur. Baris diurutkan dari total tagihan
 * terbesar. Invoice tanpa nama customer atau berduit nol diabaikan.
 */
export function buildAgeingRows(
  invoices: AgeingSource[],
  asOf: Date,
): AgeingRow[] {
  const grouped = new Map<string, AgeingRow>();

  for (const invoice of invoices) {
    const name = invoice.customerName?.trim();
    const amount = toAmount(invoice.total);
    if (!name || amount <= 0) continue;

    const days = countDaysOverdue(invoice.invoiceDate, asOf);
    const bucket = bucketFor(days);

    let row = grouped.get(name);
    if (!row) {
      row = {
        customerName: name,
        invoiceCount: 0,
        total: 0,
        current: 0,
        d31to60: 0,
        d61to90: 0,
        over90: 0,
        maxDays: 0,
      };
      grouped.set(name, row);
    }

    row.invoiceCount += 1;
    row.total += amount;
    row[bucket.key] += amount;
    if (days > row.maxDays) row.maxDays = days;
  }

  return [...grouped.values()].sort((a, b) => b.total - a.total);
}
