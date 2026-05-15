import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { eq, sql, desc, like, or } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { spareParts } from '../database/schema';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { StockMovementsService } from '../stock-movements/stock-movements.service';

@Injectable()
export class SparePartsService {
  private readonly logger = new Logger(SparePartsService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
    private stockMovementsService: StockMovementsService
  ) {}

  async findAll() {
    return await this.db
      .select()
      .from(spareParts)
      .orderBy(desc(spareParts.createdAt));
  }

  async search(query: string) {
    const pattern = `%${query}%`;

    return this.db
      .select()
      .from(spareParts)
      .where(
        or(
          like(spareParts.partName, pattern),
          like(spareParts.partCode, pattern),
          like(spareParts.modelName, pattern),
        )
      )
      .orderBy(desc(spareParts.stock))
      .limit(20);
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

  async create(dto: CreateSparePartDto) {
    try {
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
      this.logger.error('Failed to create spare part', error as Error);
      throw new InternalServerErrorException('Gagal menambahkan suku cadang.');
    }
  }

  async update(id: number, dto: UpdateSparePartDto) {
    await this.findOne(id);

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
      this.logger.error('Failed to update spare part', error as Error);
      throw new InternalServerErrorException('Gagal memperbarui suku cadang.');
    }
  }

  async addStock(id: number, quantity: number) {
    if (quantity <= 0)
      throw new BadRequestException('Jumlah penambahan harus positif.');

    await this.findOne(id);

    await this.stockMovementsService.createMovement({
      sparePartId: id,
      quantity,
      movementType: 'ADJUSTMENT',
      notes: `Penambahan stok manual: +${quantity}`,
    });

    return { success: true, message: 'Stok berhasil ditambah.' };
  }

  async reduceStock(id: number, quantity: number) {
    if (quantity <= 0)
      throw new BadRequestException('Jumlah pengurangan harus positif.');

    await this.findOne(id);

    await this.stockMovementsService.createMovement({
      sparePartId: id,
      quantity: -quantity,
      movementType: 'ADJUSTMENT',
      notes: `Pengurangan stok manual: -${quantity}`,
    });

    return { success: true, message: 'Stok berhasil dikurangi.' };
  }
}
