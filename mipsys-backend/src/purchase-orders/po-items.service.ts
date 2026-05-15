import { Injectable, Inject, InternalServerErrorException, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { poItems } from '../database/schema';

type DrizzleTx = Parameters<
  Parameters<MySql2Database<typeof schema>['transaction']>[0]
>[0];

@Injectable()
export class PoItemsService {
  private readonly logger = new Logger(PoItemsService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>
  ) {}

  async addItems(tx: DrizzleTx, purchaseOrderId: number, items: { sparePartId: number; quantity: number; unitPrice: number }[]) {
    for (const item of items) {
      const subtotal = item.quantity * item.unitPrice;
      await tx.insert(poItems).values({
        purchaseOrderId,
        sparePartId: item.sparePartId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        receivedQty: 0,
        subtotal: subtotal.toString(),
      });
    }
  }

  async getItemsByPO(purchaseOrderId: number) {
    return this.db.query.poItems.findMany({
      where: eq(poItems.purchaseOrderId, purchaseOrderId),
    });
  }

  async updateReceivedQty(tx: DrizzleTx, poItemId: number, receivedQty: number) {
    const item = await this.db.query.poItems.findFirst({
      where: eq(poItems.id, poItemId),
    });
    if (!item) return;

    const newTotalReceived = (item.receivedQty || 0) + receivedQty;
    const subtotal = (newTotalReceived * parseFloat(item.unitPrice)).toString();

    await tx
      .update(poItems)
      .set({ receivedQty: newTotalReceived, subtotal })
      .where(eq(poItems.id, poItemId));
  }
}
