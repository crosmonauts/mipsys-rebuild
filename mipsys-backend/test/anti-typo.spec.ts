import { Test, TestingModule } from '@nestjs/testing';
import { normalizePoItemKey } from '../src/purchase-orders/purchase-orders.service';
import { customerNamePattern } from '../src/service-requests/services/customer-resolver.service';
import { InventoryWriteService } from '../src/inventory/inventory-write.service';
import { InventoryReadService } from '../src/inventory/inventory-read.service';
import { PartCompatibilityService } from '../src/inventory/part-compatibility.service';
import { CategoryModelsService } from '../src/category-models/category-models.service';

describe('anti-typo normalization (RED)', () => {
  it('normalizePoItemKey menyamakan spasi & huruf besar-kecil', () => {
    expect(
      normalizePoItemKey({ partName: ' Head ', modelName: 'L3210' })
    ).toBe(normalizePoItemKey({ partName: 'head', modelName: 'l3210' }));
  });

  it('normalizePoItemKey memakai sparePartId bila ada', () => {
    expect(normalizePoItemKey({ sparePartId: 5 })).toBe(
      normalizePoItemKey({ sparePartId: 5, partName: 'Beda', modelName: 'X' })
    );
  });

  it('customerNamePattern trim spasi untuk pencocokan case-insensitive', () => {
    expect(customerNamePattern('  PT X  ')).toBe('PT X');
  });
});

describe('InventoryWriteService.create menyimpan partCode UPPERCASE-trim', () => {
  it('mengubah sp-001 menjadi SP-001', async () => {
    let saved: any = null;
    const mockDb: any = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockImplementation((vals: any) => {
          saved = vals;
          return {
            returning: jest.fn().mockResolvedValue([{ id: 99, ...vals }]),
          };
        }),
      }),
      transaction: jest.fn(async (cb: any) => cb(mockDb)),
    };
    const mockRead = {
      findByPartNameAndModel: jest.fn().mockResolvedValue(null),
    };
    const mockCompat = {
      resolveCategoryId: jest.fn().mockResolvedValue(1),
      setCompatibilities: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryWriteService,
        { provide: 'DB_CONNECTION', useValue: mockDb },
        { provide: InventoryReadService, useValue: mockRead },
        { provide: PartCompatibilityService, useValue: mockCompat },
      ],
    }).compile();

    const service = module.get<InventoryWriteService>(InventoryWriteService);
    await service.create({
      partCode: 'sp-001 ',
      partName: 'Head',
      modelName: 'L3210',
      price: 1000,
    } as any);

    expect(saved.partCode).toBe('SP-001');
  });
});

describe('CategoryModelsService.create menolak duplikat beda huruf', () => {
  it('menolak l3210 saat L3210 sudah ada', async () => {
    const mockDb: any = {
      query: {
        categoryModels: {
          findFirst: jest.fn().mockResolvedValue({ id: 1, name: 'L3210' }),
        },
        products: { findFirst: jest.fn().mockResolvedValue(null) },
        spareParts: { findFirst: jest.fn().mockResolvedValue(null) },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryModelsService,
        { provide: 'DB_CONNECTION', useValue: mockDb },
      ],
    }).compile();

    const service = module.get<CategoryModelsService>(CategoryModelsService);
    await expect(service.create('l3210')).rejects.toThrow();
  });
});
