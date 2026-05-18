import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, like, or, desc, and, sql, gt, lt } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { spareParts, stockMovements, purchaseOrders, poItems, categoryModels } from '../database/schema';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

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

  async getModels(): Promise<string[]> {
    const rows = await this.db
      .select({ name: categoryModels.name })
      .from(categoryModels)
      .orderBy(categoryModels.name);

    return rows.map((r) => r.name);
  }

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

  async getAll(params?: { search?: string; page?: number; limit?: number }) {
    const search = params?.search;
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const conditions: ReturnType<typeof sql>[] = [];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          like(spareParts.partName, pattern),
          like(spareParts.partCode, pattern),
        ) as any,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ count }]] = await Promise.all([
      this.db.query.spareParts.findMany({
        where,
        orderBy: [desc(spareParts.createdAt)],
        limit,
        offset: (page - 1) * limit,
      }),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(spareParts)
        .where(where ?? undefined),
    ]);

    const total = Number(count);
    return {
      data,
      meta: { total, page, limit, totalPages: total > 0 ? Math.ceil(total / limit) : 0 },
    };
  }

  async getParts(filters?: { status?: 'ok' | 'low' | 'empty'; search?: string }) {
    const conditions: ReturnType<typeof sql>[] = [];

    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(spareParts.partName, pattern),
          like(spareParts.partCode, pattern),
        ) as any,
      );
    }

    if (filters?.status === 'ok') {
      conditions.push(sql`${spareParts.stock} >= ${spareParts.minStock}`);
    } else if (filters?.status === 'low') {
      conditions.push(
        and(
          gt(spareParts.stock, 0),
          sql`${spareParts.stock} < ${spareParts.minStock}`,
        ) as any,
      );
    } else if (filters?.status === 'empty') {
      conditions.push(eq(spareParts.stock, 0) as any);
    }

    return this.db.query.spareParts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(spareParts.partCode)],
    });
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

  async findByPartNameAndModel(partName: string, modelName?: string) {
    const conditions: ReturnType<typeof sql>[] = [
      eq(spareParts.partName, partName.trim()) as any,
    ];
    if (modelName) {
      conditions.push(eq(spareParts.modelName, modelName.trim()) as any);
    }
    return this.db.query.spareParts.findFirst({
      where: and(...conditions),
    });
  }

  async create(dto: CreateSparePartDto) {
    const existingByCode = await this.db
      .select({ id: spareParts.id })
      .from(spareParts)
      .where(eq(spareParts.partCode, dto.partCode.trim()))
      .limit(1);

    if (existingByCode.length > 0) {
      throw new BadRequestException(
        `Kode part '${dto.partCode}' sudah digunakan.`
      );
    }

    const existingByName = await this.findByPartNameAndModel(dto.partName, dto.modelName);
    if (existingByName) {
      throw new BadRequestException(
        `Part dengan nama '${dto.partName}' dan model '${dto.modelName}' sudah ada (ID: ${existingByName.id}). Gunakan endpoint update untuk mengubah data.`
      );
    }

    const [result] = await this.db.insert(spareParts).values({
      partCode: dto.partCode.trim(),
      partName: dto.partName.trim(),
      modelName: dto.modelName.trim(),
      block: dto.block?.trim(),
      stock: dto.stock ?? 0,
      price: dto.price.toString(),
    });

    return { success: true, insertedId: result.insertId };
  }

  async update(id: number, dto: UpdateSparePartDto) {
    await this.getPartById(id);

    await this.db
      .update(spareParts)
      .set({
        ...dto,
        partCode: dto.partCode?.trim(),
        partName: dto.partName?.trim(),
        price: dto.price?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(spareParts.id, id));

    return { success: true, message: 'Data suku cadang berhasil diperbarui.' };
  }

  async addStock(id: number, quantity: number) {
    if (quantity <= 0)
      throw new BadRequestException('Jumlah penambahan harus positif.');

    await this.getPartById(id);

    await this.stockMovementsService.createMovement({
      sparePartId: id,
      quantity,
      movementType: 'ADJUSTMENT',
      notes: `Penambahan stok manual: +${quantity}`,
    });

    await this.stockMovementsService.updateStock(this.db, id, quantity, 'ADJUSTMENT');

    return { success: true, message: 'Stok berhasil ditambah.' };
  }

  async reduceStock(id: number, quantity: number) {
    if (quantity <= 0)
      throw new BadRequestException('Jumlah pengurangan harus positif.');

    await this.getPartById(id);

    await this.stockMovementsService.createMovement({
      sparePartId: id,
      quantity: -quantity,
      movementType: 'ADJUSTMENT',
      notes: `Pengurangan stok manual: -${quantity}`,
    });

    await this.stockMovementsService.updateStock(this.db, id, -quantity, 'ADJUSTMENT');

    return { success: true, message: 'Stok berhasil dikurangi.' };
  }

  async reserveStock(
    sparePartId: number,
    quantity: number,
    srTicketNumber: string,
    performedBy: number,
    tx?: DrizzleTx
  ) {
    const targetDb = tx || this.db;

    const exec = async (db: DrizzleTx) => {
      const part = await db.query.spareParts.findFirst({
        where: eq(spareParts.id, sparePartId),
      });

      if (!part) throw new NotFoundException(`Part ID ${sparePartId} tidak ditemukan.`);

      if (part.stock === 0 || quantity > part.stock) {
        throw new BadRequestException(
          part.stock === 0
            ? `Stok ${part.partName} kosong.`
            : `Stok ${part.partName} tidak mencukupi. Tersedia: ${part.stock}, dibutuhkan: ${quantity}`
        );
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
        db
      );

      await this.stockMovementsService.updateStock(db, sparePartId, -quantity, 'SERVICE_USE');

      let autoPoTriggered = false;
      if (newStock < part.minStock) {
        await this.triggerAutoPo(db, part, newStock);
        autoPoTriggered = true;
      }

      return {
        success: true,
        softBlock: false,
        autoPoTriggered,
        newStock,
        message: `Stok ${part.partName} dikurangi ${quantity}`,
      };
    };

    if (tx) return exec(tx);
    return this.db.transaction((db) => exec(db));
  }

  private async triggerAutoPo(tx: DrizzleTx, part: any, newStock: number) {
    const reorderQty = part.minStock * 2;
    const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const [poResult] = await tx.insert(purchaseOrders).values({
      poNumber,
      supplierName: 'EPSON',
      status: 'REQUESTED',
      requestedBy: 1,
      notes: `Auto-PO: ${part.partName} stok menipis (${newStock} < ${part.minStock})`,
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
