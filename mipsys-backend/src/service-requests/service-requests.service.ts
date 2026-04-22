import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc, like, or, SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import {
  serviceRequests,
  customers,
  products,
  customerPhones,
} from 'src/db/schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { InputBiayaDto } from './dto/input-biaya.dto';
import { UpdateTechRequestDto } from './dto/update-tech-request.dto';

@Injectable()
export class ServiceRequestService {
  constructor(@Inject('DB_CONNECTION') private db: MySql2Database<any>) {}

  /**
   * 1. DASHBOARD RESEPSIONIS
   * Teroptimasi untuk pencarian cepat dan paginasi
   */
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
      .leftJoin(products, eq(serviceRequests.productId, products.id)) // Join ke products agar model & SN terbaca
      .where(whereCondition)
      .orderBy(desc(serviceRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const hasNextPage = results.length === limit;

    return {
      data: results,
      meta: { currentPage: page, itemsPerPage: limit, hasNextPage },
    };
  }

  /**
   * 2. DETAIL TIKET (Pencarian menggunakan Ticket Number)
   */
  async getDetailByTicketNumber(ticketNumber: string) {
    const result = await this.db
      .select({
        // Data Utama Tiket
        id: serviceRequests.id,
        ticketNumber: serviceRequests.ticketNumber,
        serviceType: serviceRequests.serviceType,
        problemDescription: serviceRequests.problemDescription, // Untuk Keluhan
        statusService: serviceRequests.statusService,
        statusSystem: serviceRequests.statusSystem,

        // Data Waktu & Biaya
        incomingDate: serviceRequests.incomingDate,
        readyDate: serviceRequests.readyDate,
        pickUpDate: serviceRequests.pickUpDate,
        partFee: serviceRequests.partFee,
        serviceFee: serviceRequests.serviceFee,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt,

        // Data Relasi (JOIN) untuk mengisi kekosongan UI Frontend
        customerName: customers.name,
        customerAddress: customers.address,
        customerPhone: customerPhones.phone, // Untuk Kontak
        modelName: products.modelName,
        serialNumber: products.serialNumber,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .leftJoin(products, eq(serviceRequests.productId, products.id))
      // Join ekstra untuk mengambil nomor telepon
      .leftJoin(customerPhones, eq(customers.id, customerPhones.customerId))
      .where(eq(serviceRequests.ticketNumber, ticketNumber))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(
        `Tiket dengan nomor ${ticketNumber} tidak ditemukan`
      );
    }
    return result[0];
  }

  /**
   * 3. CREATE ENTRY (MAKSIMAL: Transaction + Audit Admin + Unique Check)
   */
  async createEntry(dto: CreateServiceRequestDto, adminId: number) {
    // Memulai Transaksi Database
    return await this.db.transaction(async (tx) => {
      // --- A. HANDLING CUSTOMER (Cek Berdasarkan Nama) ---
      let customerId: number;
      const [existingCust] = await tx
        .select()
        .from(customers)
        .where(eq(customers.name, dto.customerName || ''))
        .limit(1);

      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const [{ insertId }] = await tx.insert(customers).values({
          name: dto.customerName || 'Tanpa Nama',
          address: dto.address,
          customerType: dto.customerType || 'PERSONAL',
        });
        customerId = insertId;

        // Simpan nomor HP untuk customer baru
        await tx.insert(customerPhones).values({
          customerId,
          phone: dto.phone || '-',
        });
      }

      // --- B. HANDLING PRODUCT (Cek Berdasarkan Serial Number) ---
      let productId: number;
      const [existingProd] = await tx
        .select()
        .from(products)
        .where(eq(products.serialNumber, dto.serialNumber || ''))
        .limit(1);

      if (existingProd) {
        productId = existingProd.id; // Gunakan produk yang sudah terdaftar
      } else {
        const [{ insertId }] = await tx.insert(products).values({
          serialNumber: dto.serialNumber || 'SN-UNKNOWN',
          modelName: dto.modelName || 'UNKNOWN MODEL',
        });
        productId = insertId;
      }

      // --- C. GENERATE TICKET NUMBER ---
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const newTicketNumber = `SR-${dateStr}-${randomNum}`;

      // --- D. INSERT SERVICE REQUEST (DENGAN ADMIN ID) ---
      await tx.insert(serviceRequests).values({
        ticketNumber: newTicketNumber,
        serviceType: dto.serviceType || 'NON_WARRANTY',
        customerId: customerId,
        productId: productId,
        adminId: adminId,
        problemDescription: dto.problemDescription,
        statusService: 'WAITING CHECK',
        statusSystem: 'OPEN',
        serviceFee: dto.serviceFee ? dto.serviceFee.toString() : '0',
        partFee: '0',
        incomingDate: new Date(),
      });

      return {
        success: true,
        ticketNumber: newTicketNumber,
        message: 'Data lengkap berhasil tersimpan di sistem.',
      };
    });
  }

  /**
   * 4. UPDATE OLEH TEKNISI (Diagnosis & Perbaikan)
   */
  async updateTechDiagnosis(ticketNumber: string, dto: UpdateTechRequestDto) {
    // A. Inisialisasi Kalkulator
    let totalPartFee = 0;

    // B. Logika Perulangan Kalkulasi (Looping)
    if (dto.parts && dto.parts.length > 0) {
      // Kita hitung menggunakan metode .reduce() agar lebih bersih (Clean Code)
      totalPartFee = dto.parts.reduce((acc, part) => {
        const subtotal = (part.quantity || 0) * (part.unitPrice || 0);
        return acc + subtotal;
      }, 0);
    }

    // C. Update Database
    await this.db
      .update(serviceRequests)
      .set({
        problemDescription: dto.problemDescription,
        statusService: dto.statusService,
        technicianFixId: dto.technicianFixId,
        // Drizzle menyimpan decimal sebagai string, jadi kita konversi .toString()
        partFee: totalPartFee.toString(),
        // Jika status DONE, set tanggal siap ambil sekarang
        readyDate: dto.statusService === 'DONE' ? new Date() : null,
      })
      .where(eq(serviceRequests.ticketNumber, ticketNumber));

    return {
      success: true,
      totalCalculated: totalPartFee,
      message: `Diagnosis & rincian biaya Rp ${totalPartFee.toLocaleString()} berhasil disimpan.`,
    };
  }

  /**
   * 5. PROSES KASIR (Nota & Pembayaran)
   */
  async prosesKasir(ticketNumber: string, dto: InputBiayaDto) {
    await this.db
      .update(serviceRequests)
      .set({
        serviceFee: dto.serviceFee.toString(),
        partFee: dto.partFee.toString(),
        statusSystem: 'CLOSED',
        pickUpDate: new Date(),
      })
      .where(eq(serviceRequests.ticketNumber, ticketNumber));

    return {
      success: true,
      message: `Pembayaran tiket ${ticketNumber} berhasil diproses.`,
    };
  }
}
