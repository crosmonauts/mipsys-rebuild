import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq, desc, like, or, SQL, isNotNull, count, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as ExcelJS from 'exceljs';
import * as schema from '../db/schema';
import {
  serviceRequests,
  customers,
  products,
  customerPhones,
  orderParts,
  spareParts,
  staff,
  StatusService,
  StatusServiceType,
} from '../db/schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateTechRequestDto } from './dto/update-tech-request.dto';
import { PartItemDto } from './dto/part-item.dto';

/** Tipe Drizzle transaction agar tidak menggunakan 'any' */
type DrizzleTx = Parameters<
  Parameters<MySql2Database<typeof schema>['transaction']>[0]
>[0];

@Injectable()
export class ServiceRequestService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>
  ) {}

  // ============================================================
  // 1. DASHBOARD & MONITORING
  // ============================================================

  async getDashboardStats() {
    const stats = await this.db
      .select({ status: serviceRequests.statusService, total: count() })
      .from(serviceRequests)
      .groupBy(serviceRequests.statusService);

    const result = {
      total: 0,
      waitingCheck: 0,
      check: 0,
      waitingApprove: 0,
      service: 0,
      done: 0,
      cancel: 0,
    };
    for (const s of stats) {
      const val = Number(s.total);
      result.total += val;
      if (s.status === StatusService.WAITING_CHECK) result.waitingCheck += val;
      if (s.status === StatusService.CHECK) result.check += val;
      if (s.status === StatusService.WAITING_APPROVE)
        result.waitingApprove += val;
      if (s.status === StatusService.SERVICE) result.service += val;
      if (s.status === StatusService.DONE) result.done += val;
      if (s.status === StatusService.CANCEL) result.cancel += val;
    }
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
      .limit(10);

    return logs.map((log) => ({
      time: log.updatedAt
        ? new Date(log.updatedAt).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '--:--',
      user: log.techName ?? 'System',
      task: `Tiket #${log.ticketNumber} diperbarui ke status ${log.statusService}`,
      status: log.statusService,
    }));
  }

  async getAllDashboard(search = '', page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let whereCondition: SQL | undefined;

    if (search) {
      whereCondition = or(
        like(serviceRequests.ticketNumber, `%${search}%`),
        like(customers.name, `%${search}%`),
        like(products.serialNumber, `%${search}%`)
      );
    }

    const [results, totalResult] = await Promise.all([
      this.db
        .select({
          id: serviceRequests.id,
          ticketNumber: serviceRequests.ticketNumber,
          customerName: customers.name,
          modelName: products.modelName,
          serialNumber: products.serialNumber,
          statusService: serviceRequests.statusService,
          serviceType: serviceRequests.serviceType,
          incomingDate: serviceRequests.incomingDate,
          createdAt: serviceRequests.createdAt,
        })
        .from(serviceRequests)
        .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
        .leftJoin(products, eq(serviceRequests.productId, products.id))
        .where(whereCondition)
        .orderBy(desc(serviceRequests.createdAt))
        .limit(limit)
        .offset(offset),

      this.db
        .select({ total: count() })
        .from(serviceRequests)
        .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
        .leftJoin(products, eq(serviceRequests.productId, products.id))
        .where(whereCondition),
    ]);

    const total = Number(totalResult[0]?.total ?? 0);
    return {
      data: results,
      meta: {
        currentPage: page,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: offset + results.length < total,
      },
    };
  }

  // ============================================================
  // 2. CREATE ENTRY
  // ============================================================

  async createEntry(dto: CreateServiceRequestDto, adminId: number) {
    return await this.db.transaction(async (tx) => {
      // FIX: resolveCustomerId kini menggunakan phone sebagai identifier unik
      const customerId = await this.resolveCustomerId(tx, dto);

      // FIX: resolveProductId kini menyimpan modelName dengan benar
      const productId = await this.resolveProductId(tx, dto);

      const today = this.todayString();

      // FIX: Insert dulu untuk mendapatkan auto-increment ID,
      // lalu gunakan ID sebagai suffix ticket number (collision-proof)
      const [insertResult] = await tx.insert(serviceRequests).values({
        ticketNumber: 'TEMP', // Placeholder, segera diupdate
        serviceType: dto.serviceType,
        customerId,
        productId,
        adminId,
        problemDescription: dto.problemDescription,
        serviceFee: (dto.serviceFee ?? 0).toString(),
        statusService: StatusService.WAITING_CHECK,
        incomingDate: new Date(),
      });

      const srId = insertResult.insertId;
      const dateStr = today.replace(/-/g, '');
      const ticketNumber = `SR-${dateStr}-${String(srId).padStart(4, '0')}`;

      await tx
        .update(serviceRequests)
        .set({ ticketNumber })
        .where(eq(serviceRequests.id, srId));

      return { success: true, ticketNumber };
    });
  }

  // ============================================================
  // 3. UPDATE TECHNICIAN DIAGNOSIS
  // ============================================================

  async updateTechDiagnosis(ticketNumber: string, dto: UpdateTechRequestDto) {
    const existingSR = await this.findServiceRequest(ticketNumber);
    const oldStatus = existingSR.statusService as StatusServiceType;
    const newStatus = dto.statusService as StatusServiceType;
    const today = this.todayString();

    return await this.db.transaction(async (tx) => {
      try {
        // --- Orchestrator stok berdasarkan transisi status ---
        if (
          oldStatus !== StatusService.SERVICE &&
          newStatus === StatusService.SERVICE
        ) {
          // Masuk SERVICE pertama kali → kurangi stok
          await this.applyStockReduction(tx, dto.parts);
        } else if (
          oldStatus === StatusService.SERVICE &&
          newStatus === StatusService.SERVICE
        ) {
          // Re-submit saat masih SERVICE → sinkronisasi stok
          await this.syncStockRevision(tx, existingSR.id, dto.parts);
        } else if (
          oldStatus === StatusService.SERVICE &&
          newStatus === StatusService.CANCEL
        ) {
          // Dibatalkan dari SERVICE → kembalikan semua stok
          await this.returnAllStockToInventory(tx, existingSR.id);
        }

        const totalPartFee = this.calculateTotalPartFee(dto.parts);

        // FIX: Set tanggal milestone sesuai transisi status
        const dateUpdates = this.buildDateUpdates(oldStatus, newStatus, today);

        await tx
          .update(serviceRequests)
          .set({
            statusService: newStatus as any,
            technicianCheckId: dto.technicianCheckId,
            remarksHistory: dto.remarksHistory,
            serviceFee: (
              dto.serviceFee ??
              Number(existingSR.serviceFee) ??
              0
            ).toString(),
            partFee: totalPartFee.toString(),
            updatedAt: new Date(),
            ...dateUpdates,
          })
          .where(eq(serviceRequests.id, existingSR.id));

        await this.saveOrderPartsInfo(tx, existingSR.id, dto.parts);

        return { success: true, message: `Tiket diperbarui ke ${newStatus}` };
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        throw new InternalServerErrorException(
          (error as Error).message ?? 'Gagal memproses transaksi.'
        );
      }
    });
  }

  // ============================================================
  // 4. READ DETAIL
  // ============================================================

  async getDetailByTicketNumber(ticketNumber: string) {
    const [ticket] = await this.db
      .select({
        id: serviceRequests.id,
        ticketNumber: serviceRequests.ticketNumber,
        rmaNo: serviceRequests.rmaNo,
        incNo: serviceRequests.incNo,
        serviceType: serviceRequests.serviceType,
        statusService: serviceRequests.statusService,
        problemDescription: serviceRequests.problemDescription,
        remarksHistory: serviceRequests.remarksHistory,
        serviceFee: serviceRequests.serviceFee,
        partFee: serviceRequests.partFee,
        shippingFee: serviceRequests.shippingFee,
        incomingDate: serviceRequests.incomingDate,
        checkDate: serviceRequests.checkDate,
        spDate: serviceRequests.spDate,
        approveDate: serviceRequests.approveDate,
        readyDate: serviceRequests.readyDate,
        closeDate: serviceRequests.closeDate,
        customerName: customers.name,
        customerAddress: customers.address,
        modelName: products.modelName,
        serialNumber: products.serialNumber,
        technicianName: staff.name,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .leftJoin(products, eq(serviceRequests.productId, products.id))
      .leftJoin(staff, eq(serviceRequests.technicianCheckId, staff.id))
      .where(eq(serviceRequests.ticketNumber, ticketNumber))
      .limit(1);

    if (!ticket)
      throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

    const parts = await this.db
      .select()
      .from(orderParts)
      .where(eq(orderParts.serviceRequestId, ticket.id));

    return { ...ticket, parts };
  }

  async findAllTechnicians() {
    return await this.db
      .select({ id: staff.id, name: staff.name })
      .from(staff)
      .where(eq(staff.role, 'TECHNICIAN'));
  }

  // ============================================================
  // 5. EXCEL EXPORT
  // ============================================================

  async exportToExcel(): Promise<Buffer> {
    const data = await this.db
      .select({
        ticketNumber: serviceRequests.ticketNumber,
        rmaNo: serviceRequests.rmaNo,
        incNo: serviceRequests.incNo,
        serviceType: serviceRequests.serviceType,
        customerName: customers.name,
        modelName: products.modelName,
        serialNumber: products.serialNumber,
        statusService: serviceRequests.statusService,
        problemDescription: serviceRequests.problemDescription,
        remarksHistory: serviceRequests.remarksHistory,
        incomingDate: serviceRequests.incomingDate,
        checkDate: serviceRequests.checkDate,
        approveDate: serviceRequests.approveDate,
        readyDate: serviceRequests.readyDate,
        closeDate: serviceRequests.closeDate,
        serviceFee: serviceRequests.serviceFee,
        partFee: serviceRequests.partFee,
        shippingFee: serviceRequests.shippingFee,
        techName: staff.name,
        createdAt: serviceRequests.createdAt,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .leftJoin(products, eq(serviceRequests.productId, products.id))
      .leftJoin(staff, eq(serviceRequests.technicianCheckId, staff.id))
      .orderBy(desc(serviceRequests.createdAt));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Service Request System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Service Requests', {
      views: [{ state: 'frozen', ySplit: 1 }],
      pageSetup: { orientation: 'landscape', fitToPage: true },
    });

    sheet.columns = [
      { header: 'No. Tiket', key: 'ticketNumber', width: 22 },
      { header: 'RMA No', key: 'rmaNo', width: 15 },
      { header: 'INC No', key: 'incNo', width: 15 },
      { header: 'Tipe Servis', key: 'serviceType', width: 14 },
      { header: 'Nama Customer', key: 'customerName', width: 28 },
      { header: 'Model', key: 'modelName', width: 22 },
      { header: 'Serial Number', key: 'serialNumber', width: 22 },
      { header: 'Status', key: 'statusService', width: 18 },
      { header: 'Keluhan', key: 'problemDescription', width: 38 },
      { header: 'Keterangan', key: 'remarksHistory', width: 38 },
      { header: 'Tgl Masuk', key: 'incomingDate', width: 13 },
      { header: 'Tgl Check', key: 'checkDate', width: 13 },
      { header: 'Tgl Approve', key: 'approveDate', width: 13 },
      { header: 'Tgl Siap', key: 'readyDate', width: 13 },
      { header: 'Tgl Selesai', key: 'closeDate', width: 13 },
      { header: 'Biaya Servis (Rp)', key: 'serviceFee', width: 18 },
      { header: 'Biaya Part (Rp)', key: 'partFee', width: 16 },
      { header: 'Biaya Kirim (Rp)', key: 'shippingFee', width: 17 },
      { header: 'Teknisi', key: 'techName', width: 22 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E79' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } },
      };
    });
    headerRow.height = 22;

    // Add data rows
    data.forEach((row, idx) => {
      const dataRow = sheet.addRow({
        ...row,
        serviceFee: Number(row.serviceFee ?? 0),
        partFee: Number(row.partFee ?? 0),
        shippingFee: Number(row.shippingFee ?? 0),
      });

      // Alternate row color
      if (idx % 2 === 1) {
        dataRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' },
          };
        });
      }

      // Format currency cells
      ['serviceFee', 'partFee', 'shippingFee'].forEach((key) => {
        const col = sheet.getColumn(key);
        const cell = dataRow.getCell(col.number);
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      });
    });

    // Auto-filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: data.length + 1, column: sheet.columnCount },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ============================================================
  // 6. PRIVATE HELPERS
  // ============================================================

  /**
   * FIX: Menggunakan nomor telepon sebagai identifier unik customer.
   * Sebelumnya: name sebagai key → customer berbeda nama sama dianggap 1 orang.
   * FIX: Phone juga sekarang disimpan ke tabel customer_phones.
   */
  private async resolveCustomerId(
    tx: DrizzleTx,
    dto: CreateServiceRequestDto
  ): Promise<number> {
    // Cari berdasarkan nomor telepon
    const [existingPhone] = await tx
      .select({ customerId: customerPhones.customerId })
      .from(customerPhones)
      .where(eq(customerPhones.phone, dto.phone))
      .limit(1);

    if (existingPhone?.customerId) {
      return existingPhone.customerId;
    }

    // Buat customer baru
    const [{ insertId: customerId }] = await tx.insert(customers).values({
      name: dto.customerName,
      address: dto.address,
      customerType: dto.customerType,
    });

    // FIX: Simpan nomor telepon (sebelumnya tidak pernah disimpan)
    await tx.insert(customerPhones).values({
      customerId,
      phone: dto.phone,
    });

    return customerId;
  }

  /**
   * FIX: Menyimpan modelName saat create produk baru.
   * Sebelumnya: modelName tidak disimpan, field selalu NULL.
   */
  private async resolveProductId(
    tx: DrizzleTx,
    dto: CreateServiceRequestDto
  ): Promise<number> {
    const [existing] = await tx
      .select()
      .from(products)
      .where(eq(products.serialNumber, dto.serialNumber))
      .limit(1);

    if (existing) {
      // Update modelName jika berbeda
      if (existing.modelName !== dto.modelName) {
        await tx
          .update(products)
          .set({ modelName: dto.modelName })
          .where(eq(products.id, existing.id));
      }
      return existing.id;
    }

    const [{ insertId }] = await tx.insert(products).values({
      serialNumber: dto.serialNumber,
      modelName: dto.modelName,
    });
    return insertId;
  }

  /**
   * FIX: Set tanggal milestone berdasarkan transisi status.
   * Sebelumnya semua date field selalu NULL karena tidak pernah diisi.
   */
  private buildDateUpdates(
    oldStatus: StatusServiceType,
    newStatus: StatusServiceType,
    today: string
  ): Record<string, string | null> {
    const updates: Record<string, string | null> = {};

    if (
      newStatus === StatusService.CHECK &&
      oldStatus === StatusService.WAITING_CHECK
    ) {
      updates.checkDate = today;
    }
    if (newStatus === StatusService.WAITING_APPROVE) {
      updates.spDate = today;
    }
    if (newStatus === StatusService.SERVICE) {
      updates.approveDate = today;
    }
    if (newStatus === StatusService.DONE) {
      updates.readyDate = today;
      updates.closeDate = today;
    }
    if (newStatus === StatusService.CANCEL) {
      updates.closeDate = today;
    }

    return updates;
  }

  /** Kurangi stok untuk setiap part yang memiliki sparePartId (ada di master) */
  private async applyStockReduction(tx: DrizzleTx, parts?: PartItemDto[]) {
    if (!parts?.length) return;

    for (const p of parts) {
      if (!p.sparePartId) continue; // Part manual, tidak ada di master stok

      const [item] = await tx
        .select({
          id: spareParts.id,
          stock: spareParts.stock,
          partName: spareParts.partName,
        })
        .from(spareParts)
        .where(eq(spareParts.id, p.sparePartId))
        .limit(1);

      if (!item) {
        throw new BadRequestException(
          `Spare part ID ${p.sparePartId} tidak ditemukan.`
        );
      }
      if ((item.stock ?? 0) < p.quantity) {
        throw new BadRequestException(
          `Stok '${item.partName}' tidak cukup. Tersedia: ${item.stock}, Diminta: ${p.quantity}`
        );
      }

      await tx
        .update(spareParts)
        .set({ stock: sql`${spareParts.stock} - ${p.quantity}` })
        .where(eq(spareParts.id, p.sparePartId));
    }
  }

  /** Kembalikan semua stok yang pernah diambil untuk service request ini */
  private async returnAllStockToInventory(tx: DrizzleTx, srId: number) {
    const usedParts = await tx
      .select()
      .from(orderParts)
      .where(eq(orderParts.serviceRequestId, srId));

    for (const p of usedParts) {
      if (!p.sparePartId) continue;
      await tx
        .update(spareParts)
        .set({ stock: sql`${spareParts.stock} + ${p.quantity}` })
        .where(eq(spareParts.id, p.sparePartId));
    }
  }

  /**
   * Sinkronisasi stok saat teknisi mengedit part di status SERVICE.
   * Kembalikan stok lama → kurangi stok baru (atomic dalam 1 transaksi).
   */
  private async syncStockRevision(
    tx: DrizzleTx,
    srId: number,
    newParts?: PartItemDto[]
  ) {
    await this.returnAllStockToInventory(tx, srId);
    await this.applyStockReduction(tx, newParts);
  }

  /**
   * Simpan daftar part ke tabel order_parts.
   * Menggunakan delete-then-insert karena tabel ini adalah usage record,
   * bukan PO tracker (PO tracker ada di tabel purchase_orders).
   */
  private async saveOrderPartsInfo(
    tx: DrizzleTx,
    srId: number,
    parts?: PartItemDto[]
  ) {
    await tx.delete(orderParts).where(eq(orderParts.serviceRequestId, srId));
    if (!parts?.length) return;

    const rows = parts.map((p) => ({
      serviceRequestId: srId,
      sparePartId: p.sparePartId ?? null,
      partName: p.partName,
      quantity: p.quantity,
      priceAtAction: p.unitPrice.toString(),
      status: (p.sparePartId ? 'IN_STOCK' : 'MANUAL_NEW') as
        | 'IN_STOCK'
        | 'MANUAL_NEW',
    }));

    await tx.insert(orderParts).values(rows);
  }

  private async findServiceRequest(ticketNumber: string) {
    const sr = await this.db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.ticketNumber, ticketNumber),
    });
    if (!sr)
      throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);
    return sr;
  }

  private calculateTotalPartFee(parts?: PartItemDto[]): number {
    return (parts ?? []).reduce(
      (acc, p) =>
        acc + Math.round(Number(p.quantity) * Number(p.unitPrice) * 100) / 100,
      0
    );
  }

  /** Format tanggal hari ini sebagai string 'YYYY-MM-DD' untuk kolom date MySQL */
  private todayString(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
