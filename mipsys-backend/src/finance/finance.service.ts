import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { eq, like, or, desc, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { invoices, serviceRequests } from '../database/schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>
  ) {}

  async findAll(search?: string, status?: string) {
    let query = this.db.query.invoices.findMany({
      orderBy: [desc(invoices.invoiceDate)],
    });

    const results = await query;

    let filtered = results;
    if (search) {
      const pattern = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.invoiceNumber?.toLowerCase().includes(pattern) ||
          i.clientName?.toLowerCase().includes(pattern) ||
          i.ticketNumber?.toLowerCase().includes(pattern)
      );
    }
    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }

    return filtered;
  }

  async findOne(id: number) {
    const invoice = await this.db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });
    if (!invoice) throw new NotFoundException(`Invoice ID ${id} tidak ditemukan.`);
    return invoice;
  }

  async create(dto: CreateInvoiceDto) {
    const sr = await this.db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.ticketNumber, dto.ticketNumber),
    });
    if (!sr) throw new NotFoundException(`Tiket ${dto.ticketNumber} tidak ditemukan.`);

    const invoiceNumber = this.generateInvoiceNumber();
    const total = dto.serviceFee + dto.partFee + dto.shippingFee;
    const ppn = total * 0.11;

    const [result] = await this.db.insert(invoices).values({
      invoiceNumber,
      ticketNumber: dto.ticketNumber,
      serviceRequestId: sr.id,
      clientName: dto.clientName,
      serviceFee: dto.serviceFee.toString(),
      partFee: dto.partFee.toString(),
      shippingFee: dto.shippingFee.toString(),
      ppn: ppn.toString(),
      total: (total + ppn).toString(),
      status: 'UNPAID',
      invoiceDate: new Date(),
      notes: dto.notes?.trim() ?? null,
    });

    return { success: true, id: result.insertId, invoiceNumber };
  }

  async markAsPaid(id: number, method: string) {
    const invoice = await this.findOne(id);

    await this.db
      .update(invoices)
      .set({
        status: 'PAID',
        paymentMethod: method,
        paidDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id));

    return { success: true, message: `Invoice ${invoice.invoiceNumber} marked as PAID` };
  }

  async getStats() {
    const allInvoices = await this.db.query.invoices.findMany();

    const totalRevenue = allInvoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + parseFloat(i.total || '0'), 0);

    const outstanding = allInvoices
      .filter((i) => i.status === 'UNPAID')
      .reduce((sum, i) => sum + parseFloat(i.total || '0'), 0);

    const paidCount = allInvoices.filter((i) => i.status === 'PAID').length;
    const unpaidCount = allInvoices.filter((i) => i.status === 'UNPAID').length;
    const overdueCount = allInvoices.filter((i) => i.status === 'OVERDUE').length;

    return {
      totalRevenue,
      outstanding,
      paidCount,
      unpaidCount,
      overdueCount,
      totalInvoices: allInvoices.length,
    };
  }

  async generateFromServiceRequest(ticketNumber: string) {
    const sr = await this.db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.ticketNumber, ticketNumber),
    });
    if (!sr) throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

    const existing = await this.db.query.invoices.findFirst({
      where: eq(invoices.ticketNumber, ticketNumber),
    });
    if (existing) throw new BadRequestException(`Invoice untuk tiket ${ticketNumber} sudah ada.`);

    const total = parseFloat(sr.serviceFee || '0') + parseFloat(sr.partFee || '0') + parseFloat(sr.shippingFee || '0');
    const ppn = total * 0.11;
    const invoiceNumber = this.generateInvoiceNumber();

    const [result] = await this.db.insert(invoices).values({
      invoiceNumber,
      ticketNumber,
      serviceRequestId: sr.id,
      clientName: 'Customer',
      serviceFee: sr.serviceFee || '0.00',
      partFee: sr.partFee || '0.00',
      shippingFee: sr.shippingFee || '0.00',
      ppn: ppn.toString(),
      total: (total + ppn).toString(),
      status: 'UNPAID',
      invoiceDate: new Date(),
    });

    return { success: true, id: result.insertId, invoiceNumber };
  }

  private generateInvoiceNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = String(Math.floor(Math.random() * 9000) + 1000);
    return `INV-${dateStr}-${random}`;
  }
}
