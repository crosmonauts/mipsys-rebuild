import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
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
} from '../database/schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

type DrizzleTx = Parameters<
  Parameters<MySql2Database<typeof schema>['transaction']>[0]
>[0];

@Injectable()
export class ServiceRequestService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>
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
      return await this.db
        .select({
          id: serviceLogs.id,
          action: serviceLogs.action,
          description: serviceLogs.description,
          createdAt: serviceLogs.createdAt,
        })
        .from(serviceLogs)
        .limit(10)
        .orderBy(desc(serviceLogs.createdAt));
    } catch (error) {
      console.error('[GET_ACTIVITIES_ERROR]', error);
      throw new InternalServerErrorException('Gagal mengambil data aktivitas.');
    }
  }

  async getDashboardStats() {
    return { pending: 0, proses: 0, selesai: 0 };
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
  // 3. PRIVATE RESOLVERS (Logic Separation)
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
