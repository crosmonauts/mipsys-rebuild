import { InventoryListener } from '../src/inventory/listeners/inventory.listener';
import {
  financeSettings,
  poItems,
  purchaseOrders,
} from '../src/database/schema';

describe('InventoryListener', () => {
  let listener: InventoryListener;
  let db: any;
  let findFirst: jest.Mock;
  let financeValues: jest.Mock;
  let financeOnConflict: jest.Mock;
  let financeReturning: jest.Mock;
  let transaction: jest.Mock;
  let txInsert: jest.Mock;
  let poValues: jest.Mock;
  let poReturning: jest.Mock;
  let itemValues: jest.Mock;
  let loggerError: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));

    findFirst = jest.fn();
    financeReturning = jest.fn().mockResolvedValue([{ value: '1' }]);
    financeOnConflict = jest.fn(() => ({ returning: financeReturning }));
    financeValues = jest.fn(() => ({
      onConflictDoUpdate: financeOnConflict,
    }));

    poReturning = jest.fn().mockResolvedValue([{ id: 77 }]);
    poValues = jest.fn(() => ({ returning: poReturning }));
    itemValues = jest.fn().mockResolvedValue(undefined);

    txInsert = jest.fn((table: unknown) => {
      if (table === purchaseOrders) return { values: poValues };
      if (table === poItems) return { values: itemValues };
      throw new Error('Unexpected table in transaction');
    });

    transaction = jest.fn(async (callback: (tx: any) => Promise<void>) =>
      callback({ insert: txInsert })
    );

    db = {
      query: {
        spareParts: {
          findFirst,
        },
      },
      insert: jest.fn((table: unknown) => {
        if (table === financeSettings) return { values: financeValues };
        throw new Error('Unexpected table');
      }),
      transaction,
    };

    listener = new InventoryListener(db);
    loggerError = jest.fn();
    (listener as any).logger = { error: loggerError };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('tidak membuat PO jika spare part tidak ditemukan', async () => {
    findFirst.mockResolvedValue(null);

    await listener.handleStockLevelChanged({ sparePartId: 7, newStock: 0 });

    expect(transaction).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('tidak membuat PO jika minStock tidak diatur', async () => {
    findFirst.mockResolvedValue({
      id: 7,
      partName: 'Toner',
      minStock: null,
    });

    await listener.handleStockLevelChanged({ sparePartId: 7, newStock: 0 });

    expect(transaction).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('tidak membuat PO jika stok masih aman', async () => {
    findFirst.mockResolvedValue({
      id: 7,
      partName: 'Toner',
      minStock: 5,
    });

    await listener.handleStockLevelChanged({ sparePartId: 7, newStock: 5 });

    expect(transaction).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('membuat PO dan item PO saat stok di bawah minStock', async () => {
    findFirst.mockResolvedValue({
      id: 7,
      partName: 'Toner',
      minStock: 5,
    });

    await listener.handleStockLevelChanged({ sparePartId: 7, newStock: 4 });

    expect(db.insert).toHaveBeenCalledWith(financeSettings);
    expect(financeValues).toHaveBeenCalledWith({
      key: 'po_counter_20260115',
      value: '1',
      description: 'PO counter for 20260115',
    });
    expect(financeOnConflict).toHaveBeenCalledWith({
      target: financeSettings.key,
      set: {
        value: expect.anything(),
      },
    });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(txInsert).toHaveBeenCalledWith(purchaseOrders);
    expect(poValues).toHaveBeenCalledWith({
      poNumber: 'PO-AUTO-20260115-0001',
      supplierName: 'EPSON',
      status: 'REQUESTED',
      requestedBy: 1,
      notes: 'Auto-PO: Toner stok menipis (4 < 5)',
      totalAmount: 0,
    });
    expect(poReturning).toHaveBeenCalledWith({ id: purchaseOrders.id });
    expect(txInsert).toHaveBeenCalledWith(poItems);
    expect(itemValues).toHaveBeenCalledWith({
      purchaseOrderId: 77,
      sparePartId: 7,
      quantity: 10,
      unitPrice: 0,
      receivedQty: 0,
    });
  });

  it('memakai counter PO dari finance_settings', async () => {
    findFirst.mockResolvedValue({
      id: 7,
      partName: 'Toner',
      minStock: 5,
    });
    financeReturning.mockResolvedValueOnce([{ value: '42' }]);

    await listener.handleStockLevelChanged({ sparePartId: 7, newStock: 2 });

    expect(poValues).toHaveBeenCalledWith(
      expect.objectContaining({
        poNumber: 'PO-AUTO-20260115-0042',
      })
    );
  });

  it('menangani kegagalan transaksi tanpa melempar error', async () => {
    findFirst.mockResolvedValue({
      id: 7,
      partName: 'Toner',
      minStock: 5,
    });
    transaction.mockRejectedValueOnce(new Error('database down'));

    await expect(
      listener.handleStockLevelChanged({ sparePartId: 7, newStock: 1 })
    ).resolves.toBeUndefined();

    expect(loggerError).toHaveBeenCalledWith(
      '[AUTO_PO] Gagal membuat PO otomatis untuk part #7:',
      expect.any(Error)
    );
  });
});
