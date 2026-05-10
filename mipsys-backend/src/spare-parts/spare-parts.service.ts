import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
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

  // ==========================================
  // 1. READ OPERATIONS
  // ==========================================

  async findAll() {
    return await this.db
      .select()
      .from(spareParts)
      .orderBy(desc(spareParts.createdAt));
  }

  async findOne(id: number): Promise<SparePart> {
    const [result] = await this.db
      .select()
      .from(spareParts)
      .where(eq(spareParts.id, id))
      .limit(1);

    if (!result)
      throw new NotFoundException(`Suku cadang ID ${id} tidak ditemukan`);
    return result;
  }

  async findByCode(code: string) {
    const [result] = await this.db
      .select()
      .from(spareParts)
      .where(eq(spareParts.partCode, code))
      .limit(1);
    return result;
  }

  async search(query: string) {
    return await this.db
      .select()
      .from(spareParts)
      .where(
        or(
          like(spareParts.partName, `%${query}%`),
          like(spareParts.partCode, `%${query}%`),
          like(spareParts.modelName, `%${query}%`)
        )
      )
      .limit(20);
  }

  // ==========================================
  // 2. WRITE OPERATIONS
  // ==========================================

  async create(data: CreateSparePartDto) {
    // Ubah harga ke string jika di DB tipe DECIMAL untuk akurasi
    const payload = {
      ...data,
      price: data.price?.toString() || '0',
    };

    const [result] = await this.db.insert(spareParts).values(payload as any);

    return {
      success: true,
      message: 'Spare part berhasil ditambahkan',
      insertedId: result.insertId,
    };
  }

  async update(id: number, data: UpdateSparePartDto) {
    await this.findOne(id); // Guard: Pastikan barang ada

    const result = await this.db
      .update(spareParts)
      .set({
        ...data,
        price: data.price?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(spareParts.id, id));

    return {
      success: true,
      message: 'Data suku cadang berhasil diperbarui',
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(spareParts).where(eq(spareParts.id, id));
    return { success: true, message: `Suku cadang ID ${id} berhasil dihapus` };
  }

  // ==========================================
  // 3. INVENTORY LOGIC (STOCK CONTROL)
  // ==========================================

  async addStock(id: number, quantity: number) {
    if (quantity <= 0)
      throw new BadRequestException('Jumlah penambahan harus lebih dari 0');

    await this.findOne(id);

    return await this.db
      .update(spareParts)
      .set({
        stock: sql`${spareParts.stock} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(spareParts.id, id));
  }

  /**
   * Mengurangi stok (Digunakan untuk transaksi di luar ServiceRequest)
   */
  async reduceStock(id: number, quantity: number) {
    const item = await this.findOne(id);
    const currentStock = item.stock ?? 0;

    if (currentStock < quantity) {
      throw new BadRequestException(
        `Stok tidak cukup. Barang: ${item.partName}, Sisa: ${currentStock}, Diminta: ${quantity}`
      );
    }

    return await this.db
      .update(spareParts)
      .set({
        stock: sql`${spareParts.stock} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(spareParts.id, id));
  }
}
