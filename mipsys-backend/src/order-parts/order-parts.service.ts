import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, and, ne, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { orderParts, spareParts, serviceRequests } from '../database/schema';
import { orderPartStatusEnum } from '../database/schema/enums';
import { CreateOrderPartDto } from './dto/create-order-part.dto';
import { PartCompatibilityService } from '../inventory/part-compatibility.service';

type DrizzleTx = Parameters<
  Parameters<NodePgDatabase<typeof schema>['transaction']>[0]
>[0];

type OrderPartStatus = (typeof orderPartStatusEnum.enumValues)[number];

@Injectable()
export class OrderPartsService {
  private readonly logger = new Logger(OrderPartsService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
    private compatService: PartCompatibilityService
  ) {}

  async addPart(
    dto: CreateOrderPartDto,
    tx?: DrizzleTx,
    status?: string,
    srModelName?: string | null
  ) {
    const targetDb = tx || this.db;

    const part = await targetDb.query.spareParts.findFirst({
      where: eq(spareParts.id, dto.sparePartId),
    });
    if (!part)
      throw new NotFoundException(
        `Part ID ${dto.sparePartId} tidak ditemukan.`
      );

    let modelName = srModelName;
    if (modelName === undefined) {
      const sr = await targetDb.query.serviceRequests.findFirst({
        where: eq(serviceRequests.id, dto.serviceRequestId),
        columns: { id: true, modelName: true },
      });
      modelName = sr?.modelName ?? null;
    }
    if (modelName) {
      const check = await this.compatService.check(
        dto.sparePartId,
        modelName,
        tx
      );
      if (!check.ok) {
        const allowed =
          check.compatibleModels.length > 0
            ? check.compatibleModels.join(', ')
            : 'tidak ada model terdaftar';
        throw new BadRequestException(
          `Part "${part.partName}" tidak kompatibel dengan model "${modelName}". Cocok untuk: ${allowed}.`
        );
      }
    }

    const priceAtAction = part.price ?? 0;

    const existing = await targetDb.query.orderParts.findFirst({
      where: and(
        eq(orderParts.serviceRequestId, dto.serviceRequestId),
        eq(orderParts.sparePartId, dto.sparePartId),
        ne(orderParts.status, 'CANCELLED')
      ),
    });

    if (existing) {
      await targetDb
        .update(orderParts)
        .set({ quantity: existing.quantity + dto.quantity })
        .where(eq(orderParts.id, existing.id));

      return { success: true, id: existing.id, priceAtAction, updated: true };
    }

    const [result] = await targetDb
      .insert(orderParts)
      .values({
        serviceRequestId: dto.serviceRequestId,
        sparePartId: dto.sparePartId,
        partName: part.partName,
        quantity: dto.quantity,
        priceAtAction,
        status: (status ?? 'IN_STOCK') as OrderPartStatus,
      })
      .returning({ id: orderParts.id });

    return { success: true, id: result.id, priceAtAction };
  }

  /**
   * Menambahkan part substitusi: part model lain yang dipasang atas
   * persetujuan admin. Berbeda dari addPart, jalur ini TIDAK
   * memvalidasi kompatibilitas, tetapi mewajibkan alasan dan mencatat
   * approver sehingga tetap ada jejak audit.
   */
  async addSubstitutePart(dto: {
    serviceRequestId: number;
    sparePartId: number;
    quantity: number;
    substituteReason: string;
    approvedBy: number | null;
  }) {
    const reason = dto.substituteReason?.trim() ?? '';
    if (!reason) {
      throw new BadRequestException(
        'Alasan substitusi wajib diisi.',
      );
    }

    const sr = await this.db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.id, dto.serviceRequestId),
      columns: { id: true, statusService: true, modelName: true },
    });
    if (!sr) {
      throw new NotFoundException(
        `Service request ID ${dto.serviceRequestId} tidak ditemukan.`,
      );
    }

    const part = await this.db.query.spareParts.findFirst({
      where: eq(spareParts.id, dto.sparePartId),
    });
    if (!part) {
      throw new NotFoundException(
        `Part ID ${dto.sparePartId} tidak ditemukan.`,
      );
    }

    const existing = await this.db.query.orderParts.findFirst({
      where: and(
        eq(orderParts.serviceRequestId, dto.serviceRequestId),
        eq(orderParts.sparePartId, dto.sparePartId),
        ne(orderParts.status, 'CANCELLED'),
      ),
    });

    if (existing) {
      await this.db
        .update(orderParts)
        .set({ quantity: existing.quantity + dto.quantity })
        .where(eq(orderParts.id, existing.id));
      return {
        success: true,
        id: existing.id,
        priceAtAction: part.price ?? 0,
        updated: true,
        isSubstitute: existing.isSubstitute ?? false,
      };
    }

    const [result] = await this.db
      .insert(orderParts)
      .values({
        serviceRequestId: dto.serviceRequestId,
        sparePartId: dto.sparePartId,
        partName: part.partName,
        quantity: dto.quantity,
        priceAtAction: part.price ?? 0,
        status: 'PROPOSED' as OrderPartStatus,
        isSubstitute: true,
        substituteReason: reason,
        substituteApprovedBy: dto.approvedBy,
        substituteApprovedAt: new Date(),
      })
      .returning({ id: orderParts.id });

    this.logger.warn(
      `[SUBSTITUTE] Part "${part.partName}" dipakai untuk model "${sr.modelName}" atas alasan: ${reason}`,
    );

    return {
      success: true,
      id: result.id,
      priceAtAction: part.price ?? 0,
      isSubstitute: true,
    };
  }

  async getByServiceRequest(serviceRequestId: number) {
    return this.db.query.orderParts.findMany({
      where: eq(orderParts.serviceRequestId, serviceRequestId),
      orderBy: [desc(orderParts.createdAt)],
    });
  }

  async removePart(id: number, tx?: DrizzleTx) {
    const targetDb = tx || this.db;
    await targetDb
      .update(orderParts)
      .set({ status: 'CANCELLED' })
      .where(eq(orderParts.id, id));
    return { success: true };
  }

  async getTotalPartsCost(serviceRequestId: number): Promise<number> {
    const parts = await this.db.query.orderParts.findMany({
      where: and(
        eq(orderParts.serviceRequestId, serviceRequestId),
        ne(orderParts.status, 'CANCELLED'),
      ),
    });

    return parts.reduce((sum, p) => {
      const price = p.priceAtAction ?? 0;
      const qty = p.quantity || 0;
      return sum + price * qty;
    }, 0);
  }
}
