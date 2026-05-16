import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import {
  serviceLogs,
  serviceRequests,
  customers,
  products,
  StatusService,
  staff,
  orderParts,
  spareParts,
} from '../database/schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
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

  async findAll() {
    try {
      const results = await this.db
        .select({
          id: serviceRequests.id,
          ticketNumber: serviceRequests.ticketNumber,
          status: serviceRequests.statusService,
          incomingDate: serviceRequests.incomingDate,
          customerName: customers.name,
          customerPhone: customers.phone,
          modelName: products.modelName,
          serialNumber: products.serialNumber,
        })
        .from(serviceRequests)
        .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
        .leftJoin(products, eq(serviceRequests.productId, products.id))
        .orderBy(desc(serviceRequests.createdAt));

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
      const allCustomers = await this.db.query.customers.findMany();
      const allStaff = await this.db.query.staff.findMany({
        where: eq(staff.role, 'TECHNICIAN'),
      });

      const pending = allSR.filter((s) => s.statusService === 'WAITING_CHECK' || s.statusService === 'WAITING_APPROVE').length;
      const proses = allSR.filter((s) => s.statusService === 'CHECK' || s.statusService === 'SERVICE').length;
      const selesai = allSR.filter((s) => s.statusService === 'DONE').length;

      return {
        total: allSR.length,
        pending,
        proses,
        selesai,
        customers: allCustomers.length,
        technicians: allStaff.length,
      };
    } catch (error) {
      console.error('[GET_STATS_ERROR]', error);
      return { total: 0, pending: 0, proses: 0, selesai: 0, customers: 0, technicians: 0 };
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
            tx
          );

          await this.inventoryService.reserveStock(
            partDto.sparePartId,
            partDto.quantity,
            ticketNumber,
            dto.performedBy ?? 1,
            tx
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
          ...(dto.newStatus === 'SERVICE' && !sr.spDate
            ? { spDate: new Date() }
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
        description: `Status → ${dto.newStatus}${dto.parts?.length ? `, ${dto.parts.length} part ditambahkan` : ''}`,
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
  // 4. PRIVATE RESOLVERS (Logic Separation)
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
