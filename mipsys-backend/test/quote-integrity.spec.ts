import { BadRequestException } from '@nestjs/common';
import { ServiceRequestService } from '../src/service-requests/service-requests.service';

/**
 * Integritas penawaran saat status WAITING_APPROVE.
 *
 * Dua masalah yang dikunci test ini:
 * 1. Komposisi part boleh direvisi saat menunggu approve, tetapi approve
 *    harus menolak bila total live berbeda dari snapshot sr.partFee
 *    (persetujuan customer menjadi basi tanpa jejaknya).
 * 2. Semua pembaca (saveQuote, approveQuote, invoice) harus menghitung
 *    himpunan part yang sama: semua non-CANCELLED. Kalau approve hanya
 *    menghitung PROPOSED, part berstatus lain ikut ditagih ke invoice
 *    tanpa pernah dipotong dari stok.
 */

const TICKET = 'SR-20260510-0009';

interface PartRow {
  id: number;
  sparePartId: number | null;
  partName: string;
  quantity: number;
  priceAtAction: number;
  status: string;
  isSubstitute?: boolean;
  substituteApprovedAt?: Date | null;
}

function feeOf(parts: PartRow[]): number {
  return parts
    .filter((p) => p.status !== 'CANCELLED')
    .reduce((sum, p) => sum + Number(p.priceAtAction) * p.quantity, 0);
}

/**
 * Fake-DB menerapkan filter status order_parts seperti Postgres sungguhan.
 * Operator dibaca dari queryChunks: `<>` berarti ne(status, ...) sehingga
 * part CANCELLED dibuang, `=` berarti eq(status, 'PROPOSED').
 */
function renderWhere(where: any): string {
  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === 'object') {
      const chunk = node as {
        queryChunks?: unknown[];
        name?: string;
        value?: string[];
      };
      if (Array.isArray(chunk.queryChunks)) {
        walk(chunk.queryChunks);
        return;
      }
      if (typeof chunk.name === 'string') parts.push(chunk.name);
      // StringChunk menyimpan literal SQL ("<>", "=", "and", ...)
      if (Array.isArray(chunk.value)) parts.push(chunk.value.join(''));
      return;
    }
    if (typeof node === 'string') parts.push(node);
  };
  walk(where);
  return parts.join(' ');
}

function applyStatusFilter(parts: PartRow[], where: any): PartRow[] {
  const sql = renderWhere(where);
  if (!/status/i.test(sql)) return parts;
  // ne(status, x) !== <=> operator <>
  if (/<>/.test(sql)) return parts.filter((p) => p.status !== 'CANCELLED');
  // eq(status, 'PROPOSED')
  return parts.filter((p) => p.status === 'PROPOSED');
}

function extractId(where: any): number | null {
  const chunks = where?.queryChunks;
  if (!Array.isArray(chunks)) return null;
  for (const chunk of chunks) {
    if (chunk && typeof chunk === 'object' && chunk.value !== undefined) {
      const value = Array.isArray(chunk.value) ? chunk.value[0] : chunk.value;
      if (typeof value === 'number') return value;
    }
  }
  return null;
}

function buildHarness(options: {
  parts: PartRow[];
  /** Snapshot tersimpan di service_requests.partFee dari saveQuote terakhir. */
  snapshotPartFee: number;
  serviceFee?: number;
  stockByPart?: Record<number, number>;
  compatible?: boolean;
}) {
  const parts = options.parts.map((p) => ({ ...p }));
  const stock = { ...(options.stockByPart ?? {}) };
  const reserved: { sparePartId: number; quantity: number }[] = [];
  const updates: Record<string, unknown>[] = [];
  const activities: { action: string; description: string }[] = [];

  const sr: any = {
    id: 77,
    ticketNumber: TICKET,
    statusService: 'WAITING_APPROVE',
    modelName: 'Epson L3210',
    serviceFee: options.serviceFee ?? 200000,
    partFee: options.snapshotPartFee,
    spDate: null,
  };

  const tx: any = {
    query: {
      serviceRequests: { findFirst: jest.fn().mockResolvedValue(sr) },
      orderParts: {
        findMany: jest.fn(async ({ where }: any = {}) =>
          applyStatusFilter(parts, where),
        ),
      },
      spareParts: {
        findFirst: jest.fn(async ({ where }: any) => {
          const id = extractId(where);
          return id == null
            ? null
            : { id, stock: stock[id] ?? 0, partName: `Part ${id}` };
        }),
      },
    },
    update: jest.fn().mockReturnValue({
      set: jest.fn((values: Record<string, unknown>) => {
        updates.push(values);
        return { where: jest.fn().mockResolvedValue(undefined) };
      }),
    }),
  };

  const db: any = {
    transaction: jest.fn(async (cb: (t: any) => unknown) => cb(tx)),
  };

  // Dependensi dipasang langsung (tanpa DI) supaya test tidak memicu
  // circular import modul yang memang saling merujuk di aplikasi.
  const service = new (ServiceRequestService as any)(
    db,
    {
      reserveStock: jest.fn(
        async (sparePartId: number, quantity: number) => {
          reserved.push({ sparePartId, quantity });
          return { success: true, newStock: stock[sparePartId] - quantity };
        },
      ),
    },
    { getTotalPartsCost: jest.fn(async () => feeOf(parts)) },
    { generateFromServiceRequest: jest.fn() },
    { resolveCustomer: jest.fn() },
    {
      addActivity: jest.fn(
        async (
          _t: unknown,
          _id: number,
          action: string,
          description: string,
        ) => {
          activities.push({ action, description });
        },
      ),
    },
    { getStats: jest.fn() },
    { validate: jest.fn() },
    {
      check: jest.fn().mockResolvedValue({
        ok: options.compatible ?? true,
        reason: 'MATCH',
        compatibleModels: [],
      }),
    },
  );

  return { parts, stock, reserved, updates, activities, sr, service };
}

describe('approveQuote menjaga integritas penawaran', () => {
  it('menolak when komposisi berubah setelah penawaran disimpan', async () => {
    // Snapshot 815.000, lalu Timing Belt (65.000) diganti Damper (85.000).
    const { service, reserved } = buildHarness({
      snapshotPartFee: 815000,
      stockByPart: { 1: 8, 4: 12 },
      parts: [
        {
          id: 1,
          sparePartId: 1,
          partName: 'Print Head',
          quantity: 1,
          priceAtAction: 750000,
          status: 'PROPOSED',
        },
        {
          id: 2,
          sparePartId: 4,
          partName: 'Damper',
          quantity: 1,
          priceAtAction: 85000,
          status: 'PROPOSED',
        },
      ],
    });

    await expect(
      service.approveQuote(TICKET, { performedBy: 1 } as any),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.approveQuote(TICKET, { performedBy: 1 } as any),
    ).rejects.toThrow(/berubah setelah penawaran disimpan/i);
    expect(reserved).toHaveLength(0);
  });

  it('menerima when komposisi sama dengan snapshot (alur normal tidak kena guard)', async () => {
    const { service, reserved } = buildHarness({
      snapshotPartFee: 815000,
      stockByPart: { 1: 8, 7: 15 },
      parts: [
        {
          id: 1,
          sparePartId: 1,
          partName: 'Print Head',
          quantity: 1,
          priceAtAction: 750000,
          status: 'PROPOSED',
        },
        {
          id: 2,
          sparePartId: 7,
          partName: 'Timing Belt',
          quantity: 1,
          priceAtAction: 65000,
          status: 'PROPOSED',
        },
      ],
    });

    const result = await service.approveQuote(TICKET, { performedBy: 1 } as any);

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe('SERVICE');
    expect(result.partFee).toBe(815000);
    expect(reserved).toHaveLength(2);
  });

  it('menerima after penawaran disimpan ulang dengan komposisi baru', async () => {
    // saveQuote ulang: snapshot mengikuti komposisi terkini = 835.000
    const { service, reserved } = buildHarness({
      snapshotPartFee: 835000,
      stockByPart: { 1: 8, 4: 12 },
      parts: [
        {
          id: 1,
          sparePartId: 1,
          partName: 'Print Head',
          quantity: 1,
          priceAtAction: 750000,
          status: 'PROPOSED',
        },
        {
          id: 2,
          sparePartId: 4,
          partName: 'Damper',
          quantity: 1,
          priceAtAction: 85000,
          status: 'PROPOSED',
        },
      ],
    });

    const result = await service.approveQuote(TICKET, { performedBy: 1 } as any);

    expect(result.success).toBe(true);
    expect(result.partFee).toBe(835000);
    expect(reserved).toHaveLength(2);
  });

  it('memproses part non-PROPOSED (IN_STOCK) agar tidak ditagih tanpa potong stok', async () => {
    // Part IN_STOCK muncul bila ditambahkan lewat API langsung, bukan diagnosa.
    const { service, reserved } = buildHarness({
      snapshotPartFee: 835000,
      stockByPart: { 1: 8, 4: 12 },
      parts: [
        {
          id: 1,
          sparePartId: 1,
          partName: 'Print Head',
          quantity: 1,
          priceAtAction: 750000,
          status: 'PROPOSED',
        },
        {
          id: 2,
          sparePartId: 4,
          partName: 'Damper',
          quantity: 1,
          priceAtAction: 85000,
          status: 'IN_STOCK',
        },
      ],
    });

    const result = await service.approveQuote(TICKET, { performedBy: 1 } as any);

    // IN_STOCK ikut diproses: dua part direservasi, fee mencakup keduanya.
    expect(result.partsProcessed).toBe(2);
    expect(result.partFee).toBe(835000);
    expect(reserved.map((r) => r.sparePartId)).toEqual([1, 4]);
  });

  it('mengabaikan part CANCELLED saat menghitung fee dan reservasi', async () => {
    const { service, reserved } = buildHarness({
      snapshotPartFee: 750000,
      stockByPart: { 1: 8 },
      parts: [
        {
          id: 1,
          sparePartId: 1,
          partName: 'Print Head',
          quantity: 1,
          priceAtAction: 750000,
          status: 'PROPOSED',
        },
        {
          id: 3,
          sparePartId: 4,
          partName: 'Damper',
          quantity: 1,
          priceAtAction: 85000,
          status: 'CANCELLED',
        },
      ],
    });

    const result = await service.approveQuote(TICKET, { performedBy: 1 } as any);

    expect(result.partFee).toBe(750000);
    expect(reserved).toHaveLength(1);
  });

  it('menolak when semua part dibatalkan (snapshot tidak lagi cocok)', async () => {
    const { service } = buildHarness({
      snapshotPartFee: 815000,
      parts: [
        {
          id: 1,
          sparePartId: 1,
          partName: 'Print Head',
          quantity: 1,
          priceAtAction: 750000,
          status: 'CANCELLED',
        },
        {
          id: 2,
          sparePartId: 7,
          partName: 'Timing Belt',
          quantity: 1,
          priceAtAction: 65000,
          status: 'CANCELLED',
        },
      ],
    });

    await expect(
      service.approveQuote(TICKET, { performedBy: 1 } as any),
    ).rejects.toThrow(BadRequestException);
  });
});
