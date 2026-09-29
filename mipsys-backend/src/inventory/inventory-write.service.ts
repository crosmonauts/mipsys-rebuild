import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { spareParts } from '../database/schema';
import { InventoryReadService } from './inventory-read.service';
import { PartCompatibilityService } from './part-compatibility.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

@Injectable()
export class InventoryWriteService {
  private readonly logger = new Logger(InventoryWriteService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
    private readService: InventoryReadService,
    private compatService: PartCompatibilityService
  ) {}

  async create(dto: CreateSparePartDto) {
    const partCode = dto.partCode.trim().toUpperCase();
    const existingByCode = await this.db
      .select({ id: spareParts.id })
      .from(spareParts)
      .where(eq(spareParts.partCode, partCode))
      .limit(1);

    if (existingByCode.length > 0) {
      throw new BadRequestException(
        `Kode part '${partCode}' sudah digunakan.`
      );
    }

    const existingByName = await this.readService.findByPartNameAndModel(
      dto.partName,
      dto.modelName
    );
    if (existingByName) {
      throw new BadRequestException(
        `Part dengan nama '${dto.partName}' dan model '${dto.modelName}' sudah ada (ID: ${existingByName.id}). Gunakan endpoint update untuk mengubah data.`
      );
    }

    const isUniversal = dto.isUniversal ?? false;
    const modelIds = dto.compatibleModelIds ?? [];
    if (!isUniversal && modelIds.length === 0) {
      const resolved = await this.compatService.resolveCategoryId(
        dto.modelName
      );
      if (resolved === null) {
        throw new BadRequestException(
          `Model "${dto.modelName}" tak terpetakan ke master. Pilih model kompatibel atau tandai universal.`
        );
      }
      modelIds.push(resolved);
    }

    const created = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(spareParts)
        .values({
          partCode,
          partName: dto.partName.trim(),
          modelName: dto.modelName.trim(),
          block: dto.block?.trim(),
          stock: dto.stock ?? 0,
          price: dto.price,
          isUniversal,
        })
        .returning({
          id: spareParts.id,
          partCode: spareParts.partCode,
          partName: spareParts.partName,
          modelName: spareParts.modelName,
          block: spareParts.block,
          stock: spareParts.stock,
          price: spareParts.price,
        });

      if (!isUniversal) {
        await this.compatService.setCompatibilities(row.id, modelIds, null, tx);
      }
      return row;
    });

    return created;
  }

  async update(id: number, dto: UpdateSparePartDto) {
    await this.readService.getPartById(id);

    const { compatibleModelIds, isUniversal, ...rest } = dto as UpdateSparePartDto & {
      compatibleModelIds?: number[];
      isUniversal?: boolean;
    };
    await this.db
      .update(spareParts)
      .set({
        ...rest,
        partCode: dto.partCode?.trim().toUpperCase(),
        partName: dto.partName?.trim(),
        price: dto.price,
        isUniversal,
        updatedAt: new Date(),
      })
      .where(eq(spareParts.id, id));

    if (isUniversal === true) {
      await this.db
        .delete(schema.partModelCompatibilities)
        .where(eq(schema.partModelCompatibilities.sparePartId, id));
    } else if (compatibleModelIds !== undefined) {
      await this.compatService.setCompatibilities(id, compatibleModelIds);
    }

    return { success: true, message: 'Data suku cadang berhasil diperbarui.' };
  }
}
