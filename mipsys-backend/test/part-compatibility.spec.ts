import { Test, TestingModule } from '@nestjs/testing';
import {
  PartCompatibilityService,
  normalizeModelName,
} from '../src/inventory/part-compatibility.service';

describe('normalizeModelName', () => {
  it('menyamakan "Epson L3210" dengan "L3210"', () => {
    expect(normalizeModelName('Epson L3210')).toBe(
      normalizeModelName('L3210')
    );
  });

  it('mengabaikan tanda baca dan spasi (LQ-2190 vs LQ2190)', () => {
    expect(normalizeModelName('Epson LQ-2190')).toBe('lq2190');
    expect(normalizeModelName('LQ2190')).toBe('lq2190');
  });

  it('mengembalikan string kosong untuk null/undefined', () => {
    expect(normalizeModelName(null)).toBe('');
    expect(normalizeModelName(undefined)).toBe('');
  });
});

describe('PartCompatibilityService', () => {
  let service: PartCompatibilityService;

  const models = [
    { id: 1, name: 'Epson L3210' },
    { id: 2, name: 'Epson L3110' },
  ];

  const mockDb: any = {
    query: {
      categoryModels: {
        findMany: jest.fn().mockResolvedValue(models),
      },
      spareParts: {
        findFirst: jest.fn(),
      },
      partModelCompatibilities: {
        findFirst: jest.fn(),
      },
    },
    select: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartCompatibilityService,
        { provide: 'DB_CONNECTION', useValue: mockDb },
      ],
    }).compile();

    service = module.get<PartCompatibilityService>(PartCompatibilityService);
    jest.clearAllMocks();
    mockDb.query.categoryModels.findMany.mockResolvedValue(models);
  });

  it('resolveCategoryId cocok exact setelah normalisasi', async () => {
    await expect(service.resolveCategoryId('L3210')).resolves.toBe(1);
    await expect(service.resolveCategoryId('Epson L3110')).resolves.toBe(2);
  });

  it('resolveCategoryId null untuk model tak dikenal', async () => {
    await expect(service.resolveCategoryId('Printer XYZ')).resolves.toBeNull();
    await expect(service.resolveCategoryId('')).resolves.toBeNull();
  });

  it('check lolos untuk part universal tanpa cek model', async () => {
    mockDb.query.spareParts.findFirst.mockResolvedValue({
      id: 11,
      partName: 'Waste Ink Pad',
      isUniversal: true,
    });

    const result = await service.check(11, 'Epson L3210');
    expect(result.ok).toBe(true);
    expect(result.reason).toBe('UNIVERSAL');
  });

  it('check menolak part beda model dengan daftar model kompatibel', async () => {
    mockDb.query.spareParts.findFirst.mockResolvedValue({
      id: 1,
      partName: 'Print Head',
      isUniversal: false,
    });
    mockDb.query.partModelCompatibilities.findFirst.mockResolvedValue(null);
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ name: 'Epson L3210' }]),
        }),
      }),
    });

    const result = await service.check(1, 'Epson L3110');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('MISMATCH');
    expect(result.compatibleModels).toEqual(['Epson L3210']);
  });

  it('check lolos lunak saat model SR tak terpetakan', async () => {
    mockDb.query.spareParts.findFirst.mockResolvedValue({
      id: 1,
      partName: 'Print Head',
      isUniversal: false,
    });

    const result = await service.check(1, 'Model Misterius');
    expect(result.ok).toBe(true);
    expect(result.reason).toBe('UNRESOLVED_MODEL');
  });
});
