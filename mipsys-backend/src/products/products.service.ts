import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, like, or } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { products } from '../database/schema';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>
  ) {}

  async findAll(search?: string) {
    return this.db.query.products.findMany({
      where: search
        ? or(
            like(products.modelName, `%${search}%`),
            like(products.serialNumber, `%${search}%`),
          )
        : undefined,
      orderBy: [products.modelName],
    });
  }

  async findOne(id: number) {
    const row = await this.db.query.products.findFirst({ where: eq(products.id, id) });
    if (!row) throw new NotFoundException(`Product ID ${id} tidak ditemukan.`);
    return row;
  }

  async create(data: { modelName: string; serialNumber: string }) {
    const [result] = await this.db.insert(products).values({
      modelName: data.modelName.trim(),
      serialNumber: data.serialNumber.trim(),
    });
    return { success: true, id: result.insertId };
  }

  async update(id: number, data: { modelName?: string; serialNumber?: string }) {
    await this.findOne(id);
    await this.db.update(products).set(data).where(eq(products.id, id));
    return { success: true, id };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(products).where(eq(products.id, id));
    return { success: true, id };
  }
}
