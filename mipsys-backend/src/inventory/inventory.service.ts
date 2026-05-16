import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { eq, like, or, desc, lt } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { spareParts, stockMovements, purchaseOrders, poItems } from '../database/schema';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { ReserveStockDto } from './dto/reserve-stock.dto';

type DrizzleTx = Parameters<
  Parameters<MySql2Database<typeof schema>['transaction']>[0]
>[0];

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
    private stockMovementsService: StockMovementsService
  ) {}

  async searchParts(query: string) {
    const pattern = `%${query}%`;
    return this.db.query.spareParts.findMany({
      where: or(
        like(spareParts.partName, pattern),
        like(spareParts.partCode, pattern),
      ),
      orderBy: [desc(spareParts.stock)],
      limit: 50,
    });
  }

  async getParts(filters?: { status?: 'ok' | 'low' | 'empty'; search?: string }) {
    let parts = await this.db.query.spareParts.findMany({
      orderBy: [desc(spareParts.partCode)],
    });

    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      parts = parts.filter(
        (p) =>
          p.partName?.toLowerCase().includes(filters.search!.toLowerCase()) ||
          p.partCode?.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    if (filters?.status === 'ok') parts = parts.filter((p) => p.stock >= p.minStock);
    if (filters?.status === 'low') parts = parts.filter((p) => p.stock > 0 && p.stock < p.minStock);
    if (filters?.status === 'empty') parts = parts.filter((p) => p.stock === 0);

    return parts;
  }

  async getPartById(id: number) {
    const part = await this.db.query.spareParts.findFirst({
      where: eq(spareParts.id, id),
    });
    if (!part) throw new NotFoundException(`Part ID ${id} tidak ditemukan.`);
    return part;
  }

  async getLowStockAlert() {
    return this.db.query.spareParts.findMany({
      where: lt(spareParts.stock, spareParts.minStock),
      orderBy: [desc(spareParts.stock)],
    });
  }

  async reserveStock(
    sparePartId: number,
    quantity: number,
    srTicketNumber: string,
    performedBy: number
  ) {
    return this.db.transaction(async (tx) => {
      const part = await tx.query.spareParts.findFirst({
        where: eq(spareParts.id, sparePartId),
      });

      if (!part) throw new NotFoundException(`Part ID ${sparePartId} tidak ditemukan.`);

      if (part.stock === 0) {
        return {
          success: true,
          softBlock: true,
          message: `Low Stock — ${part.partName} akan masuk antrian PO`,
          partName: part.partName,
          currentStock: 0,
        };
      }

      if (quantity > part.stock) {
        return {
          success: false,
          softBlock: true,
          message: `Stok tidak mencukupi. Tersedia: ${part.stock}, dibutuhkan: ${quantity}`,
          partName: part.partName,
          currentStock: part.stock,
        };
      }

      const newStock = part.stock - quantity;

      await this.stockMovementsService.createMovement(
        {
          sparePartId,
          quantity: -quantity,
          movementType: 'SERVICE_USE',
          referenceType: 'SR_TICKET',
          referenceId: srTicketNumber,
          performedBy,
        },
        tx
      );

      let autoPoTriggered = false;
      if (newStock < part.minStock) {
        await this.triggerAutoPo(tx, part);
        autoPoTriggered = true;
      }

      return {
        success: true,
        softBlock: false,
        autoPoTriggered,
        newStock,
        message: `Stok ${part.partName} dikurangi ${quantity}`,
      };
    });
  }

  private async triggerAutoPo(tx: DrizzleTx, part: any) {
    const reorderQty = part.minStock * 2;
    const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const [poResult] = await tx.insert(purchaseOrders).values({
      poNumber,
      supplierName: 'EPSON',
      status: 'DRAFT',
      requestedBy: 1,
      notes: `Auto-PO: ${part.partName} stok menipis (${part.stock} < ${part.minStock})`,
      totalAmount: '0.00',
    });

    await tx.insert(poItems).values({
      purchaseOrderId: poResult.insertId,
      sparePartId: part.id,
      quantity: reorderQty,
      unitPrice: '0.00',
      receivedQty: 0,
    });
  }
}
