import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from '../src/finance/finance.service';
import { OrderPartsService } from '../src/order-parts/order-parts.service';

describe('FinanceService - generateInvoiceNumber (atomic)', () => {
  let service: FinanceService;
  let mockDb: any;
  let mockOrderPartsService: any;

  beforeEach(async () => {
    mockDb = {
      query: {
        invoices: { findFirst: jest.fn().mockResolvedValue(null) },
        serviceRequests: { findFirst: jest.fn().mockResolvedValue({ id: 25, ticketNumber: 'SR-20260824-0025' }) },
        financeSettings: {
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([
            { key: 'ppn_rate', value: '11' },
            { key: 'ppn_formula', value: 'EXCLUSIVE' },
            { key: 'ppn_rounding', value: 'HALF_UP' },
            { key: 'ppn_inclusive', value: 'false' },
          ]),
        },
      },
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ value: '6' }]),
          }),
          onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
          returning: jest.fn().mockResolvedValue([{ id: 1 }]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      }),
      execute: jest.fn().mockResolvedValue([]),
      transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockDb)),
      select: jest.fn(),
    };

    mockOrderPartsService = {
      getTotalPartsCost: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: 'DB_CONNECTION', useValue: mockDb },
        { provide: OrderPartsService, useValue: mockOrderPartsService },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  it('should increment counter atomically via onConflictDoUpdate RETURNING', async () => {
    const now = new Date();
    const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    mockDb.query.serviceRequests.findFirst = jest.fn().mockResolvedValue({ id: 25, ticketNumber: 'SR-TEST-001' });
    mockDb.query.invoices.findFirst = jest.fn().mockResolvedValue(null);

    const dto: any = {
      ticketNumber: 'SR-TEST-001',
      clientName: 'Test Client',
      serviceFee: 100000,
      partFee: 50000,
    };

    const result = await service.create(dto);

    const expected = `INV-${period}-0006`;
    expect(result.invoiceNumber).toBe(expected);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('should throw BadRequest if active invoice exists', async () => {
    mockDb.query.serviceRequests.findFirst = jest.fn().mockResolvedValue({ id: 25, ticketNumber: 'SR-EXISTS' });
    mockDb.query.invoices.findFirst = jest.fn().mockResolvedValue({ id: 10, serviceRequestId: 25 });

    await expect(
      service.create({ ticketNumber: 'SR-EXISTS', clientName: 'X', serviceFee: 0, partFee: 0 } as any),
    ).rejects.toThrow('Sudah ada invoice');
  });

  it('should create invoice when no active invoice exists', async () => {
    mockDb.query.serviceRequests.findFirst = jest.fn().mockResolvedValue({ id: 25, ticketNumber: 'SR-NEW' });
    mockDb.query.invoices.findFirst = jest.fn().mockResolvedValue(null);

    await expect(
      service.create({ ticketNumber: 'SR-NEW', clientName: 'PT Tes', serviceFee: 10000, partFee: 0 } as any),
    ).resolves.toHaveProperty('success', true);
  });
});
