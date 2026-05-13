import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../db/schema';
import {
  serviceRequests,
  customers,
  products,
  StatusService,
} from '../db/schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

/** Tipe Drizzle transaction agar tidak menggunakan 'any' */
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
