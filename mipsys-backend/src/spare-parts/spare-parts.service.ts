import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq, like, sql, or, desc, InferSelectModel } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../db/schema';
import { spareParts } from '../db/schema';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

export type SparePart = InferSelectModel<typeof spareParts>;

@Injectable()
export class SparePartsService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>
  ) {}

  // DoD: Error Handling - Mencatat ke log sistem
  private async logInventoryError(action: string, error: any, context?: any) {
    console.error(`[SPARE_PART_SYSTEM_ERROR][${action}]`, error);
    // await this.db.insert(logSystem)...
  }

  // ============================================================
  // READ METHODS
  // ============================================================

  async findAll() {
    return await this.db
      .select()
      .from(spareParts)
      .orderBy(desc(spareParts.createdAt));
  }

  async findOne(id: number) {
    const [result] = await this.db
      .select()
      .from(spareParts)
      .where(eq(spareParts.id, id))
      .limit(1);

    if (!result)
      throw new NotFoundException(`Suku cadang ID ${id} tidak ditemukan.`);
    return result;
  }

  // ============================================================
  // WRITE METHODS (DoD: Security - Sanitization & Uniqueness)
  // ============================================================

  async create(dto: CreateSparePartDto) {
    try {
      // 1. Check Duplicity (Anti-Defect: Mencegah kode ganda)
      const existing = await this.db
        .select({ id: spareParts.id })
        .from(spareParts)
        .where(eq(spareParts.partCode, dto.partCode.trim()))
        .limit(1);

      if (existing.length > 0) {
        throw new BadRequestException(
          `Kode part '${dto.partCode}' sudah digunakan.`
        );
      }

      // 2. Insert with Sanitization
      const [result] = await this.db.insert(spareParts).values({
        partCode: dto.partCode.trim(),
        partName: dto.partName.trim(),
        modelName: dto.modelName.trim(),
        block: dto.block?.trim(),
        stock: dto.stock ?? 0,
        price: dto.price.toString(),
      });

      return { success: true, insertedId: result.insertId };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      await this.logInventoryError('CREATE_PART', error, dto);
      throw new InternalServerErrorException('Gagal menambahkan suku cadang.');
    }
  }

  async update(id: number, dto: UpdateSparePartDto) {
    const existing = await this.findOne(id); // Guard: DoD Security

    try {
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

      return {
        success: true,
        message: 'Data suku cadang berhasil diperbarui.',
      };
    } catch (error) {
      await this.logInventoryError('UPDATE_PART', error, { id, dto });
      throw new InternalServerErrorException('Gagal memperbarui suku cadang.');
    }
  }

  // ============================================================
  // INVENTORY CONTROL (DoD: Performance - Atomic Updates)
  // ============================================================

  async addStock(id: number, quantity: number) {
    if (quantity <= 0)
      throw new BadRequestException('Jumlah penambahan harus positif.');

    await this.findOne(id);

    await this.db
      .update(spareParts)
      .set({
        stock: sql`${spareParts.stock} + ${quantity}`, // Atomic: Anti Race Condition
        updatedAt: new Date(),
      })
      .where(eq(spareParts.id, id));

    return { success: true, message: `Stok berhasil ditambah.` };
  }

  async reduceStock(id: number, quantity: number) {
    const item = await this.findOne(id);
    const currentStock = item.stock ?? 0;

    if (quantity <= 0)
      throw new BadRequestException('Jumlah pengurangan harus positif.');
    if (currentStock < quantity) {
      throw new BadRequestException(
        `Stok tidak cukup. Tersedia: ${currentStock}`
      );
    }

    await this.db
      .update(spareParts)
      .set({
        stock: sql`${spareParts.stock} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(spareParts.id, id));

    return { success: true, message: `Stok berhasil dikurangi.` };
  }
}
