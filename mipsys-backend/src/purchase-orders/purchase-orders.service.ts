import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { purchaseOrders, poItems, spareParts } from '../database/schema';
import { CreatePoHeaderDto } from './dto/create-po-header.dto';
import { ReceivePoDto } from './dto/receive-po.dto';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { PoItemsService } from './po-items.service';
import { validatePoTransition, PoStatusType } from './po-state-machine.guard';

type DrizzleTx = Parameters<
  Parameters<MySql2Database<typeof schema>['transaction']>[0]
>[0];

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
    private stockMovementsService: StockMovementsService,
    private poItemsService: PoItemsService
  ) {}

  validateTransition(current: PoStatusType, next: PoStatusType) {
    validatePoTransition(current, next);
  }

  async findAll() {
    return this.db.query.purchaseOrders.findMany({
      orderBy: [desc(purchaseOrders.createdAt)],
    });
  }

  async findOne(id: number) {
    const po = await this.db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, id),
    });
    if (!po) throw new NotFoundException(`PO ID ${id} tidak ditemukan.`);

    const items = await this.poItemsService.getItemsByPO(id);
    return { ...po, items };
  }

  async create(dto: CreatePoHeaderDto) {
    return this.db.transaction(async (tx) => {
      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException('PO harus memiliki minimal 1 item');
      }

      const poNumber = this.generatePoNumber();
      let totalAmount = 0;

      for (const item of dto.items) {
        totalAmount += item.quantity * item.unitPrice;
      }

      const [poResult] = await tx.insert(purchaseOrders).values({
        poNumber,
        supplierName: dto.supplierName || 'EPSON',
        status: 'DRAFT',
        requestedBy: dto.requestedBy,
        notes: dto.notes?.trim() ?? null,
        totalAmount: totalAmount.toString(),
      });

      await this.poItemsService.addItems(tx, poResult.insertId, dto.items);

      return { success: true, id: poResult.insertId, poNumber };
    });
  }

  async updateStatus(id: number, newStatus: PoStatusType, performedBy?: number) {
    const po = await this.findOne(id);
    const currentStatus = po.status as PoStatusType;

    this.validateTransition(currentStatus, newStatus);

    const updates: Record<string, unknown> = { status: newStatus, updatedAt: new Date() };

    if (newStatus === 'APPROVED') updates.approvedBy = performedBy;
    if (newStatus === 'ORDERED') updates.orderDate = new Date();
    if (newStatus === 'RECEIVED') updates.receivedDate = new Date();

    await this.db
      .update(purchaseOrders)
      .set(updates)
      .where(eq(purchaseOrders.id, id));

    return { success: true, message: `Status PO #${id} → ${newStatus}` };
  }

  async receivePO(id: number, dto: ReceivePoDto) {
    return this.db.transaction(async (tx) => {
      const po = await tx.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, id),
      });
      if (!po) throw new NotFoundException(`PO ID ${id} tidak ditemukan.`);

      const currentStatus = po.status as PoStatusType;
      this.validateTransition(currentStatus, 'RECEIVED');

      const items = await tx.query.poItems.findMany({
        where: eq(poItems.purchaseOrderId, id),
      });

      let allFullyReceived = true;

      for (const receiveItem of dto.items) {
        const poItem = items.find((i) => i.id === receiveItem.poItemId);
        if (!poItem) throw new BadRequestException(`Item ID ${receiveItem.poItemId} tidak ditemukan.`);

        if (receiveItem.receivedQty > poItem.quantity) {
          throw new BadRequestException(`Qty terima melebihi pesanan untuk item ${poItem.sparePartId}.`);
        }

        await this.poItemsService.updateReceivedQty(tx, poItem.id, receiveItem.receivedQty);

        await this.stockMovementsService.createMovement(
          {
            sparePartId: poItem.sparePartId,
            quantity: receiveItem.receivedQty,
            movementType: 'PO_RECEIVE',
            referenceType: 'PO_TICKET',
            referenceId: po.poNumber,
            performedBy: dto.performedBy,
          },
          tx
        );

        await tx
          .update(spareParts)
          .set({
            price: poItem.unitPrice,
            updatedAt: new Date(),
          })
          .where(eq(spareParts.id, poItem.sparePartId));

        const newTotalReceived = (poItem.receivedQty || 0) + receiveItem.receivedQty;
        if (newTotalReceived < poItem.quantity) {
          allFullyReceived = false;
        }
      }

      const finalStatus = allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      await tx
        .update(purchaseOrders)
        .set({
          status: finalStatus,
          receivedDate: finalStatus === 'RECEIVED' ? new Date() : po.receivedDate,
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrders.id, id));

      return { success: true, status: finalStatus, message: `PO #${id} → ${finalStatus}` };
    });
  }

  private generatePoNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = String(Math.floor(Math.random() * 9000) + 1000);
    return `PO-${dateStr}-${random}`;
  }
}
