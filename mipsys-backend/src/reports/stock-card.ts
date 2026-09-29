import type { ResolvedPeriod } from './report-period';

export interface StockCardMovement {
  createdAt: Date | string;
  quantity: number;
  movementType: string;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
}

export interface StockCardPart {
  id: number;
  partCode?: string | null;
  partName: string;
  stock: number;
}

export interface StockCardRow {
  kind: 'opening' | 'movement';
  date: Date | null;
  movementType: string | null;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  in: number;
  out: number;
  quantity: number;
  balance: number;
}

export interface StockCard {
  part: StockCardPart;
  opening: number;
  closing: number;
  rows: StockCardRow[];
}

function toTime(value: Date | string): number {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

const MOVEMENT_LABELS: Record<string, string> = {
  PO_RECEIVE: 'Penerimaan PO',
  SERVICE_USE: 'Pemakaian Servis',
  SERVICE_RETURN: 'Pengembalian Servis',
  ADJUSTMENT: 'Penyesuaian',
};

/**
 * Membangun kartu stok: saldo awal, tiap mutasi selama periode, dan saldo
 * akhir. Saldo awal diturunkan dari stok saat ini dikurangi akumulasi mutasi
 * pada periode berjalan, karena tabel part hanya menyimpan stok terkini.
 */
export function buildStockCard(input: {
  part: StockCardPart;
  movements: StockCardMovement[];
  period: ResolvedPeriod;
}): StockCard {
  const { part, movements, period } = input;
  const start = toTime(period.start);
  const end = toTime(period.end) + 86400000 - 1;

  const inPeriod = movements
    .filter((m) => {
      const time = toTime(m.createdAt);
      return time >= start && time <= end;
    })
    .sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt));

  const netChange = inPeriod.reduce((sum, m) => sum + (m.quantity || 0), 0);
  const opening = (part.stock || 0) - netChange;

  const rows: StockCardRow[] = [
    {
      kind: 'opening',
      date: null,
      movementType: null,
      referenceType: null,
      referenceId: null,
      notes: 'Saldo awal periode',
      in: 0,
      out: 0,
      quantity: 0,
      balance: opening,
    },
  ];

  let balance = opening;
  for (const movement of inPeriod) {
    const quantity = movement.quantity || 0;
    balance += quantity;
    rows.push({
      kind: 'movement',
      date: new Date(toTime(movement.createdAt)),
      movementType: MOVEMENT_LABELS[movement.movementType] ?? movement.movementType,
      referenceType: movement.referenceType ?? null,
      referenceId: movement.referenceId ?? null,
      notes: movement.notes ?? null,
      in: quantity > 0 ? quantity : 0,
      out: quantity < 0 ? Math.abs(quantity) : 0,
      quantity,
      balance,
    });
  }

  return { part, opening, closing: balance, rows };
}
