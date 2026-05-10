import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, desc, sql, inArray } from 'drizzle-orm';
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

/** Transisi status yang diizinkan (mesin state sederhana) */
const VALID_TRANSITIONS: Record<
  PurchaseOrderStatusType,
  PurchaseOrderStatusType[]
> = {
  REQUESTED: ['ORDERED', 'CANCELLED'],
  ORDERED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: [], // Status final — tidak bisa berubah
  CANCELLED: [], // Status final — tidak bisa berubah
};

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>
  ) {}

  // ============================================================
  // READ
  // ============================================================

  async findAll() {
    const pos = await this.db
      .select({
        id: purchaseOrders.id,
        partName: purchaseOrders.partName,
        quantity: purchaseOrders.quantity,
        receivedQuantity: purchaseOrders.receivedQuantity,
        unitPrice: purchaseOrders.unitPrice,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        sparePartId: purchaseOrders.sparePartId,
        sparePartCode: spareParts.partCode,
        sparePartStock: spareParts.stock,
        orderedAt: purchaseOrders.orderedAt,
        shippedAt: purchaseOrders.shippedAt,
        receivedAt: purchaseOrders.receivedAt,
        createdAt: purchaseOrders.createdAt,
      })
      .from(purchaseOrders)
      .leftJoin(spareParts, eq(purchaseOrders.sparePartId, spareParts.id))
      .orderBy(desc(purchaseOrders.createdAt));

    return pos;
  }

  async findOne(id: number) {
    const [po] = await this.db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!po)
      throw new NotFoundException(`Purchase Order ID ${id} tidak ditemukan.`);
    return po;
  }

  async findByStatus(status: PurchaseOrderStatusType) {
    return this.db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.status, status))
      .orderBy(desc(purchaseOrders.createdAt));
  }

  // ============================================================
  // CREATE
  // ============================================================

  async create(dto: CreatePurchaseOrderDto) {
    // Validasi: jika sparePartId diberikan, pastikan part ada di master
    if (dto.sparePartId) {
      const [part] = await this.db
        .select({ id: spareParts.id })
        .from(spareParts)
        .where(eq(spareParts.id, dto.sparePartId))
        .limit(1);

      if (!part) {
        throw new NotFoundException(
          `Spare part ID ${dto.sparePartId} tidak ditemukan di master data.`
        );
      }
    }

    const [result] = await this.db.insert(purchaseOrders).values({
      sparePartId: dto.sparePartId ?? null,
      partName: dto.partName,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice?.toString() ?? '0',
      notes: dto.notes,
      status: PurchaseOrderStatus.REQUESTED,
    });

    return {
      success: true,
      message: 'Purchase Order berhasil dibuat.',
      id: result.insertId,
    };
  }

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  /**
   * Memperbarui status PO mengikuti mesin state yang terdefinisi.
   * Saat status berubah ke RECEIVED → stok spare part bertambah otomatis.
   */
  async updateStatus(id: number, dto: UpdatePoStatusDto) {
    const po = await this.findOne(id);
    const currentStatus = po.status as PurchaseOrderStatusType;
    const newStatus = dto.status as PurchaseOrderStatusType;

    // Validasi transisi status
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Tidak bisa mengubah status dari '${currentStatus}' ke '${newStatus}'. ` +
          `Transisi yang diizinkan: ${allowed.join(', ') || 'tidak ada (status final)'}`
      );
    }

    return await this.db.transaction(async (tx) => {
      const updates: Partial<typeof po> & {
        updatedAt?: Date;
        orderedAt?: Date;
        shippedAt?: Date;
        receivedAt?: Date;
        receivedQuantity?: number;
      } = {
        status: newStatus,
        updatedAt: new Date(),
      };

      if (dto.notes) updates.notes = dto.notes;

      if (newStatus === PurchaseOrderStatus.ORDERED) {
        updates.orderedAt = new Date();
      }

      if (newStatus === PurchaseOrderStatus.SHIPPED) {
        updates.shippedAt = new Date();
      }

      if (newStatus === PurchaseOrderStatus.RECEIVED) {
        const receivedQty = dto.receivedQuantity ?? po.quantity;

        if (receivedQty <= 0) {
          throw new BadRequestException(
            'Jumlah barang diterima harus lebih dari 0.'
          );
        }
        if (receivedQty > po.quantity) {
          throw new BadRequestException(
            `Jumlah diterima (${receivedQty}) melebihi quantity PO (${po.quantity}).`
          );
        }

        updates.receivedAt = new Date();
        updates.receivedQuantity = receivedQty;

        // Tambah stok spare part jika PO terhubung ke master
        if (po.sparePartId) {
          await tx
            .update(spareParts)
            .set({
              stock: sql`${spareParts.stock} + ${receivedQty}`,
              updatedAt: new Date(),
            })
            .where(eq(spareParts.id, po.sparePartId));
        }
      }

      await tx
        .update(purchaseOrders)
        .set(updates as any)
        .where(eq(purchaseOrders.id, id));

      return {
        success: true,
        message: `Purchase Order berhasil diperbarui ke status ${newStatus}.`,
        ...(newStatus === PurchaseOrderStatus.RECEIVED && po.sparePartId
          ? { stockAdded: dto.receivedQuantity ?? po.quantity }
          : {}),
      };
    });
  }

  // ============================================================
  // CANCEL
  // ============================================================

  async cancel(id: number, notes?: string) {
    return this.updateStatus(id, {
      status: PurchaseOrderStatus.CANCELLED,
      notes,
    });
  }
}
