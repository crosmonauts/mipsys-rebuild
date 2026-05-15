import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InventoryService } from '../src/inventory/inventory.service';
import { StockMovementsService } from '../src/stock-movements/stock-movements.service';
import { spareParts, purchaseOrders, poItems } from '../src/database/schema';
import { MySql2Database } from 'drizzle-orm/mysql2';

const mockStockMovementsService = {
  createMovement: jest.fn().mockResolvedValue({ success: true, message: 'Stock movement recorded' }),
};

const mockSparePartsQuery = {
  findMany: jest.fn(),
  findFirst: jest.fn(),
};

const mockInsert = jest.fn().mockReturnValue({
  values: jest.fn().mockResolvedValue([{ insertId: 100 }]),
});

const mockDb = {
  query: {
    spareParts: mockSparePartsQuery,
  },
  insert: mockInsert,
  transaction: jest.fn((cb) => cb(mockDb)),
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: 'DB_CONNECTION', useValue: mockDb },
        { provide: StockMovementsService, useValue: mockStockMovementsService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  describe('searchParts', () => {
    it('should return parts matching query by partName or partCode', async () => {
      const mockParts = [
        { id: 1, partName: 'Fuser Unit', partCode: 'FU-001', stock: 10 },
        { id: 2, partName: 'Paper Tray', partCode: 'PT-002', stock: 5 },
      ];
      mockSparePartsQuery.findMany.mockResolvedValue(mockParts);

      const result = await service.searchParts('Fuser');

      expect(mockSparePartsQuery.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: expect.any(Array),
        limit: 50,
      });
      expect(result).toEqual(mockParts);
    });
  });

  describe('getLowStockAlert', () => {
    it('should return parts where stock < minStock', async () => {
      const lowStockParts = [
        { id: 1, partName: 'Toner Cartridge', partCode: 'TC-001', stock: 2, minStock: 5 },
        { id: 2, partName: 'Drum Unit', partCode: 'DU-001', stock: 0, minStock: 3 },
      ];
      mockSparePartsQuery.findMany.mockResolvedValue(lowStockParts);

      const result = await service.getLowStockAlert();

      expect(mockSparePartsQuery.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: expect.any(Array),
      });
      expect(result).toEqual(lowStockParts);
    });
  });

  describe('reserveStock', () => {
    it('should decrease stock and record SERVICE_USE movement', async () => {
      mockSparePartsQuery.findFirst.mockResolvedValue({
        id: 1,
        partName: 'Fuser Unit',
        partCode: 'FU-001',
        stock: 20,
        minStock: 5,
      });

      const result = await service.reserveStock(1, 3, 'SR-20260515-001', 1);

      expect(result.success).toBe(true);
      expect(result.softBlock).toBe(false);
      expect(result.newStock).toBe(17);
      expect(result.autoPoTriggered).toBe(false);
      expect(mockStockMovementsService.createMovement).toHaveBeenCalledWith(
        {
          sparePartId: 1,
          quantity: -3,
          movementType: 'SERVICE_USE',
          referenceType: 'SR_TICKET',
          referenceId: 'SR-20260515-001',
          performedBy: 1,
        },
        mockDb
      );
    });

    it('should trigger auto-PO when stock falls below minStock', async () => {
      mockSparePartsQuery.findFirst.mockResolvedValue({
        id: 1,
        partName: 'Toner Cartridge',
        partCode: 'TC-001',
        stock: 6,
        minStock: 5,
      });

      const result = await service.reserveStock(1, 2, 'SR-20260515-002', 1);

      expect(result.success).toBe(true);
      expect(result.softBlock).toBe(false);
      expect(result.autoPoTriggered).toBe(true);
      expect(result.newStock).toBe(4);
      expect(mockInsert).toHaveBeenCalledWith(purchaseOrders);
    });

    it('should return soft warning when stock is zero', async () => {
      mockSparePartsQuery.findFirst.mockResolvedValue({
        id: 1,
        partName: 'Paper Roller',
        partCode: 'PR-001',
        stock: 0,
        minStock: 5,
      });

      const result = await service.reserveStock(1, 1, 'SR-20260515-003', 1);

      expect(result.success).toBe(true);
      expect(result.softBlock).toBe(true);
      expect(result.partName).toBe('Paper Roller');
      expect(result.currentStock).toBe(0);
      expect(mockStockMovementsService.createMovement).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when part does not exist', async () => {
      mockSparePartsQuery.findFirst.mockResolvedValue(null);

      await expect(
        service.reserveStock(999, 1, 'SR-20260515-004', 1)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPartById', () => {
    it('should return part when found', async () => {
      const mockPart = {
        id: 1,
        partName: 'Fuser Unit',
        partCode: 'FU-001',
        stock: 10,
        minStock: 5,
      };
      mockSparePartsQuery.findFirst.mockResolvedValue(mockPart);

      const result = await service.getPartById(1);

      expect(result).toEqual(mockPart);
    });

    it('should throw NotFoundException when part not found', async () => {
      mockSparePartsQuery.findFirst.mockResolvedValue(null);

      await expect(service.getPartById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getParts', () => {
    it('should return all parts when no filters', async () => {
      const allParts = [
        { id: 1, partName: 'Fuser Unit', partCode: 'FU-001', stock: 10, minStock: 5 },
        { id: 2, partName: 'Toner', partCode: 'TC-001', stock: 2, minStock: 5 },
        { id: 3, partName: 'Drum', partCode: 'DU-001', stock: 0, minStock: 3 },
      ];
      mockSparePartsQuery.findMany.mockResolvedValue(allParts);

      const result = await service.getParts();

      expect(result).toEqual(allParts);
    });

    it('should filter by status=ok', async () => {
      const allParts = [
        { id: 1, partName: 'Fuser Unit', partCode: 'FU-001', stock: 10, minStock: 5 },
        { id: 2, partName: 'Toner', partCode: 'TC-001', stock: 2, minStock: 5 },
        { id: 3, partName: 'Drum', partCode: 'DU-001', stock: 0, minStock: 3 },
      ];
      mockSparePartsQuery.findMany.mockResolvedValue(allParts);

      const result = await service.getParts({ status: 'ok' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should filter by status=low', async () => {
      const allParts = [
        { id: 1, partName: 'Fuser Unit', partCode: 'FU-001', stock: 10, minStock: 5 },
        { id: 2, partName: 'Toner', partCode: 'TC-001', stock: 2, minStock: 5 },
        { id: 3, partName: 'Drum', partCode: 'DU-001', stock: 0, minStock: 3 },
      ];
      mockSparePartsQuery.findMany.mockResolvedValue(allParts);

      const result = await service.getParts({ status: 'low' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should filter by status=empty', async () => {
      const allParts = [
        { id: 1, partName: 'Fuser Unit', partCode: 'FU-001', stock: 10, minStock: 5 },
        { id: 2, partName: 'Toner', partCode: 'TC-001', stock: 2, minStock: 5 },
        { id: 3, partName: 'Drum', partCode: 'DU-001', stock: 0, minStock: 3 },
      ];
      mockSparePartsQuery.findMany.mockResolvedValue(allParts);

      const result = await service.getParts({ status: 'empty' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });

    it('should filter by search term', async () => {
      const allParts = [
        { id: 1, partName: 'Fuser Unit', partCode: 'FU-001', stock: 10, minStock: 5 },
        { id: 2, partName: 'Toner Cartridge', partCode: 'TC-001', stock: 2, minStock: 5 },
      ];
      mockSparePartsQuery.findMany.mockResolvedValue(allParts);

      const result = await service.getParts({ search: 'toner' });

      expect(result).toHaveLength(1);
      expect(result[0].partName).toBe('Toner Cartridge');
    });
  });
});
