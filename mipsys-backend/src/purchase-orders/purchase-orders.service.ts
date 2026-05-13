import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq, desc, and, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../db/schema';
import {
  purchaseOrders,
  spareParts,
  PurchaseOrderStatus,
  PurchaseOrderStatusType,
} from '../db/schema';
import { CreatePurchaseOrderDto } from './dto/create-po.dto';
import { UpdatePoStatusDto } from './dto/update-po-status.dto';

type DrizzleTx = Parameters<
  Parameters<MySql2Database<typeof schema>['transaction']>[0]
>[0];

const VALID_TRANSITIONS: Record<
  PurchaseOrderStatusType,
  PurchaseOrderStatusType[]
> = {
  REQUESTED: ['ORDERED', 'CANCELLED'],
  ORDERED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: [],
  CANCELLED: [],
};

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>
  ) {}

  // ============================================================
  // READ METHODS (DoD: Performance - No N+1)
  // ============================================================

  async findAll() {
    return await this.db
      .select({
        id: purchaseOrders.id,
        partName: purchaseOrders.partName,
        quantity: purchaseOrders.quantity,
        receivedQuantity: purchaseOrders.receivedQuantity,
        unitPrice: purchaseOrders.unitPrice,
        status: purchaseOrders.status,
        sparePartId: purchaseOrders.sparePartId,
        sparePartCode: spareParts.partCode,
        createdAt: purchaseOrders.createdAt,
      })
      .from(purchaseOrders)
      .leftJoin(spareParts, eq(purchaseOrders.sparePartId, spareParts.id))
      .orderBy(desc(purchaseOrders.createdAt));
  }

  async findOne(id: number) {
    const [po] = await this.db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!po) throw new NotFoundException(`PO ID ${id} tidak ditemukan.`);
    return po;
  }

  // ============================================================
  // WRITE METHODS (DoD: Atomic Transactions)
  // ============================================================

  async create(dto: CreatePurchaseOrderDto) {
    try {
      const [result] = await this.db.insert(purchaseOrders).values({
        sparePartId: dto.sparePartId ?? null,
        partName: dto.partName.trim(), // DoD: Security Sanitization
        quantity: dto.quantity,
        unitPrice: dto.unitPrice?.toString() ?? '0',
        notes: dto.notes?.trim(),
        status: 'REQUESTED',
      });

      return { success: true, id: result.insertId };
    } catch (error) {
      console.error('[CREATE_PO_ERROR]', error);
      throw new InternalServerErrorException('Gagal membuat Purchase Order.');
    }
  }

  async updateStatus(id: number, dto: UpdatePoStatusDto) {
    const po = await this.findOne(id);
    const currentStatus = po.status as PurchaseOrderStatusType;
    const newStatus = dto.status as PurchaseOrderStatusType;

    // 1. State Machine Validation (PM Standard)
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transisi dari ${currentStatus} ke ${newStatus} dilarang.`
      );
    }

    return await this.db.transaction(async (tx) => {
      try {
        const updates: any = { status: newStatus, updatedAt: new Date() };
        if (dto.notes) updates.notes = dto.notes.trim();

        // Milestone Dates
        if (newStatus === 'ORDERED') updates.orderedAt = new Date();
        if (newStatus === 'SHIPPED') updates.shippedAt = new Date();

        // 2. Logic: Barang Masuk (Inventory Sync)
        if (newStatus === 'RECEIVED') {
          const receivedQty = dto.receivedQuantity ?? po.quantity;
          if (receivedQty > po.quantity)
            throw new BadRequestException('Jumlah terima melebihi pesanan.');

          updates.receivedAt = new Date();
          updates.receivedQuantity = receivedQty;

          if (po.sparePartId) {
            await tx
              .update(spareParts)
              .set({
                stock: sql`${spareParts.stock} + ${receivedQty}`, // DoD: Atomic Stock Increment
                updatedAt: new Date(),
              })
              .where(eq(spareParts.id, po.sparePartId));
          }
        }

        await tx
          .update(purchaseOrders)
          .set(updates)
          .where(eq(purchaseOrders.id, id));
        return {
          success: true,
          message: `Status PO #${id} diperbarui ke ${newStatus}`,
        };
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        console.error('[UPDATE_PO_ERROR]', error);
        throw new InternalServerErrorException(
          'Gagal memproses perubahan status PO.'
        );
      }
    });
  }

  async cancel(id: number, notes?: string) {
    return this.updateStatus(id, { status: 'CANCELLED', notes });
  }
}
