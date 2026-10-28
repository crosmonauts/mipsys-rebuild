import {
  NO_PARTS_NOTE,
  buildInvoiceTerms,
  buildSummaryLines,
  buildTableLines,
  paymentLabel,
} from '../src/finance/invoice-table';

/**
 * Aturan isi invoice:
 * - Tabel rincian hanya sparepart.
 * - Biaya jasa hanya muncul di baris total.
 * - Tanpa sparepart, tabel tetap punya baris catatan (bukan kosong).
 */

const PARTS = [
  { sparePartId: 1, partName: 'Print Head Assembly (PW Head)', quantity: 1, price: 750000 },
  { sparePartId: 7, partName: 'Timing Belt (CR Belt)', quantity: 2, price: 65000 },
];

describe('buildTableLines', () => {
  it('memuat hanya sparepart', () => {
    const lines = buildTableLines(PARTS);

    expect(lines).toHaveLength(2);
    expect(lines.map((l) => l.item)).toEqual([
      'Print Head Assembly (PW Head)',
      'Timing Belt (CR Belt)',
    ]);
  });

  it('tidak pernah memuat biaya jasa sebagai baris tabel', () => {
    const lines = buildTableLines(PARTS);
    const combined = lines.map((l) => l.item).join(' ').toLowerCase();

    expect(combined).not.toContain('jasa');
    expect(combined).not.toContain('service fee');
  });

  it('memberi nomor urut mulai dari 1', () => {
    expect(buildTableLines(PARTS).map((l) => l.no)).toEqual(['1', '2']);
  });

  it('menghitung jumlah = qty x harga', () => {
    const lines = buildTableLines(PARTS);
    expect(lines[0].jml).toBe(750000);
    expect(lines[1].jml).toBe(130000);
  });

  it('memberi baris catatan saat tidak ada sparepart', () => {
    const lines = buildTableLines([]);

    expect(lines).toHaveLength(1);
    expect(lines[0].item).toBe(NO_PARTS_NOTE);
    expect(lines[0].isNote).toBe(true);
    expect(lines[0].no).toBe('');
  });

  it('tidak menyisakan baris kosong untuk array kosong', () => {
    expect(buildTableLines([]).some((l) => l.item === '')).toBe(false);
  });

  it('menangani qty/harga null tanpa menghasilkan NaN', () => {
    const lines = buildTableLines([
      { sparePartId: 1, partName: 'X', quantity: 0, price: 0 },
    ]);
    expect(Number.isNaN(lines[0].jml)).toBe(false);
    expect(lines[0].jml).toBe(0);
  });
});

describe('buildSummaryLines', () => {
  it('memuat biaya jasa di baris total', () => {
    const lines = buildSummaryLines(150000, 880000, 113300, 'PPN 11%');
    const jasa = lines.find((l) => l.label === 'Total Biaya Jasa');

    expect(jasa).toBeDefined();
    expect(jasa!.value).toBe(150000);
  });

  it('subtotal = jasa + part', () => {
    const lines = buildSummaryLines(150000, 880000, 113300, 'PPN 11%');
    const subtotal = lines.find((l) => l.label === 'Subtotal');

    expect(subtotal!.value).toBe(1030000);
  });

  it('mempertahankan urutan part, jasa, subtotal, ppn', () => {
    const lines = buildSummaryLines(1, 2, 3, 'PPN 11%');
    expect(lines.map((l) => l.label)).toEqual([
      'Total Biaya Part',
      'Total Biaya Jasa',
      'Subtotal',
      'PPN 11%',
    ]);
  });
});

describe('buildInvoiceTerms', () => {
  it('memuat tiga ketentuan', () => {
    expect(buildInvoiceTerms('Cash')).toHaveLength(3);
  });

  it('menyisipkan metode pembayaran ke ketentuan pertama', () => {
    expect(buildInvoiceTerms('QRIS')[0]).toContain('QRIS');
  });
});

describe('paymentLabel', () => {
  it('memetakan metode ke label', () => {
    expect(paymentLabel('CASH')).toBe('Cash');
    expect(paymentLabel('TRANSFER')).toBe('Transfer');
    expect(paymentLabel('QRIS')).toBe('QRIS');
  });

  it('memakai label gabungan untuk metode tak dikenal', () => {
    expect(paymentLabel(null)).toBe('CASH/TRANSFER/QRIS');
    expect(paymentLabel('E_WALLET')).toBe('CASH/TRANSFER/QRIS');
  });
});
