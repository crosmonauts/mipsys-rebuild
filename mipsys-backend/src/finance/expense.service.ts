import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc, and, between, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { expenses, purchaseOrders, financeSettings } from '../database/schema';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
  ) {}

  async findAll(filters: { type?: string; category?: string; startDate?: string; endDate?: string }) {
    const sqlConditions: any[] = [];
    if (filters.type) sqlConditions.push(eq(expenses.expenseType, filters.type as any));
    if (filters.category) sqlConditions.push(eq(expenses.category, filters.category as any));
    if (filters.startDate && filters.endDate) {
      sqlConditions.push(between(expenses.expenseDate, new Date(filters.startDate), new Date(filters.endDate)));
    }

    return this.db.query.expenses.findMany({
      orderBy: [desc(expenses.expenseDate)],
      where: sqlConditions.length > 0 ? (and(...sqlConditions) as any) : undefined,
    });
  }

  async findOne(id: number) {
    const expense = await this.db.query.expenses.findFirst({
      where: eq(expenses.id, id) as any,
    });
    if (!expense) throw new NotFoundException(`Expense ID ${id} tidak ditemukan.`);
    return expense;
  }

  async create(dto: CreateExpenseDto) {
    const expenseNumber = await this.generateExpenseNumber();
    const [result] = await this.db.insert(expenses).values({
      expenseNumber,
      expenseType: 'OPERATIONAL',
      description: dto.description,
      amount: dto.amount.toString(),
      expenseDate: new Date(dto.expenseDate),
      category: dto.category || 'OTHER',
    });
    return { success: true, id: result.insertId, expenseNumber };
  }

  async update(id: number, dto: UpdateExpenseDto) {
    await this.findOne(id);
    const values: any = {};
    if (dto.description !== undefined) values.description = dto.description;
    if (dto.amount !== undefined) values.amount = dto.amount.toString();
    if (dto.expenseDate !== undefined) values.expenseDate = new Date(dto.expenseDate);
    if (dto.category !== undefined) values.category = dto.category;
    await this.db.update(expenses).set(values).where(eq(expenses.id, id) as any);
    return { success: true };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(expenses).where(eq(expenses.id, id) as any);
    return { success: true };
  }

  async syncFromPo(poId?: number) {
    const where = poId
      ? eq(purchaseOrders.id, poId) as any
      : eq(purchaseOrders.status, 'RECEIVED' as any);

    const receivedPOs = await this.db.query.purchaseOrders.findMany({ where });

    const results: any[] = [];
    for (const po of receivedPOs) {
      const existing = await this.db.query.expenses.findFirst({
        where: eq(expenses.poId, po.id) as any,
      });
      if (existing) continue;

      const expenseNumber = await this.generateExpenseNumber();
      const [result] = await this.db.insert(expenses).values({
        expenseNumber,
        expenseType: 'PO',
        poId: po.id,
        description: `PO ${po.poNumber} — ${po.supplierName}`,
        amount: po.totalAmount || '0',
        expenseDate: po.receivedDate ? new Date(po.receivedDate) : new Date(),
        category: 'OTHER',
      });
      results.push({ id: result.insertId, expenseNumber, poNumber: po.poNumber });
    }

    return { success: true, synced: results.length, items: results };
  }

  private async generateExpenseNumber(): Promise<string> {
    const now = new Date();
    const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const counterKey = `exp_counter_${period}`;

    await this.db
      .insert(financeSettings)
      .values({ key: counterKey, value: '0', description: `Expense counter for ${period}` })
      .onDuplicateKeyUpdate({ set: { value: sql`value` } });

    await this.db
      .update(financeSettings)
      .set({ value: sql`CAST(CAST(${financeSettings.value} AS UNSIGNED) + 1 AS CHAR)` })
      .where(eq(financeSettings.key, counterKey) as any);

    const updated = await this.db.query.financeSettings.findFirst({
      where: eq(financeSettings.key, counterKey) as any,
    });
    const counter = updated ? parseInt(updated.value, 10) : 1;

    return `EXP-${period}-${String(counter).padStart(4, '0')}`;
  }
}
