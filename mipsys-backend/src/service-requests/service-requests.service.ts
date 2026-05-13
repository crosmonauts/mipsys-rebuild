import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  eq,
  desc,
  like,
  or,
  SQL,
  isNotNull,
  count,
  sql,
  InferInsertModel,
} from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../db/schema';
import {
  serviceRequests,
  customers,
  products,
  customerPhones,
  orderParts,
  spareParts,
  staff,
} from 'src/db/schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateTechRequestDto } from './dto/update-tech-request.dto';
import { PartItemDto } from './dto/part-item.dto';
import { SparePartsService } from 'src/spare-parts/spare-parts.service';

@Injectable()
export class ServiceRequestService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
    private readonly sparePartsService: SparePartsService
  ) {}

  // ==========================================
  // 1. DASHBOARD & READ OPERATIONS
  // ==========================================

  async getDashboardStats() {
    const stats = await this.db
      .select({ status: serviceRequests.statusService, count: count() })
      .from(serviceRequests)
      .groupBy(serviceRequests.statusService);

    const result = { total: 0, waiting: 0, service: 0, done: 0 };
    stats.forEach((s) => {
      const val = Number(s.count);
      result.total += val;
      if (s.status === 'WAITING CHECK') result.waiting += val;
      if (s.status === 'SERVICE') result.service += val;
      if (s.status === 'DONE') result.done += val;
    });
    return result;
  }

  async getLatestActivities() {
    const logs = await this.db
      .select({
        ticketNumber: serviceRequests.ticketNumber,
        statusService: serviceRequests.statusService,
        updatedAt: serviceRequests.updatedAt,
        techName: staff.name,
      })
      .from(serviceRequests)
      .leftJoin(staff, eq(serviceRequests.technicianCheckId, staff.id))
      .where(isNotNull(serviceRequests.updatedAt))
      .orderBy(desc(serviceRequests.updatedAt))
      .limit(5);

    return logs.map((log) => ({
      time: log.updatedAt
        ? new Date(log.updatedAt).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '--:--',
      user: log.techName || 'System',
      task: `Tiket #${log.ticketNumber} diperbarui ke status ${log.statusService}`,
      status: log.statusService,
    }));
  }

  async getAllDashboard(
    search: string = '',
    page: number = 1,
    limit: number = 10
  ) {
    const offset = (page - 1) * limit;
    let whereCondition: SQL | undefined = undefined;

    if (search) {
      whereCondition = or(
        like(serviceRequests.ticketNumber, `%${search}%`),
        like(customers.name, `%${search}%`)
      );
    }

    const results = await this.db
      .select({
        id: serviceRequests.id,
        ticketNumber: serviceRequests.ticketNumber,
        customerName: customers.name,
        customerType: customers.customerType,
        modelName: products.modelName,
        serialNumber: products.serialNumber,
        serviceType: serviceRequests.serviceType,
        statusService: serviceRequests.statusService,
        statusSystem: serviceRequests.statusSystem,
        incomingDate: serviceRequests.incomingDate,
        readyDate: serviceRequests.readyDate,
        pickUpDate: serviceRequests.pickUpDate,
        partFee: serviceRequests.partFee,
        serviceFee: serviceRequests.serviceFee,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .leftJoin(products, eq(serviceRequests.productId, products.id))
      .where(whereCondition)
      .orderBy(desc(serviceRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: results.length === limit,
      },
    };
  }

  async getDetailByTicketNumber(ticketNumber: string) {
    const [ticket] = await this.db
      .select({
        id: serviceRequests.id,
        ticketNumber: serviceRequests.ticketNumber,
        serviceType: serviceRequests.serviceType,
        statusService: serviceRequests.statusService,
        statusSystem: serviceRequests.statusSystem,
        problemDescription: serviceRequests.problemDescription,
        remarksHistory: serviceRequests.remarksHistory,
        partFee: serviceRequests.partFee,
        serviceFee: serviceRequests.serviceFee,
        incomingDate: serviceRequests.incomingDate,
        technicianCheckId: serviceRequests.technicianCheckId,
        customerName: customers.name,
        customerAddress: customers.address,
        customerPhone: customerPhones.phone,
        modelName: products.modelName,
        serialNumber: products.serialNumber,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .leftJoin(customerPhones, eq(customers.id, customerPhones.customerId))
      .leftJoin(products, eq(serviceRequests.productId, products.id))
      .where(eq(serviceRequests.ticketNumber, ticketNumber))
      .limit(1);

    if (!ticket)
      throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

    const partsRows = await this.db
      .select({
        id: orderParts.id,
        sparePartId: orderParts.sparePartId,
        savedPartName: orderParts.partName,
        masterPartName: spareParts.partName,
        quantity: orderParts.quantity,
        unitPrice: orderParts.priceAtAction,
      })
      .from(orderParts)
      .leftJoin(spareParts, eq(orderParts.sparePartId, spareParts.id))
      .where(eq(orderParts.serviceRequestId, ticket.id));

    return {
      ...ticket,
      parts: partsRows.map((p) => ({
        sparePartId: p.sparePartId,
        partName: p.savedPartName || p.masterPartName || 'Sparepart',
        quantity: Number(p.quantity),
        unitPrice: Number(p.unitPrice),
      })),
    };
  }

  // ==========================================
  // 2. WRITE OPERATIONS (MUTATIONS)
  // ==========================================

  async createEntry(dto: CreateServiceRequestDto, adminId: number) {
    return await this.db.transaction(async (tx) => {
      const customerId = await this.resolveCustomerId(tx, dto);
      const productId = await this.resolveProductId(tx, dto);

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const newTicketNumber = `SR-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

      await tx.insert(serviceRequests).values({
        ticketNumber: newTicketNumber,
        serviceType: dto.serviceType || 'NON_WARRANTY',
        customerId,
        productId,
        adminId,
        problemDescription: dto.problemDescription,
        statusService: 'WAITING CHECK',
        statusSystem: 'OPEN',
        serviceFee: dto.serviceFee?.toString() || '0',
        partFee: '0',
        incomingDate: new Date(),
      });

      return {
        success: true,
        ticketNumber: newTicketNumber,
        message: 'Berhasil tersimpan.',
      };
    });
  }

  /**
   * REFACTORED: Update Tech Diagnosis (Orchestrator)
   */
  async updateTechDiagnosis(ticketNumber: string, dto: UpdateTechRequestDto) {
    // 1. Validasi awal (Guard Clause)
    const existingSR = await this.findServiceRequest(ticketNumber);
    const totalPartFee = this.calculateTotalPartFee(dto.parts);

    // 2. Database Transaction (Atomic Operation)
    return await this.db.transaction(async (tx) => {
      try {
        // A. Update Header (Status & Fees)
        await this.updateMainServiceRequest(
          tx,
          existingSR.id,
          dto,
          totalPartFee,
          existingSR.serviceFee
        );

        // B. Sinkronisasi Parts & Validasi Stok
        await this.syncOrderParts(tx, existingSR.id, dto.parts, ticketNumber);

        return {
          success: true,
          totalBill:
            Number(dto.serviceFee ?? existingSR.serviceFee) + totalPartFee,
        };
      } catch (error) {
        // Otomatis Rollback jika terjadi error di sini
        this.handleTransactionError(error, ticketNumber);
      }
    });
  }
  // ==========================================
  // 3. PRIVATE HELPERS (BUSINESS LOGIC)
  // ==========================================

  private async findServiceRequest(ticketNumber: string) {
    const sr = await this.db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.ticketNumber, ticketNumber),
    });
    if (!sr)
      throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);
    return sr;
  }

  private calculateTotalPartFee(parts?: PartItemDto[]): number {
    return (parts || []).reduce(
      (acc, p) => acc + Number(p.quantity) * Number(p.unitPrice),
      0
    );
  }

  private async resolveCustomerId(
    tx: any,
    dto: CreateServiceRequestDto
  ): Promise<number> {
    const [existing] = await tx
      .select()
      .from(customers)
      .where(eq(customers.name, dto.customerName || ''))
      .limit(1);
    if (existing) return existing.id;

    const [{ insertId }] = await tx.insert(customers).values({
      name: dto.customerName || 'Tanpa Nama',
      address: dto.address,
      customerType: dto.customerType || 'PRIBADI',
    });
    await tx
      .insert(customerPhones)
      .values({ customerId: insertId, phone: dto.phone || '-' });
    return insertId;
  }

  private async resolveProductId(
    tx: any,
    dto: CreateServiceRequestDto
  ): Promise<number> {
    const [existing] = await tx
      .select()
      .from(products)
      .where(eq(products.serialNumber, dto.serialNumber || ''))
      .limit(1);
    if (existing) return existing.id;

    const [{ insertId }] = await tx.insert(products).values({
      serialNumber: dto.serialNumber || 'SN-UNKNOWN',
      modelName: dto.modelName || 'UNKNOWN MODEL',
    });
    return insertId;
  }

  private async updateMainServiceRequest(
    tx: any,
    id: number,
    dto: UpdateTechRequestDto,
    partFee: number,
    currentSvcFee: string | null
  ) {
    await tx
      .update(serviceRequests)
      .set({
        statusService: dto.statusService,
        technicianCheckId: dto.technicianCheckId,
        remarksHistory: dto.remarksHistory,
        // Keamanan tipe data: Pastikan tidak mengirim null ke kolom Decimal
        serviceFee: (dto.serviceFee ?? currentSvcFee ?? '0').toString(),
        partFee: partFee.toString(),
        updatedAt: new Date(),
      })
      .where(eq(serviceRequests.id, id));
  }

  private async syncOrderParts(
    tx: any,
    srId: number,
    parts: PartItemDto[] | undefined,
    ticketNum: string
  ) {
    // Bersihkan data lama untuk sinkronisasi ulang
    await tx.delete(orderParts).where(eq(orderParts.serviceRequestId, srId));
    if (!parts || parts.length === 0) return;

    // Definisikan tipe array secara eksplisit (Menghindari error 'never')
    const resolvedOrderParts: InferInsertModel<typeof orderParts>[] = [];

    for (const p of parts) {
      const targetId = await this.resolveSparePartId(tx, p, ticketNum);
      resolvedOrderParts.push({
        serviceRequestId: srId,
        sparePartId: targetId,
        partName: p.partName,
        quantity: p.quantity,
        priceAtAction: p.unitPrice.toString(),
      });
    }
    await tx.insert(orderParts).values(resolvedOrderParts);
  }

  private async resolveSparePartId(
    tx: any,
    p: PartItemDto,
    ticketNum: string
  ): Promise<number> {
    if (p.sparePartId) {
      const [item] = await tx
        .select()
        .from(spareParts)
        .where(eq(spareParts.id, p.sparePartId));
      if (!item)
        throw new BadRequestException(
          `Part ID ${p.sparePartId} tidak ditemukan.`
        );

      // KRITIKAL: Validasi Stok di level Database
      if (item.stock < p.quantity)
        throw new BadRequestException(`Stok '${p.partName}' tidak cukup.`);

      await tx
        .update(spareParts)
        .set({
          stock: sql`${spareParts.stock} - ${p.quantity}`,
          price: p.unitPrice.toString(),
        })
        .where(eq(spareParts.id, p.sparePartId));
      return p.sparePartId;
    }

    // Logika Find or Create (Untuk Part Manual/Baru)
    const existing = await tx.query.spareParts.findFirst({
      where: eq(spareParts.partCode, p.partCode || ''),
    });
    if (existing) return existing.id;

    const [newPart] = await tx
      .insert(spareParts)
      .values({
        partCode: p.partCode || `NEW-${Date.now()}`,
        partName: p.partName,
        modelName: p.modelName || 'GENERIC',
        price: p.unitPrice.toString(),
        stock: 0,
        note: `Input manual via ${ticketNum}`,
      })
      .$returningId();
    return newPart.id;
  }

  private handleTransactionError(error: any, ticketNumber: string) {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    )
      throw error;
    console.error(`[Error ${ticketNumber}]:`, error);
    throw new InternalServerErrorException(
      'Gagal memproses transaksi database.'
    );
  }
  async findAllTechnicians() {
    return await this.db
      .select()
      .from(staff)
      .where(eq(staff.role, 'TECHNICIAN'));
  }
}
