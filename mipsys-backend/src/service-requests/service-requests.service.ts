import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { desc, eq, and, like, or } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import {
  serviceLogs,
  serviceRequests,
  customers,
  products,
  StatusService,
  orderParts,
  spareParts,
} from '../database/schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ApproveQuoteDto } from './dto/approve-quote.dto';
import { SaveQuoteDto } from './dto/save-quote.dto';
import { CancelQuoteDto } from './dto/cancel-quote.dto';
import { InventoryService } from '../inventory/inventory.service';
import { OrderPartsService } from '../order-parts/order-parts.service';
import { DiagnoseSrDto } from './dto/diagnose-sr.dto';
import { validateSrTransition, SrStatusType } from './sr-state-machine.guard';

type DrizzleTx = Parameters<
  Parameters<MySql2Database<typeof schema>['transaction']>[0]
>[0];

@Injectable()
export class ServiceRequestService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
    private inventoryService: InventoryService,
    private orderPartsService: OrderPartsService
  ) {}
  private async logSystemError(action: string, error: any, context?: any) {
    console.error(`[${action}] Error:`, error);
  }

  async findAll(filters: {
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
  }) {
    try {
      const { search, page = 1, limit = 10, status } = filters;

      const conditions: any[] = [];

      if (search) {
        conditions.push(
          or(
            like(serviceRequests.ticketNumber, `%${search}%`),
            like(customers.name, `%${search}%`),
            like(products.modelName, `%${search}%`),
            like(products.serialNumber, `%${search}%`),
          ),
        );
      }

      if (status && status !== 'ALL') {
        conditions.push(eq(serviceRequests.statusService, status));
      }

      const offset = (page - 1) * limit;

      const results = await this.db
        .select({
          id: serviceRequests.id,
          ticketNumber: serviceRequests.ticketNumber,
          statusService: serviceRequests.statusService,
          statusSystem: serviceRequests.statusSystem,
          incomingDate: serviceRequests.incomingDate,
          customerName: customers.name,
          customerPhone: customers.phone,
          modelName: products.modelName,
          serialNumber: products.serialNumber,
          serviceType: serviceRequests.serviceType,
        })
        .from(serviceRequests)
        .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
        .leftJoin(products, eq(serviceRequests.productId, products.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(serviceRequests.createdAt))
        .limit(limit)
        .offset(offset);

      return results;
    } catch (error) {
      console.error('[GET_ALL_SR_ERROR]', error);
      throw new InternalServerErrorException('Gagal menarik daftar servis.');
    }
  }

  async findOne(ticketNumber: string) {
    try {
      // PERFORMANCE: Eager Loading menggunakan Left Join (No N+1)
      const result = await this.db
        .select({
          id: serviceRequests.id,
          ticketNumber: serviceRequests.ticketNumber,
          statusService: serviceRequests.statusService,
          problemDescription: serviceRequests.problemDescription,
          incomingDate: serviceRequests.incomingDate,
          customerName: customers.name,
          phone: customers.phone,
          address: customers.address,
          modelName: products.modelName,
          serialNumber: products.serialNumber,
          serviceType: serviceRequests.serviceType,
          serviceFee: serviceRequests.serviceFee,
          partFee: serviceRequests.partFee,
          shippingFee: serviceRequests.shippingFee,
        })
        .from(serviceRequests)
        .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
        .leftJoin(products, eq(serviceRequests.productId, products.id))
        .where(eq(serviceRequests.ticketNumber, ticketNumber))
        .limit(1);

      if (!result.length) {
        throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);
      }

      return result[0];
    } catch (error: unknown) {
      // ERROR HANDLING: 18046 Fixed - Type Guarding Unknown Error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Error';

      // DOD: Simulasi Logging ke log_system
      console.error(`[LOG_SYSTEM][ERROR][SR_DETAIL]: ${errorMessage}`);

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Terjadi kesalahan pada server.');
    }
  }

  async getActivities() {
    try {
      const logs = await this.db
        .select({
          id: serviceLogs.id,
          action: serviceLogs.action,
          description: serviceLogs.description,
          createdAt: serviceLogs.createdAt,
          performedBy: serviceLogs.performedBy,
        })
        .from(serviceLogs)
        .limit(10)
        .orderBy(desc(serviceLogs.createdAt));

      return logs.map((log) => ({
        time: log.createdAt ? new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
        user: `Staff #${log.performedBy || '-'}`,
        task: log.description || log.action,
        status: log.action?.includes('DONE') || log.action?.includes('COMPLETED') ? 'DONE' : log.action?.includes('SERVICE') ? 'SERVICE' : 'PENDING',
      }));
    } catch (error) {
      console.error('[GET_ACTIVITIES_ERROR]', error);
      return [];
    }
  }

  async getDashboardStats() {
    try {
      const allSR = await this.db.query.serviceRequests.findMany();

      const pending = allSR.filter((s) =>
        s.statusService === 'WAITING_CHECK' ||
        s.statusService === 'WAITING_APPROVE'
      ).length;
      const inService = allSR.filter((s) =>
        s.statusService === 'SERVICE'
      ).length;
      const awaitingParts = allSR.filter((s) =>
        s.statusService === 'AWAITING_PARTS'
      ).length;
      const ready = allSR.filter((s) =>
        s.statusService === 'DONE'
      ).length;
      const closed = allSR.filter((s) =>
        s.statusSystem === 'CLOSED'
      ).length;
      const cancelled = allSR.filter((s) =>
        s.statusService === 'CANCEL' || s.statusService === 'CANCELLED'
      ).length;

      return {
        total: allSR.length,
        pending,
        inService,
        awaitingParts,
        ready,
        closed,
        cancelled,
      };
    } catch (error) {
      console.error('[GET_STATS_ERROR]', error);
      return { total: 0, pending: 0, inService: 0, awaitingParts: 0, ready: 0, closed: 0, cancelled: 0 };
    }
  }

  // ============================================================
  // 1. CREATE ENTRY (Master Transaction)
  // ============================================================
  async createEntry(dto: CreateServiceRequestDto, adminId: number) {
    return await this.db.transaction(async (tx) => {
      try {
        // Step 1: Resolve Entities (Clean Code & Reusability)
        const targetCustomerId = await this.resolveCustomerId(tx, dto);
        const targetProductId = await this.resolveProductId(tx, dto);

        // Step 2: Create Placeholder SR
        const [insertResult] = await tx.insert(serviceRequests).values({
          ticketNumber: 'TEMP',
          serviceType: dto.serviceType,
          customerId: targetCustomerId,
          productId: targetProductId,
          adminId: adminId,
          problemDescription: dto.problemDescription?.trim(), // Security: Basic Sanitization
          statusService: StatusService.WAITING_CHECK,
          incomingDate: new Date(),
        });

        // Step 3: Atomic Ticket Number Generation (Collision-Proof)
        const srId = insertResult.insertId;
        const dateStr = this.todayString().replace(/-/g, '');
        const finalTicket = `SR-${dateStr}-${String(srId).padStart(4, '0')}`;

        await tx
          .update(serviceRequests)
          .set({ ticketNumber: finalTicket })
          .where(eq(serviceRequests.id, srId));

        return { success: true, ticketNumber: finalTicket };
      } catch (error) {
        await this.logSystemError('CREATE_ENTRY', error, dto);
        throw new InternalServerErrorException('Gagal membuat tiket service.');
      }
    });
  }

  // ============================================================
  // 2. UPDATE ENTRY (Basic Info Only - DoD Performance)
  // ============================================================
  async updateEntry(ticketNumber: string, dto: CreateServiceRequestDto) {
    return await this.db.transaction(async (tx) => {
      try {
        const existingSR = await tx.query.serviceRequests.findFirst({
          where: eq(serviceRequests.ticketNumber, ticketNumber),
        });
        if (!existingSR)
          throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

        const customerId = existingSR.customerId!;

        await tx
          .update(customers)
          .set({
            name: dto.customerName?.trim(),
            address: dto.address?.trim(),
            phone: dto.phone?.trim(),
            customerType: dto.customerType,
          })
          .where(eq(customers.id, customerId));

        await tx
          .update(products)
          .set({
            modelName: dto.modelName?.trim(),
            serialNumber: dto.serialNumber?.trim(),
          })
          .where(eq(products.id, existingSR.productId!));

        await tx
          .update(serviceRequests)
          .set({
            serviceType: dto.serviceType,
            problemDescription: dto.problemDescription?.trim(),
            updatedAt: new Date(),
          })
          .where(eq(serviceRequests.id, existingSR.id));

        return {
          success: true,
          message: `Update tiket ${ticketNumber} berhasil.`,
        };
      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        await this.logSystemError('UPDATE_ENTRY', error, { ticketNumber });

        throw new InternalServerErrorException('Gagal memperbarui data.');
      }
    });
  }

  // ============================================================
  // 3. ATOMIC DIAGNOSIS (State Transition + Parts + Stock)
  // ============================================================
  async diagnose(ticketNumber: string, dto: DiagnoseSrDto) {
    return this.db.transaction(async (tx) => {
      const sr = await tx.query.serviceRequests.findFirst({
        where: eq(serviceRequests.ticketNumber, ticketNumber),
      });
      if (!sr) throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

      if (sr.statusService === 'DONE' || sr.statusService === 'CANCEL') {
        throw new BadRequestException(
          `Tiket ${ticketNumber} sudah ${sr.statusService} dan tidak dapat diubah.`
        );
      }

      validateSrTransition(
        sr.statusService as SrStatusType,
        dto.newStatus as SrStatusType
      );

      if (dto.problemDescription?.trim()) {
        await tx
          .update(serviceRequests)
          .set({ problemDescription: dto.problemDescription.trim() })
          .where(eq(serviceRequests.ticketNumber, ticketNumber));
      }

      if (dto.parts && dto.parts.length > 0) {
        for (const partDto of dto.parts) {
          await this.orderPartsService.addPart(
            {
              serviceRequestId: sr.id,
              sparePartId: partDto.sparePartId,
              quantity: partDto.quantity,
            },
            tx,
            'PROPOSED'
          );
        }
      }

      await tx
        .update(serviceRequests)
        .set({
          statusService: dto.newStatus,
          ...(dto.newStatus === 'CHECK' && !sr.checkDate
            ? { checkDate: new Date() }
            : {}),
          ...(dto.newStatus === 'WAITING_APPROVE' && !sr.spDate
            ? { spDate: new Date() }
            : {}),
          ...(dto.newStatus === 'SERVICE'
            ? {
                spDate: !sr.spDate ? new Date() : sr.spDate,
                approveDate: !sr.approveDate ? new Date() : sr.approveDate,
              }
            : {}),
          ...(dto.newStatus === 'DONE'
            ? {
                readyDate: new Date(),
                closeDate: new Date(),
              }
            : {}),
        })
        .where(eq(serviceRequests.ticketNumber, ticketNumber));

      await tx.insert(serviceLogs).values({
        serviceRequestId: sr.id,
        action: 'DIAGNOSIS_UPDATED',
        description: `Status → ${dto.newStatus}${dto.parts?.length ? `, ${dto.parts.length} part diusulkan` : ''}`,
        performedBy: dto.performedBy ?? null,
      });

      return {
        success: true,
        ticketNumber,
        newStatus: dto.newStatus,
        partsAdded: dto.parts?.length ?? 0,
      };
    });
  }

  // ============================================================
  // 4. SAVE QUOTE (Admin saves fee proposal — stays in WAITING_APPROVE)
  // ============================================================
  async saveQuote(ticketNumber: string, dto: SaveQuoteDto) {
    return this.db.transaction(async (tx) => {
      const sr = await tx.query.serviceRequests.findFirst({
        where: eq(serviceRequests.ticketNumber, ticketNumber),
      });
      if (!sr) throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

      if (sr.statusService !== 'WAITING_APPROVE') {
        throw new BadRequestException(
          `Penawaran hanya bisa dibuat pada status WAITING_APPROVE. Status saat ini: ${sr.statusService}`
        );
      }

      const parts = await tx.query.orderParts.findMany({
        where: and(
          eq(orderParts.serviceRequestId, sr.id),
          eq(orderParts.status, 'PROPOSED'),
        ),
      });

      if (parts.length === 0) {
        throw new BadRequestException(
          'Tidak ada part yang diusulkan. Tambahkan part terlebih dahulu.'
        );
      }

      const totalPartFee = parts.reduce((sum, p) => {
        return sum + parseFloat(p.priceAtAction || '0') * p.quantity;
      }, 0);

      await tx
        .update(serviceRequests)
        .set({
          serviceFee: dto.serviceFee.toString(),
          shippingFee: (dto.shippingFee ?? 0).toString(),
          partFee: totalPartFee.toString(),
          updatedAt: new Date(),
        })
        .where(eq(serviceRequests.ticketNumber, ticketNumber));

      await tx.insert(serviceLogs).values({
        serviceRequestId: sr.id,
        action: 'QUOTE_SAVED',
        description: `Penawaran tersimpan: Jasa Rp${Number(dto.serviceFee).toLocaleString('id-ID')}, Part Rp${totalPartFee.toLocaleString('id-ID')}, Ongkos Kirim Rp${(dto.shippingFee ?? 0).toLocaleString('id-ID')}`,
        performedBy: dto.performedBy ?? null,
      });

      return {
        success: true,
        ticketNumber,
        partFee: totalPartFee,
        serviceFee: dto.serviceFee,
        shippingFee: dto.shippingFee ?? 0,
      };
    });
  }

  // ============================================================
  // 5. CANCEL QUOTE (Customer rejects — WAITING_APPROVE → CANCEL)
  // ============================================================
  async cancelQuote(ticketNumber: string, dto: CancelQuoteDto) {
    return this.db.transaction(async (tx) => {
      const sr = await tx.query.serviceRequests.findFirst({
        where: eq(serviceRequests.ticketNumber, ticketNumber),
      });
      if (!sr) throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

      if (sr.statusService !== 'WAITING_APPROVE') {
        throw new BadRequestException(
          `Pembatalan hanya bisa dilakukan pada status WAITING_APPROVE. Status saat ini: ${sr.statusService}`
        );
      }

      validateSrTransition(
        sr.statusService as SrStatusType,
        'CANCEL' as SrStatusType,
      );

      await tx
        .update(serviceRequests)
        .set({
          statusService: 'CANCEL' as any,
          updatedAt: new Date(),
        })
        .where(eq(serviceRequests.ticketNumber, ticketNumber));

      await tx.insert(serviceLogs).values({
        serviceRequestId: sr.id,
        action: 'QUOTE_REJECTED',
        description: 'Penawaran ditolak pelanggan. Tiket dibatalkan.',
        performedBy: dto.performedBy ?? null,
      });

      return {
        success: true,
        ticketNumber,
        newStatus: 'CANCEL',
      };
    });
  }

  // ============================================================
  // 6. APPROVE QUOTE (Customer agrees → check stock → cut stock → transition)
  // ============================================================
  async approveQuote(ticketNumber: string, dto: ApproveQuoteDto) {
    return this.db.transaction(async (tx) => {
      const sr = await tx.query.serviceRequests.findFirst({
        where: eq(serviceRequests.ticketNumber, ticketNumber),
      });
      if (!sr) throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

      if (sr.statusService !== 'WAITING_APPROVE') {
        throw new BadRequestException(
          `Penawaran hanya bisa disetujui pada status WAITING_APPROVE. Status saat ini: ${sr.statusService}`
        );
      }

      const hasQuote = parseFloat(sr.serviceFee || '0') > 0 || parseFloat(sr.partFee || '0') > 0;
      if (!hasQuote) {
        throw new BadRequestException(
          'Belum ada penawaran yang disimpan. Simpan penawaran terlebih dahulu.'
        );
      }

      const parts = await tx.query.orderParts.findMany({
        where: and(
          eq(orderParts.serviceRequestId, sr.id),
          eq(orderParts.status, 'PROPOSED'),
        ),
      });

      if (parts.length === 0) {
        throw new BadRequestException(
          'Tidak ada part yang diusulkan. Tambahkan part terlebih dahulu.'
        );
      }

      let allInStock = true;
      for (const part of parts) {
        const sparePart = await tx.query.spareParts.findFirst({
          where: eq(spareParts.id, part.sparePartId!),
          columns: { id: true, stock: true, partName: true },
        });

        if (!sparePart || sparePart.stock < part.quantity) {
          allInStock = false;
          await tx
            .update(orderParts)
            .set({ status: 'OUT_OF_STOCK' })
            .where(eq(orderParts.id, part.id));
        }
      }

      let newStatus: string;
      if (allInStock) {
        newStatus = 'SERVICE';
        for (const part of parts) {
          const sparePart = await tx.query.spareParts.findFirst({
            where: eq(spareParts.id, part.sparePartId!),
            columns: { id: true, stock: true },
          });

          if (sparePart) {
            await this.inventoryService.reserveStock(
              sparePart.id,
              part.quantity,
              ticketNumber,
              dto.performedBy ?? 1,
              tx,
            );
          }

          await tx
            .update(orderParts)
            .set({ status: 'IN_STOCK' })
            .where(eq(orderParts.id, part.id));
        }
      } else {
        newStatus = 'AWAITING_PARTS';
      }

      validateSrTransition(
        sr.statusService as SrStatusType,
        newStatus as SrStatusType,
      );

      const totalPartFee = parts.reduce((sum, p) => {
        return sum + parseFloat(p.priceAtAction || '0') * p.quantity;
      }, 0);

      await tx
        .update(serviceRequests)
        .set({
          statusService: newStatus as any,
          approveDate: new Date(),
          ...(allInStock && !sr.spDate ? { spDate: new Date() } : {}),
        })
        .where(eq(serviceRequests.ticketNumber, ticketNumber));

      await tx.insert(serviceLogs).values({
        serviceRequestId: sr.id,
        action: 'QUOTE_APPROVED',
        description: allInStock
          ? `Penawaran disetujui. ${parts.length} part dipotong dari stok. Status → SERVICE`
          : `Penawaran disetujui. ${parts.length} part, sebagian tidak tersedia. Status → AWAITING_PARTS`,
        performedBy: dto.performedBy ?? null,
      });

      return {
        success: true,
        ticketNumber,
        newStatus,
        allInStock,
        partFee: totalPartFee,
        serviceFee: sr.serviceFee,
        shippingFee: sr.shippingFee,
        partsProcessed: parts.length,
      };
    });
  }

  // ============================================================
  // 7. RETRY AWAITING PARTS (Manual re-check stock → SERVICE if available)
  // ============================================================
  async retryAwaitingParts(ticketNumber: string, dto: CancelQuoteDto) {
    return this.db.transaction(async (tx) => {
      const sr = await tx.query.serviceRequests.findFirst({
        where: eq(serviceRequests.ticketNumber, ticketNumber),
      });
      if (!sr) throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

      if (sr.statusService !== 'AWAITING_PARTS') {
        throw new BadRequestException(
          `Cek ulang stok hanya bisa dilakukan pada status AWAITING_PARTS. Status saat ini: ${sr.statusService}`
        );
      }

      const outOfStockParts = await tx.query.orderParts.findMany({
        where: and(
          eq(orderParts.serviceRequestId, sr.id),
          eq(orderParts.status, 'OUT_OF_STOCK'),
        ),
      });

      if (outOfStockParts.length === 0) {
        throw new BadRequestException(
          'Tidak ada part yang menunggu stok.'
        );
      }

      let allAvailable = true;
      for (const op of outOfStockParts) {
        const sp = await tx.query.spareParts.findFirst({
          where: eq(spareParts.id, op.sparePartId!),
          columns: { id: true, stock: true, partName: true },
        });
        if (!sp || sp.stock < op.quantity) {
          allAvailable = false;
          break;
        }
      }

      if (!allAvailable) {
        return {
          success: true,
          ticketNumber,
          newStatus: 'AWAITING_PARTS',
          available: false,
          message: 'Stok masih belum mencukupi untuk semua part.',
        };
      }

      for (const op of outOfStockParts) {
        const sp = await tx.query.spareParts.findFirst({
          where: eq(spareParts.id, op.sparePartId!),
          columns: { id: true, stock: true },
        });

        if (sp) {
          await this.inventoryService.reserveStock(
            sp.id,
            op.quantity,
            ticketNumber,
            dto.performedBy ?? 1,
            tx,
          );
        }

        await tx
          .update(orderParts)
          .set({ status: 'IN_STOCK' })
          .where(eq(orderParts.id, op.id));
      }

      validateSrTransition(
        sr.statusService as SrStatusType,
        'SERVICE' as SrStatusType,
      );

      await tx
        .update(serviceRequests)
        .set({
          statusService: 'SERVICE' as any,
          spDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(serviceRequests.id, sr.id));

      await tx.insert(serviceLogs).values({
        serviceRequestId: sr.id,
        action: 'SR_STOCK_RETRY',
        description: `Cek ulang stok: ${outOfStockParts.length} part tersedia. Status → SERVICE`,
        performedBy: dto.performedBy ?? null,
      });

      return {
        success: true,
        ticketNumber,
        newStatus: 'SERVICE',
        available: true,
        partsProcessed: outOfStockParts.length,
      };
    });
  }

  // ============================================================
  // 8. PRIVATE RESOLVERS (Logic Separation)
  // ============================================================
  private async resolveCustomerId(
    tx: DrizzleTx,
    dto: CreateServiceRequestDto
  ): Promise<number> {
    const [existing] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.name, dto.customerName))
      .limit(1);

    if (existing) return existing.id;

    const [{ insertId }] = await tx.insert(customers).values({
      name: dto.customerName.trim(),
      address: dto.address?.trim(),
      phone: dto.phone?.trim(),
      customerType: dto.customerType,
    });
    return insertId;
  }

  private async resolveProductId(
    tx: DrizzleTx,
    dto: CreateServiceRequestDto
  ): Promise<number> {
    const [existing] = await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.serialNumber, dto.serialNumber))
      .limit(1);

    if (existing) return existing.id;

    const [{ insertId }] = await tx.insert(products).values({
      serialNumber: dto.serialNumber.trim(),
      modelName: dto.modelName.trim(),
    });
    return insertId;
  }

  private todayString(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
