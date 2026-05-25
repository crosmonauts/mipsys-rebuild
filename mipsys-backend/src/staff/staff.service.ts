import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { staff } from '../database/schema';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>
  ) {}

  async findAll() {
    return this.db.query.staff.findMany({ orderBy: [staff.name] });
  }

  async findOne(id: number) {
    const row = await this.db.query.staff.findFirst({ where: eq(staff.id, id) });
    if (!row) throw new NotFoundException(`Staff ID ${id} tidak ditemukan.`);
    return row;
  }

  async create(data: { name: string; role: 'ADMIN' | 'TECHNICIAN' }) {
    const [result] = await this.db.insert(staff).values(data);
    return { success: true, id: result.insertId };
  }

  async update(id: number, data: { name?: string; role?: 'ADMIN' | 'TECHNICIAN' }) {
    await this.findOne(id);
    await this.db.update(staff).set(data).where(eq(staff.id, id));
    return { success: true, id };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(staff).where(eq(staff.id, id));
    return { success: true, id };
  }
}
