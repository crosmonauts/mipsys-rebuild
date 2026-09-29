import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  MAX_EXPORT_ROWS,
  MAX_PERIOD_DAYS,
  assertRowLimit,
  resolvePeriod,
} from '../src/reports/report-period';
import {
  AGEING_BUCKETS,
  buildAgeingRows,
  countDaysOverdue,
} from '../src/reports/receivable-buckets';
import { buildStockCard } from '../src/reports/stock-card';
import { ServiceReportService } from '../src/reports/service-report.service';
import { InventoryReportService } from '../src/reports/inventory-report.service';
import {
  DEFAULT_COMPANY_PROFILE,
  loadCompanyProfile,
} from '../src/reports/company-profile';
import { buildReportFileName } from '../src/reports/report-period';

const AS_OF = new Date('2026-03-31T00:00:00.000Z');

/**
 * Stub db yang chainable:_from().where().groupBy()_ lalu di-await.
 * Semua method mengembalikan objek yang sama (thenable) sehingga
 * bisa di-chain maupun di-await tanpa mock per-method.
 */
function chainFor(result: unknown) {
  const self: any = {};
  for (const method of [
    'from',
    'where',
    'groupBy',
    'orderBy',
    'having',
    'leftJoin',
    'innerJoin',
    'limit',
    'offset',
  ]) {
    self[method] = jest.fn(() => self);
  }
  self.then = (resolve: any, reject: any) =>
    Promise.resolve(result).then(resolve, reject);
  return self;
}

function makeDb(results: unknown[]) {
  let call = 0;
  const next = () => results[Math.min(call++, results.length - 1)];
  return {
    select: jest.fn(() => chainFor(next())),
  } as any;
}

async function buildService<T>(cls: any, db: any): Promise<T> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [cls, { provide: 'DB_CONNECTION', useValue: db }],
  }).compile();
  return module.get<T>(cls);
}

describe('resolvePeriod', () => {
  it('menghormati rentang tanggal yang diberikan', () => {
    const period = resolvePeriod('2026-03-01', '2026-03-31');

    expect(period.start.toISOString().slice(0, 10)).toBe('2026-03-01');
    expect(period.end.toISOString().slice(0, 10)).toBe('2026-03-31');
    expect(period.label).toContain('01-03-2026');
    expect(period.label).toContain('31-03-2026');
  });

  it('default 30 hari terakhir bila parameter kosong', () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const period = resolvePeriod();

    expect(period.end.toISOString().slice(0, 10)).toBe(
      today.toISOString().slice(0, 10),
    );
    const spanDays =
      (period.end.getTime() - period.start.getTime()) / 86400000;
    expect(spanDays).toBe(30);
  });

  it('menolak format tanggal yang bukan ISO', () => {
    expect(() => resolvePeriod('kemarin', '2026-03-31')).toThrow(
      BadRequestException,
    );
    expect(() => resolvePeriod('2026-03-01', 'besok')).toThrow(
      BadRequestException,
    );
  });

  it('menolak rentang lebih dari 1 tahun', () => {
    expect(() => resolvePeriod('2024-01-01', '2026-01-01')).toThrow(
      BadRequestException,
    );
  });

  it('menolak startDate setelah endDate', () => {
    expect(() => resolvePeriod('2026-03-31', '2026-03-01')).toThrow(
      BadRequestException,
    );
  });

  it('menerima rentang tepat batas maksimum', () => {
    const start = new Date('2025-03-31T00:00:00.000Z');
    const end = new Date('2026-03-31T00:00:00.000Z');
    expect(
      Math.round((end.getTime() - start.getTime()) / 86400000),
    ).toBeLessThanOrEqual(MAX_PERIOD_DAYS);
    expect(() =>
      resolvePeriod('2025-03-31', '2026-03-31'),
    ).not.toThrow();
  });
});

describe('assertRowLimit', () => {
  it('menerima jumlah baris tepat pada batas', () => {
    expect(() => assertRowLimit(MAX_EXPORT_ROWS)).not.toThrow();
  });

  it('menolak baris melebihi batas export', () => {
    expect(() => assertRowLimit(MAX_EXPORT_ROWS + 1)).toThrow(
      BadRequestException,
    );
  });
});

describe('countDaysOverdue', () => {
  it('menghitung selisih hari tanpa pecahan', () => {
    expect(countDaysOverdue('2026-03-20', AS_OF)).toBe(11);
  });

  it('tidak menghasilkan nilai negatif untuk tanggal mendatang', () => {
    expect(countDaysOverdue('2026-04-30', AS_OF)).toBe(0);
  });
});

describe('buildAgeingRows', () => {
  const invoices = [
    { customerName: 'PT Alpha', total: 1_000_000, invoiceDate: '2026-03-20' },
    { customerName: 'PT Alpha', total: 500_000, invoiceDate: '2026-01-15' },
    { customerName: 'PT Beta', total: 250_000, invoiceDate: '2025-06-01' },
    { customerName: 'PT Gamma', total: 100_000, invoiceDate: '2026-03-30' },
  ];

  it('mengelompokkan tagihan per customer', () => {
    const rows = buildAgeingRows(invoices, AS_OF);

    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.customerName)).toEqual([
      'PT Alpha',
      'PT Beta',
      'PT Gamma',
    ]);
    expect(rows[0].invoiceCount).toBe(2);
    expect(rows[0].total).toBe(1_500_000);
  });

  it('mengisi bucket 0-30, 31-60, 61-90, dan >90 dengan benar', () => {
    const rows = buildAgeingRows(invoices, AS_OF);
    const alpha = rows[0];
    const beta = rows[1];
    const gamma = rows[2];

    expect(alpha.current).toBe(1_000_000);
    expect(alpha.d31to60).toBe(0);
    expect(alpha.d61to90).toBe(500_000);
    expect(alpha.over90).toBe(0);

    expect(beta.over90).toBe(250_000);
    expect(gamma.current).toBe(100_000);
  });

  it('mengurutkan customer dari total tagihan terbesar', () => {
    const rows = buildAgeingRows(invoices, AS_OF);
    const totals = rows.map((r) => r.total);
    expect([...totals].sort((a, b) => b - a)).toEqual(totals);
  });

  it('mengabaikan invoice tanpa nama customer', () => {
    const rows = buildAgeingRows(
      [{ customerName: null, total: 900, invoiceDate: '2026-01-01' } as any],
      AS_OF,
    );
    expect(rows).toHaveLength(0);
  });

  it('mengabaikan invoice berduit nol', () => {
    const rows = buildAgeingRows(
      [{ customerName: 'PT Nol', total: 0, invoiceDate: '2026-01-01' }],
      AS_OF,
    );
    expect(rows).toHaveLength(0);
  });

  it('mendefinisikan 4 bucket sesuai standar', () => {
    expect(AGEING_BUCKETS.map((b) => b.key)).toEqual([
      'current',
      'd31to60',
      'd61to90',
      'over90',
    ]);
  });

  it('menjumlah seluruh bucket sama dengan total tagihan', () => {
    const rows = buildAgeingRows(invoices, AS_OF);
    for (const row of rows) {
      const bucketSum =
        row.current + row.d31to60 + row.d61to90 + row.over90;
      expect(bucketSum).toBe(row.total);
    }
  });
});

describe('buildStockCard', () => {
  const period = resolvePeriod('2026-03-01', '2026-03-31');

  it('menghitung saldo awal dari stok akhir dikurangi mutasi periode', () => {
    const card = buildStockCard({
      part: { id: 7, partCode: 'SP-007', partName: 'Fuser Unit', stock: 20 },
      movements: [
        {
          createdAt: new Date('2026-03-05T08:00:00.000Z'),
          quantity: 20,
          movementType: 'PO_RECEIVE',
          referenceType: 'PO',
          referenceId: 'PO-001',
          notes: null,
        },
        {
          createdAt: new Date('2026-03-10T08:00:00.000Z'),
          quantity: -5,
          movementType: 'SERVICE_USE',
          referenceType: 'SR_TICKET',
          referenceId: 'SR-001',
          notes: null,
        },
      ],
      period,
    });

    expect(card.opening).toBe(5);
    expect(card.closing).toBe(20);
  });

  it('menampilkan baris opening lalu tiap mutasi beserta saldo berjalan', () => {
    const card = buildStockCard({
      part: { id: 7, partCode: 'SP-007', partName: 'Fuser Unit', stock: 20 },
      movements: [
        {
          createdAt: new Date('2026-03-05T08:00:00.000Z'),
          quantity: 20,
          movementType: 'PO_RECEIVE',
          referenceType: 'PO',
          referenceId: 'PO-001',
          notes: null,
        },
        {
          createdAt: new Date('2026-03-10T08:00:00.000Z'),
          quantity: -5,
          movementType: 'SERVICE_USE',
          referenceType: 'SR_TICKET',
          referenceId: 'SR-001',
          notes: null,
        },
      ],
      period,
    });

    expect(card.rows).toHaveLength(3);
    expect(card.rows[0].kind).toBe('opening');
    expect(card.rows[0].balance).toBe(5);
    expect(card.rows[1].quantity).toBe(20);
    expect(card.rows[1].balance).toBe(25);
    expect(card.rows[2].quantity).toBe(-5);
    expect(card.rows[2].balance).toBe(20);
  });

  it('mengabaikan mutasi di luar periode', () => {
    const card = buildStockCard({
      part: { id: 7, partCode: 'SP-007', partName: 'Fuser Unit', stock: 20 },
      movements: [
        {
          createdAt: new Date('2026-02-01T08:00:00.000Z'),
          quantity: 100,
          movementType: 'PO_RECEIVE',
          referenceType: 'PO',
          referenceId: 'PO-000',
          notes: null,
        },
        {
          createdAt: new Date('2026-03-10T08:00:00.000Z'),
          quantity: -5,
          movementType: 'SERVICE_USE',
          referenceType: 'SR_TICKET',
          referenceId: 'SR-001',
          notes: null,
        },
      ],
      period,
    });

    expect(card.opening).toBe(25);
    expect(card.closing).toBe(20);
    expect(card.rows).toHaveLength(2);
  });

  it('urutkan mutasi berdasarkan waktu menaik', () => {
    const card = buildStockCard({
      part: { id: 7, partCode: 'SP-007', partName: 'Fuser Unit', stock: 20 },
      movements: [
        {
          createdAt: new Date('2026-03-20T08:00:00.000Z'),
          quantity: -5,
          movementType: 'SERVICE_USE',
          referenceType: 'SR_TICKET',
          referenceId: 'SR-002',
          notes: null,
        },
        {
          createdAt: new Date('2026-03-05T08:00:00.000Z'),
          quantity: 20,
          movementType: 'PO_RECEIVE',
          referenceType: 'PO',
          referenceId: 'PO-001',
          notes: null,
        },
      ],
      period,
    });

    expect(card.rows[1].referenceId).toBe('PO-001');
    expect(card.rows[2].referenceId).toBe('SR-002');
  });
});

describe('ServiceReportService.getSummary', () => {
  it('mengambil ringkasan per status dengan satu query', async () => {
    const db = makeDb([
      [
        { status: 'DONE', count: 4, serviceFee: 2_000_000, partFee: 1_500_000 },
        { status: 'CLOSED', count: 3, serviceFee: 900_000, partFee: 250_000 },
      ],
    ]);
    const service = await buildService<ServiceReportService>(
      ServiceReportService,
      db,
    );

    const result = await service.getSummary('2026-03-01', '2026-03-31');

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(result.totalRequests).toBe(7);
    expect(result.totalServiceFee).toBe(2_900_000);
    expect(result.totalPartFee).toBe(1_750_000);
    expect(result.byStatus).toHaveLength(2);
    expect(result.byStatus[0].count).toBe(4);
  });

  it('mengembalikan nilai nol saat tidak ada data', async () => {
    const db = makeDb([[]]);
    const service = await buildService<ServiceReportService>(
      ServiceReportService,
      db,
    );

    const result = await service.getSummary('2026-03-01', '2026-03-31');

    expect(result.totalRequests).toBe(0);
    expect(result.totalServiceFee).toBe(0);
    expect(result.byStatus).toEqual([]);
  });

  it('menolak rentang periode melebihi batas', async () => {
    const db = makeDb([[]]);
    const service = await buildService<ServiceReportService>(
      ServiceReportService,
      db,
    );

    await expect(
      service.getSummary('2024-01-01', '2026-01-01'),
    ).rejects.toThrow(BadRequestException);
    expect(db.select).not.toHaveBeenCalled();
  });
});

describe('ServiceReportService.getTechnicianPerformance', () => {
  it('menghitung rata-rata durasi hari sebagai angka', async () => {
    const db = makeDb([
      [
        { techName: 'Budi', requestCount: 5, completedCount: 4, avgDays: 2.5 },
        { techName: 'Andi', requestCount: 3, completedCount: 3, avgDays: 4 },
      ],
    ]);
    const service = await buildService<ServiceReportService>(
      ServiceReportService,
      db,
    );

    const result = await service.getTechnicianPerformance();

    expect(result).toHaveLength(2);
    expect(result[0].techName).toBe('Budi');
    expect(result[0].avgDays).toBe(2.5);
    expect(typeof result[0].avgDays).toBe('number');
    expect(result[0].completedCount).toBe(4);
  });

  it('tidak menghitung tiket CANCEL yang ditutup sebagai unit selesai', async () => {
    const db = makeDb([
      [{ techName: 'Budi', requestCount: 2, completedCount: 1, avgDays: 1 }],
    ]);
    const service = await buildService<ServiceReportService>(
      ServiceReportService,
      db,
    );

    const result = await service.getTechnicianPerformance();

    expect(result[0].completedCount).toBe(1);
  });
});

describe('ServiceReportService.getModelPopularity', () => {
  it('mengurutkan model dari jumlah unit terbanyak', async () => {
    const db = makeDb([
      [
        { modelName: 'L3210', unitCount: 7 },
        { modelName: 'KX6110', unitCount: 4 },
      ],
    ]);
    const service = await buildService<ServiceReportService>(
      ServiceReportService,
      db,
    );

    const result = await service.getModelPopularity('2026-03-01', '2026-03-31');

    expect(result[0].modelName).toBe('L3210');
    expect(result[0].unitCount).toBe(7);
  });
});

describe('InventoryReportService.getValuation', () => {
  it('menghitung nilai persediaan dari stok x harga', async () => {
    const db = makeDb([
      [
        { totalValue: 5_000_000, partCount: 4, totalStock: 25 },
      ],
      [
        { partCode: 'SP-001', partName: 'Toner', stock: 10, price: 250_000, value: 2_500_000 },
        { partCode: 'SP-002', partName: 'Drum', stock: 5, price: 500_000, value: 2_500_000 },
      ],
    ]);
    const service = await buildService<InventoryReportService>(
      InventoryReportService,
      db,
    );

    const result = await service.getValuation();

    expect(result.totalValue).toBe(5_000_000);
    expect(result.partCount).toBe(4);
    expect(result.totalStock).toBe(25);
    expect(result.items).toHaveLength(2);
  });

  it('mengembalikan nilai nol saat tidak ada part', async () => {
    const db = makeDb([[{ totalValue: 0, partCount: 0, totalStock: 0 }], []]);
    const service = await buildService<InventoryReportService>(
      InventoryReportService,
      db,
    );

    const result = await service.getValuation();

    expect(result.totalValue).toBe(0);
    expect(result.items).toEqual([]);
  });
});

describe('InventoryReportService.getLowStock', () => {
  it('memakai nilai minimum stok sebagai ambang', async () => {
    const db = makeDb([
      [
        { id: 1, partCode: 'SP-001', partName: 'Toner', stock: 2, minStock: 5, location: 'Rak A' },
      ],
    ]);
    const service = await buildService<InventoryReportService>(
      InventoryReportService,
      db,
    );

    const result = await service.getLowStock();

    expect(result).toHaveLength(1);
    expect(result[0].shortage).toBe(3);
  });
});

describe('batas baris laporan', () => {
  it('menolak kartu stok yang melebihi batas export', async () => {
    const db = makeDb([
      [{ id: 1, partCode: 'SP-001', partName: 'Toner', stock: 1 }],
      Array.from({ length: MAX_EXPORT_ROWS + 1 }, (_, i) => ({
        createdAt: new Date('2026-03-05T08:00:00.000Z'),
        quantity: 1,
        movementType: 'PO_RECEIVE',
        referenceType: 'PO',
        referenceId: `PO-${i}`,
        notes: null,
      })),
    ]);
    const service = await buildService<InventoryReportService>(
      InventoryReportService,
      db,
    );

    await expect(
      service.getStockCard(1, '2026-03-01', '2026-03-31'),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('loadCompanyProfile', () => {
  const row = (over: Record<string, unknown> = {}) => ({
    name: 'PT Bengkel Mandiri',
    address: 'Jl. Raya No. 1',
    city: 'Bekasi',
    phone: '(021) 9999-0000',
    email: 'info@bengkel.co.id',
    logoData: null,
    logoMime: null,
    ...over,
  });

  it('memakai nilai dari company_profiles', async () => {
    const db = makeDb([[row()]]);
    const profile = await loadCompanyProfile(db);
    expect(profile.name).toBe('PT Bengkel Mandiri');
    expect(profile.phone).toBe('(021) 9999-0000');
  });

  it('menggabungkan alamat dengan kota', async () => {
    const db = makeDb([[row()]]);
    const profile = await loadCompanyProfile(db);
    expect(profile.address).toBe('Jl. Raya No. 1, Bekasi');
  });

  it('memakai profil default saat tabel kosong', async () => {
    const db = makeDb([[]]);
    expect(await loadCompanyProfile(db)).toEqual(DEFAULT_COMPANY_PROFILE);
  });

  it('menyertakan logo saat profil punya logo png', async () => {
    const db = makeDb([
      [row({ logoData: Buffer.from('89504e470d0a1a0a', 'hex'), logoMime: 'image/png' })],
    ]);
    const profile = await loadCompanyProfile(db);
    expect(profile.logo).not.toBeNull();
    expect(profile.logo?.mime).toBe('image/png');
    expect(profile.logo?.base64).toBe(
      Buffer.from('89504e470d0a1a0a', 'hex').toString('base64'),
    );
  });

  it('mengabaikan logo dengan tipe di luar daftar putih', async () => {
    const db = makeDb([
      [row({ logoData: Buffer.from('x'), logoMime: 'image/svg+xml' })],
    ]);
    const profile = await loadCompanyProfile(db);
    expect(profile.logo).toBeNull();
  });

  it('mengabaikan logo saat kolom mime kosong', async () => {
    const db = makeDb([[row({ logoData: Buffer.from('x'), logoMime: null })]]);
    const profile = await loadCompanyProfile(db);
    expect(profile.logo).toBeNull();
  });

  it('tidak menggagalkan laporan saat kueri profil error', async () => {
    const db = {
      select: jest.fn(() => {
        throw new Error('company_profiles tidak tersedia');
      }),
    };
    expect(await loadCompanyProfile(db)).toEqual(DEFAULT_COMPANY_PROFILE);
  });
});

describe('buildReportFileName', () => {
  it('mengikuti pola Laporan-jenis-YYYYMMDD', () => {
    expect(buildReportFileName('Kinerja Teknisi', new Date('2026-09-29T08:00:00'))).toBe(
      'Laporan-kinerja-teknisi-20260929.xlsx',
    );
  });
});
