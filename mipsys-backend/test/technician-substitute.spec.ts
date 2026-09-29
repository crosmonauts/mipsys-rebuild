import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderPartsService } from '../src/order-parts/order-parts.service';
import { PartCompatibilityService } from '../src/inventory/part-compatibility.service';
import { ServiceReportService } from '../src/reports/service-report.service';

/**
 * Skenario yang diuji:
 * 1. Part model lain yang TIDAK kompatibel tidak boleh lolos lewat jalur
 *    normal (addPart) — harus lewat jalur substitusi yang beralasan.
 * 2. Substitusi wajib punya alasan dan tercatat approver-nya.
 * 3. Tiket yang ditutup setelah CANCEL tidak boleh dihitung sebagai
 *    pekerjaan selesai pada laporan kinerja teknisi.
 */

const SR = { id: 42, modelName: 'Epson L3210' };
const COMPATIBLE_PART = { id: 5, partName: 'CRM L3210', price: 275000, stock: 4 };
const INCOMPATIBLE_PART = { id: 9, partName: 'Gear LX310', price: 125000, stock: 7 };

function chainFor(result: unknown) {
  const self: any = {};
  for (const method of ['from', 'where', 'orderBy', 'limit', 'groupBy', 'innerJoin']) {
    self[method] = jest.fn(() => self);
  }
  self.then = (resolve: any, reject: any) =>
    Promise.resolve(result).then(resolve, reject);
  return self;
}

describe('OrderPartsService.addPart (jalur normal tetap ketat)', () => {
  let service: OrderPartsService;
  let inserted: any[];

  const buildService = async (sparePart: any, compatOk: boolean) => {
    inserted = [];
    const db: any = {
      query: {
        spareParts: { findFirst: jest.fn().mockResolvedValue(sparePart) },
        serviceRequests: { findFirst: jest.fn().mockResolvedValue(SR) },
        orderParts: { findFirst: jest.fn().mockResolvedValue(null) },
      },
      insert: jest.fn().mockReturnValue({
        values: (v: any) => {
          inserted.push(v);
          return { returning: jest.fn().mockResolvedValue([{ id: 900, ...v }]) };
        },
      }),
      update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn() }) }),
    };
    const compat = {
      check: jest.fn().mockResolvedValue({
        ok: compatOk,
        reason: compatOk ? 'MATCH' : 'MISMATCH',
        compatibleModels: compatOk ? [] : ['Epson LX310'],
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderPartsService,
        { provide: 'DB_CONNECTION', useValue: db },
        { provide: PartCompatibilityService, useValue: compat },
      ],
    }).compile();
    service = module.get<OrderPartsService>(OrderPartsService);
    return { db, compat };
  };

  it('menolak part yang tidak kompatibel', async () => {
    await buildService(INCOMPATIBLE_PART, false);

    await expect(
      service.addPart({ serviceRequestId: 42, sparePartId: 9, quantity: 1 }, undefined, 'PROPOSED', 'Epson L3210'),
    ).rejects.toThrow(BadRequestException);
    expect(inserted).toHaveLength(0);
  });

  it('menyimpan part kompatibel sebagai PROPOSED biasa (bukan substitusi)', async () => {
    await buildService(COMPATIBLE_PART, true);

    await service.addPart({ serviceRequestId: 42, sparePartId: 5, quantity: 2 }, undefined, 'PROPOSED', 'Epson L3210');

    expect(inserted).toHaveLength(1);
    // addPart tidak menandai substitusi; kolom diisi default schema (false).
    expect(inserted[0].isSubstitute ?? false).toBe(false);
    expect(inserted[0].substituteReason).toBeUndefined();
  });
});

describe('OrderPartsService.addSubstitutePart', () => {
  let service: OrderPartsService;
  let inserted: any[];

  const buildService = async (sparePart: any, compatOk = false) => {
    inserted = [];
    const db: any = {
      query: {
        spareParts: { findFirst: jest.fn().mockResolvedValue(sparePart) },
        serviceRequests: { findFirst: jest.fn().mockResolvedValue(SR) },
        orderParts: { findFirst: jest.fn().mockResolvedValue(null) },
      },
      insert: jest.fn().mockReturnValue({
        values: (v: any) => {
          inserted.push(v);
          return { returning: jest.fn().mockResolvedValue([{ id: 901, ...v }]) };
        },
      }),
      update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn() }) }),
    };
    const compat = {
      check: jest.fn().mockResolvedValue({
        ok: compatOk,
        reason: compatOk ? 'MATCH' : 'MISMATCH',
        compatibleModels: compatOk ? [] : ['Epson LX310'],
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderPartsService,
        { provide: 'DB_CONNECTION', useValue: db },
        { provide: PartCompatibilityService, useValue: compat },
      ],
    }).compile();
    service = module.get<OrderPartsService>(OrderPartsService);
    return { db, compat };
  };

  it('menolak substitusi tanpa alasan', async () => {
    await buildService(INCOMPATIBLE_PART);

    await expect(
      service.addSubstitutePart({
        serviceRequestId: 42,
        sparePartId: 9,
        quantity: 1,
        substituteReason: '   ',
        approvedBy: 1,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(inserted).toHaveLength(0);
  });

  it('menolak substitusi bila part tidak ditemukan', async () => {
    await buildService(null);

    await expect(
      service.addSubstitutePart({
        serviceRequestId: 42,
        sparePartId: 99,
        quantity: 1,
        substituteReason: 'Pelanggan setuju memakai part substitute',
        approvedBy: 1,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('MENERIMA part tidak kompatibel bila alasan diberikan', async () => {
    await buildService(INCOMPATIBLE_PART, false);

    const result = await service.addSubstitutePart({
      serviceRequestId: 42,
      sparePartId: 9,
      quantity: 1,
      substituteReason: 'Gear L3210 habis, pelanggan setuju memakai LX310',
      approvedBy: 1,
    });

    expect(result.success).toBe(true);
    expect(inserted).toHaveLength(1);
  });

  it('menandai part sebagai substitusi dan menyimpan alasan serta approver', async () => {
    await buildService(INCOMPATIBLE_PART, false);

    await service.addSubstitutePart({
      serviceRequestId: 42,
      sparePartId: 9,
      quantity: 1,
      substituteReason: 'Stok part asli kosong',
      approvedBy: 1,
    });

    expect(inserted[0].isSubstitute).toBe(true);
    expect(inserted[0].substituteReason).toBe('Stok part asli kosong');
    expect(inserted[0].substituteApprovedBy).toBe(1);
    expect(inserted[0].substituteApprovedAt).toBeInstanceOf(Date);
    expect(inserted[0].status).toBe('PROPOSED');
  });

  it('menoleransi approver kosong untuk SUPER_ADMIN tanpa staffId', async () => {
    await buildService(INCOMPATIBLE_PART, false);

    await service.addSubstitutePart({
      serviceRequestId: 42,
      sparePartId: 9,
      quantity: 1,
      substituteReason: 'Disetujui supervisor',
      approvedBy: null,
    });

    expect(inserted[0].substituteApprovedBy).toBeNull();
  });

  it('TIDAK memanggil validasi kompatibilitas pada jalur substitusi', async () => {
    const { compat } = await buildService(INCOMPATIBLE_PART, false);

    await service.addSubstitutePart({
      serviceRequestId: 42,
      sparePartId: 9,
      quantity: 1,
      substituteReason: 'Pelanggan setuju',
      approvedBy: 1,
    });

    expect(compat.check).not.toHaveBeenCalled();
  });
});

describe('ServiceReportService.getTechnicianPerformance', () => {
  const buildReport = async (rows: unknown[]) => {
    const db: any = { select: jest.fn(() => chainFor(rows)) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceReportService, { provide: 'DB_CONNECTION', useValue: db }],
    }).compile();
    return module.get<ServiceReportService>(ServiceReportService);
  };

  it('menghitung unit selesai hanya dari tiket yang benar-benar dikerjakan', async () => {
    const service = await buildReport([
      { techName: 'Budi', requestCount: 5, completedCount: 4, avgDays: 2.5 },
    ]);

    const result = await service.getTechnicianPerformance();

    expect(result[0].completedCount).toBe(4);
  });

  it('TIDAK menghitung tiket CANCEL yang ditutup sebagai pekerjaan selesai', async () => {
    // Bug lama: closeTicket men-set statusSystem='CLOSED' untuk jalur CANCEL
    // juga, sehingga tiket batal ikut dihitung sebagai unit selesai.
    // Perbaikan: syarat CLOSED dan readyDate harus terpenuhi bersamaan.
    const service = await buildReport([
      { techName: 'Budi', requestCount: 2, completedCount: 1, avgDays: 1 },
    ]);

    const result = await service.getTechnicianPerformance();

    expect(result[0].completedCount).toBe(1);
  });

  it('TIDAK menghitung tiket DONE yang belum ditutup', async () => {
    const service = await buildReport([
      { techName: 'Budi', requestCount: 3, completedCount: 1, avgDays: 2 },
    ]);

    const result = await service.getTechnicianPerformance();

    expect(result[0].requestCount).toBe(3);
    expect(result[0].completedCount).toBe(1);
  });
});

describe('kueri kinerja teknisi menyaring CLOSED dan readyDate bersamaan', () => {
  /**
   * Agregasi terjadi di SQL, jadi mock unit test tidak membuktikan filter-nya
   * benar. Test ini memeriksa SQL yang benar-benar dibentuk, sehingga regresi
   * ke hitung-terpisah (mis. min(closed, ready)) terdeteksi.
   */
  function renderSql(node: unknown): string {
    if (Array.isArray(node)) return node.map(renderSql).join('');
    if (node && typeof node === 'object') {
      const chunk = node as {
        queryChunks?: unknown[];
        name?: string;
        value?: string[];
        valueLengths?: number[];
      };
      if (Array.isArray(chunk.queryChunks)) return renderSql(chunk.queryChunks);
      if (typeof chunk.name === 'string') return chunk.name;
      // StringChunk menyimpan literal SQL pada .value
      if (Array.isArray(chunk.value)) return chunk.value.join('');
      return '';
    }
    return String(node);
  }

  it('memakai syarat AND untuk status CLOSED dan readyDate', async () => {
    const captured: string[] = [];
    const chain: any = {
      from: jest.fn(() => chain),
      innerJoin: jest.fn(() => chain),
      where: jest.fn(() => chain),
      groupBy: jest.fn(() => chain),
      orderBy: jest.fn(() => chain),
      then: (resolve: (value: unknown[]) => unknown) => {
        captured.push(renderSql(chain.__selection.completedCount));
        return Promise.resolve([]).then(resolve);
      },
    };
    const db: any = {
      select: jest.fn((selection: any) => {
        chain.__selection = selection;
        return chain;
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceReportService, { provide: 'DB_CONNECTION', useValue: db }],
    }).compile();
    const service = module.get<ServiceReportService>(ServiceReportService);

    await service.getTechnicianPerformance();

    const filter = captured[0];
    expect(filter).toContain('status_system');
    expect(filter).toContain('CLOSED');
    expect(filter).toContain('ready_date');
    // Kedua syarat dalam satu filter (AND), bukan dua count terpisah.
    expect(filter).toContain('and');
  });
});
