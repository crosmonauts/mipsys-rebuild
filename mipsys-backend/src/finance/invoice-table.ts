/**
 * Baris rincian invoice.
 *
 * Biaya jasa TIDAK lagi menjadi baris tabel — nominalnya tetap utuh di
 * baris total ("Total Biaya Jasa"). Tabel hanya memuat sparepart, sesuai
 * dokumen resmi.
 */

export interface InvoicePartLine {
  sparePartId: number | null;
  partName: string;
  quantity: number;
  price: number;
}

export interface TableLine {
  no: string;
  item: string;
  qty: string;
  harga: number;
  jml: number;
  /** Baris catatan (mis. "Tidak ada sparepart") tidak dihitung sebagai item. */
  isNote?: boolean;
}

export const NO_PARTS_NOTE = 'Tidak ada sparepart';

/**
 * Menyusun baris tabel dari sparepart. Baris jasa tidak pernah ikut.
 * Tanpa sparepart, tetap tersedia satu baris catatan agar tabel tidak
 * tampil kosong tanpa penjelasan.
 */
export function buildTableLines(parts: InvoicePartLine[]): TableLine[] {
  if (!parts || parts.length === 0) {
    return [{ no: '', item: NO_PARTS_NOTE, qty: '', harga: 0, jml: 0, isNote: true }];
  }

  return parts.map((part, index) => {
    const qty = Number(part.quantity) || 0;
    const price = Number(part.price) || 0;
    return {
      no: String(index + 1),
      item: part.partName,
      qty: String(qty),
      harga: price,
      jml: price * qty,
    };
  });
}

/** Baris ringkasan nominal; jasa hanya muncul di sini. */
export interface SummaryLine {
  label: string;
  value: number;
  bold: boolean;
}

export function buildSummaryLines(
  serviceFee: number,
  partFee: number,
  ppn: number,
  ppnLabel: string,
): SummaryLine[] {
  return [
    { label: 'Total Biaya Part', value: partFee, bold: false },
    { label: 'Total Biaya Jasa', value: serviceFee, bold: false },
    { label: 'Subtotal', value: serviceFee + partFee, bold: true },
    { label: ppnLabel, value: ppn, bold: false },
  ];
}

/**
 * Ketentuan invoice. Parameter metode pembayaran disisipkan agar isi
 *ketentuan tidak lagi tersebar di template.
 */
export function buildInvoiceTerms(paymentLabel: string): string[] {
  return [
    `Pembayaran via metode terpilih (${paymentLabel}) — harap konfirmasi ke kasir`,
    'Pembayaran dilakukan di kasir sebelum unit diambil',
    'Garansi pekerjaan sesuai ketentuan yang berlaku',
  ];
}

export function paymentLabel(method?: string | null): string {
  switch (method) {
    case 'TRANSFER':
      return 'Transfer';
    case 'QRIS':
      return 'QRIS';
    case 'CASH':
      return 'Cash';
    default:
      return 'CASH/TRANSFER/QRIS';
  }
}
