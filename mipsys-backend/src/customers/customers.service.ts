import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { customers } from '../database/schema';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>
  ) {}

  async findAll(search?: string) {
    let query = this.db.query.customers.findMany({
      orderBy: [customers.name],
    });
    let rows = await query;
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(s) || r.phone?.toLowerCase().includes(s));
    }
    return rows;
  }

  async findOne(id: number) {
    const row = await this.db.query.customers.findFirst({
      where: eq(customers.id, id),
    });
    if (!row) throw new NotFoundException(`Customer ID ${id} tidak ditemukan.`);
    return row;
  }

  async create(data: { name: string; phone?: string; address?: string; customerType?: string }) {
    const [result] = await this.db.insert(customers).values({
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      customerType: data.customerType?.trim() || null,
    });
    return { success: true, id: result.insertId };
  }

  async update(id: number, data: { name?: string; phone?: string; address?: string; customerType?: string }) {
    await this.findOne(id);
    await this.db.update(customers).set(data).where(eq(customers.id, id));
    return { success: true, id };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(customers).where(eq(customers.id, id));
    return { success: true, id };
  }
}
