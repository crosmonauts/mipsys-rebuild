# Finance Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete finance module with enhanced invoicing, expense tracking, P&L reports, and financial dashboard.

**Architecture:** Extend existing NestJS `FinanceModule` with 4 services (Finance, Expense, Report, Settings). Add 3 new DB tables (`payment_histories`, `expenses`, `finance_settings`). Frontend gets 4 new routes under `/finance/*`. Export via ExcelJS (backend XLSX) + PDFKit (backend PDF).

**Tech Stack:** NestJS, Drizzle ORM (MySQL), Next.js App Router, Tailwind v4, Lucide, recharts

**Spec:** `.agents/plans/2026-05-18-finance-module-design.md`

---

## File Structure

### Database (all under `mipsys-backend/src/database/schema/`)
- **Modify:** `invoice.schema.ts` — add ppn_rate, voidedAt, payment_method enum, VOID status
- **Create:** `payment-history.schema.ts` — payment_histories table
- **Create:** `expense.schema.ts` — expenses table
- **Create:** `finance-setting.schema.ts` — finance_settings table
- **Modify:** `relations.ts` — add invoice→payment_histories, expense→staff relations
- **Modify:** `index.ts` — export new schemas

### Backend (all under `mipsys-backend/src/finance/`)
- **Modify:** `finance.service.ts` — enhance with sequential numbering, PPN snapshot, void, multi-pay
- **Modify:** `finance.controller.ts` — add void, export endpoints
- **Modify:** `dto/create-invoice.dto.ts` — add ppnRate, paymentMethod enum
- **Create:** `dto/update-settings.dto.ts` — settings validation
- **Create:** `expense.service.ts` — expense CRUD + PO sync
- **Create:** `expense.controller.ts` — expense REST endpoints
- **Create:** `report.service.ts` — P&L, PPN recap, dashboard
- **Create:** `report.controller.ts` — report REST endpoints
- **Create:** `settings.service.ts` — key-value config
- **Create:** `settings.controller.ts` — settings REST endpoints
- **Modify:** `finance.module.ts` — register new services/controllers

### Frontend (all under `mipsys-frontend-v2/src/features/finance/`)
- **Modify:** `types/index.ts` — add Expense, PaymentHistory, Settings types
- **Modify:** `api/finance-api.ts` — add expense, report, settings, export calls
- **Modify:** `hooks/useFinance.ts` — enhance with payment recording
- **Create:** `hooks/useExpenses.ts` — expense CRUD hooks
- **Modify:** `components/InvoiceTableRow.tsx` — add void button
- **Create:** `components/InvoiceDetailModal.tsx` — detail + payment history
- **Create:** `components/PaymentForm.tsx` — record payment form
- **Create:** `components/ExpenseForm.tsx` — add/edit expense form
- **Create:** `components/ExpenseTable.tsx` — expense list table
- **Create:** `components/SettingsForm.tsx` — config form
- **Create:** `reports/ProfitLossChart.tsx` — revenue vs expense chart
- **Create:** `reports/PpnReport.tsx` — PPN monthly report
- **Create:** `reports/ExportButton.tsx` — export trigger button
- **Create:** `expenses/page.tsx` — expense page
- **Modify:** `page.tsx` — enhance with detail modal, payment

### Frontend (app routing under `mipsys-frontend-v2/src/app/finance/`)
- **Create:** `app/finance/expenses/page.tsx` — route wrapper
- **Create:** `app/finance/reports/page.tsx` — route wrapper
- **Create:** `app/finance/settings/page.tsx` — route wrapper

---

## Task List

### Task 1: Enhance Invoice Schema

**Files:**
- Modify: `mipsys-backend/src/database/schema/invoice.schema.ts`

- [ ] **Add ppn_rate, voidedAt, expand enum VOID + payment_method**

Modify invoice schema to add the new fields:

```typescript
// Add to existing imports
import { uniqueIndex } from 'drizzle-orm/mysql-core';

// Change status to include VOID
  status: mysqlEnum('status', ['PAID', 'UNPAID', 'OVERDUE', 'VOID']).default('UNPAID'),

// Change paymentMethod to typed enum
  paymentMethod: mysqlEnum('payment_method', ['CASH', 'TRANSFER', 'QRIS']),

// Add new fields after notes:
  ppnRate: decimal('ppn_rate', { precision: 5, scale: 2 }).default('11.00'),
  voidedAt: timestamp('voided_at'),

// Add to indexes:
  ticketUnique: uniqueIndex('inv_ticket_unique').on(table.ticketNumber),
```

### Task 2: Create Payment History Schema

**Files:**
- Create: `mipsys-backend/src/database/schema/payment-history.schema.ts`

- [ ] **Create payment_histories table**

```typescript
import {
  mysqlTable,
  varchar,
  decimal,
  int,
  timestamp,
  mysqlEnum,
  text,
  index,
} from 'drizzle-orm/mysql-core';
import { invoices } from './invoice.schema';

export const paymentHistories = mysqlTable(
  'payment_histories',
  {
    id: int('id').autoincrement().primaryKey(),
    invoiceId: int('invoice_id')
      .notNull()
      .references(() => invoices.id),
    amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
    paymentMethod: mysqlEnum('payment_method', ['CASH', 'TRANSFER', 'QRIS']).notNull(),
    paidAt: timestamp('paid_at').defaultNow().notNull(),
    referenceNumber: varchar('reference_number', { length: 100 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    invoiceIdx: index('ph_invoice_idx').on(table.invoiceId),
  })
);
```

### Task 3: Create Expense Schema

**Files:**
- Create: `mipsys-backend/src/database/schema/expense.schema.ts`

- [ ] **Create expenses table**

```typescript
import {
  mysqlTable,
  varchar,
  decimal,
  int,
  timestamp,
  date,
  mysqlEnum,
  text,
  index,
} from 'drizzle-orm/mysql-core';
import { staff } from './service-request.schema';
import { purchaseOrders } from './purchase-order.schema';

export const expenses = mysqlTable(
  'expenses',
  {
    id: int('id').autoincrement().primaryKey(),
    expenseNumber: varchar('expense_number', { length: 100 }).unique().notNull(),
    expenseType: mysqlEnum('expense_type', ['PO', 'OPERATIONAL']).notNull(),
    poId: int('po_id').references(() => purchaseOrders.id),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
    expenseDate: date('expense_date').notNull(),
    category: mysqlEnum('category', [
      'UTILITY', 'RENT', 'SALARY', 'TRANSPORT', 'OTHER',
    ]).default('OTHER'),
    createdBy: int('created_by').references(() => staff.id),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    expenseTypeIdx: index('exp_type_idx').on(table.expenseType),
    poIdx: index('exp_po_idx').on(table.poId),
    dateIdx: index('exp_date_idx').on(table.expenseDate),
  })
);
```

### Task 4: Create Finance Settings Schema

**Files:**
- Create: `mipsys-backend/src/database/schema/finance-setting.schema.ts`

- [ ] **Create finance_settings table**

```typescript
import { mysqlTable, varchar, int, timestamp } from 'drizzle-orm/mysql-core';

export const financeSettings = mysqlTable('finance_settings', {
  id: int('id').autoincrement().primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
```

### Task 5: Update Relations & Index

**Files:**
- Modify: `mipsys-backend/src/database/schema/relations.ts`
- Modify: `mipsys-backend/src/database/schema/index.ts`

- [ ] **Add relations for new tables**

In `relations.ts`, add:

```typescript
import { paymentHistories } from './payment-history.schema';
import { expenses } from './expense.schema';

// After serviceRequestsRelations, add:
export const invoicesRelations = relations(invoices, ({ many }) => ({
  payments: many(paymentHistories),
}));

export const paymentHistoriesRelations = relations(paymentHistories, ({ one }) => ({
  invoice: one(invoices, {
    fields: [paymentHistories.invoiceId],
    references: [invoices.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [expenses.poId],
    references: [purchaseOrders.id],
  }),
  createdByStaff: one(staff, {
    fields: [expenses.createdBy],
    references: [staff.id],
  }),
}));
```

In `index.ts`, add:

```typescript
export * from './payment-history.schema';
export * from './expense.schema';
export * from './finance-setting.schema';
```

- [ ] **Gate: User runs `npm run db:push`**

```bash
cd mipsys-backend && npm run db:push
```

Wait for user confirmation before continuing.

### Task 6: Enhance FinanceService

**Files:**
- Modify: `mipsys-backend/src/finance/finance.service.ts`

- [ ] **Refactor generateInvoiceNumber to sequential counter**

```typescript
private async generateInvoiceNumber(): Promise<string> {
  const prefix = 'INV';
  const now = new Date();
  const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Get or create counter
  const existing = await this.db.query.financeSettings.findFirst({
    where: eq(financeSettings.key, `inv_counter_${period}`),
  });

  let counter = 1;
  if (existing) {
    counter = parseInt(existing.value, 10) + 1;
    await this.db
      .update(financeSettings)
      .set({ value: String(counter), updatedAt: new Date() })
      .where(eq(financeSettings.key, `inv_counter_${period}`));
  } else {
    await this.db.insert(financeSettings).values({
      key: `inv_counter_${period}`,
      value: '1',
      description: `Invoice counter for ${period}`,
    });
  }

  return `${prefix}-${period}-${String(counter).padStart(4, '0')}`;
}
```

- [ ] **Add PPN rate snapshot from settings in create()**

In the `create` method, fetch PPN rate from settings:

```typescript
async getPpnRate(): Promise<number> {
  const setting = await this.db.query.financeSettings.findFirst({
    where: eq(financeSettings.key, 'ppn_rate'),
  });
  return setting ? parseFloat(setting.value) : 11;
}
```

Then in `create` and `generateFromServiceRequest`, use `await this.getPpnRate()` instead of hardcoded 0.11.

- [ ] **Add voidInvoice method**

```typescript
async voidInvoice(id: number) {
  const invoice = await this.findOne(id);
  if (invoice.status === 'PAID') {
    throw new BadRequestException('Cannot void a paid invoice.');
  }
  await this.db
    .update(invoices)
    .set({ status: 'VOID', voidedAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, id));
  return { success: true, message: `Invoice ${invoice.invoiceNumber} voided` };
}
```

- [ ] **Add recordPayment method**

```typescript
async recordPayment(id: number, dto: RecordPaymentDto) {
  const invoice = await this.findOne(id);
  if (invoice.status === 'PAID') {
    throw new BadRequestException('Invoice already paid.');
  }

  // Insert payment history
  await this.db.insert(paymentHistories).values({
    invoiceId: id,
    amount: dto.amount.toString(),
    paymentMethod: dto.paymentMethod,
    referenceNumber: dto.referenceNumber || null,
    notes: dto.notes || null,
  });

  // Update invoice status
  await this.db
    .update(invoices)
    .set({
      status: 'PAID',
      paymentMethod: dto.paymentMethod,
      paidDate: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id));

  return { success: true, message: `Payment recorded for ${invoice.invoiceNumber}` };
}
```

- [ ] **Update findOne to include payment history**

```typescript
async findOne(id: number) {
  const invoice = await this.db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: {
      payments: {
        orderBy: [desc(paymentHistories.paidAt)],
      },
    },
  });
  if (!invoice) throw new NotFoundException(`Invoice ID ${id} tidak ditemukan.`);
  return invoice;
}
```

### Task 7: Update FinanceController & DTOs

**Files:**
- Modify: `mipsys-backend/src/finance/finance.controller.ts`
- Modify: `mipsys-backend/src/finance/dto/create-invoice.dto.ts`
- Create: `mipsys-backend/src/finance/dto/record-payment.dto.ts`

- [ ] **Create RecordPaymentDto**

```typescript
// Create: dto/record-payment.dto.ts
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  QRIS = 'QRIS',
}

export class RecordPaymentDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

- [ ] **Add paymentMethod enum to CreateInvoiceDto**

```typescript
// In create-invoice.dto.ts, add:
import { IsEnum } from 'class-validator';

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  QRIS = 'QRIS',
}

// Add to CreateInvoiceDto:
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
```

- [ ] **Add void + pay endpoints to controller**

```typescript
  @Patch('invoices/:id/void')
  async voidInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.voidInvoice(id);
  }

  @Post('invoices/:id/pay')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.financeService.recordPayment(id, dto);
  }
```

### Task 8: Create ExpenseService + Controller

**Files:**
- Create: `mipsys-backend/src/finance/expense.service.ts`
- Create: `mipsys-backend/src/finance/expense.controller.ts`
- Create: `mipsys-backend/src/finance/dto/create-expense.dto.ts`

- [ ] **Create CreateExpenseDto**

```typescript
// dto/create-expense.dto.ts
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export enum ExpenseCategory {
  UTILITY = 'UTILITY',
  RENT = 'RENT',
  SALARY = 'SALARY',
  TRANSPORT = 'TRANSPORT',
  OTHER = 'OTHER',
}

export class CreateExpenseDto {
  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  expenseDate!: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  expenseDate?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;
}
```

- [ ] **Create ExpenseService**

```typescript
// expense.service.ts
import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, desc, between, like, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { expenses, purchaseOrders } from '../database/schema';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
  ) {}

  async findAll(filters: { type?: string; category?: string; startDate?: string; endDate?: string }) {
    const conditions = [];
    if (filters.type) conditions.push(eq(expenses.expenseType, filters.type));
    if (filters.category) conditions.push(eq(expenses.category, filters.category));
    if (filters.startDate && filters.endDate) {
      conditions.push(between(expenses.expenseDate, filters.startDate, filters.endDate));
    }

    const query = this.db.query.expenses.findMany({
      orderBy: [desc(expenses.expenseDate)],
      where: conditions.length ? (conditions as any).reduce((a: any, b: any) => a && b) : undefined,
    });

    return query;
  }

  async findOne(id: number) {
    const expense = await this.db.query.expenses.findFirst({
      where: eq(expenses.id, id),
    });
    if (!expense) throw new NotFoundException(`Expense ID ${id} tidak ditemukan.`);
    return expense;
  }

  async create(dto: CreateExpenseDto, userId: number) {
    const expenseNumber = await this.generateExpenseNumber();
    const [result] = await this.db.insert(expenses).values({
      expenseNumber,
      expenseType: 'OPERATIONAL',
      description: dto.description,
      amount: dto.amount.toString(),
      expenseDate: dto.expenseDate,
      category: dto.category || 'OTHER',
      createdBy: userId,
    });
    return { success: true, id: result.insertId, expenseNumber };
  }

  async update(id: number, dto: UpdateExpenseDto) {
    await this.findOne(id);
    await this.db.update(expenses).set({ ...dto, amount: dto.amount?.toString() }).where(eq(expenses.id, id));
    return { success: true };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(expenses).where(eq(expenses.id, id));
    return { success: true };
  }

  async syncFromPo(poId?: number) {
    const where = poId ? eq(purchaseOrders.id, poId) : eq(purchaseOrders.status, 'RECEIVED');
    const receivedPOs = await this.db.query.purchaseOrders.findMany({
      where,
    });

    const results = [];
    for (const po of receivedPOs) {
      const existing = await this.db.query.expenses.findFirst({
        where: eq(expenses.poId, po.id),
      });
      if (existing) continue;

      const expenseNumber = await this.generateExpenseNumber();
      const [result] = await this.db.insert(expenses).values({
        expenseNumber,
        expenseType: 'PO',
        poId: po.id,
        description: `PO ${po.poNumber} — ${po.supplierName}`,
        amount: po.totalAmount || '0',
        expenseDate: po.receivedDate || new Date().toISOString().split('T')[0],
        category: 'OTHER',
      });
      results.push({ id: result.insertId, expenseNumber, poNumber: po.poNumber });
    }

    return { success: true, synced: results.length, items: results };
  }

  private async generateExpenseNumber(): Promise<string> {
    const now = new Date();
    const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = 'EXP';

    const last = await this.db.query.expenses.findMany({
      orderBy: [desc(expenses.id)],
      limit: 1,
    });

    const nextId = last.length > 0 ? last[0].id + 1 : 1;
    return `${prefix}-${period}-${String(nextId).padStart(4, '0')}`;
  }
}
```

- [ ] **Create ExpenseController**

```typescript
// expense.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';

@Controller('finance/expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expenseService.findAll({ type, category, startDate, endDate });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.expenseService.findOne(id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() dto: CreateExpenseDto) {
    return this.expenseService.create(dto, 1);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExpenseDto) {
    return this.expenseService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.expenseService.remove(id);
  }

  @Post('sync-po')
  async syncPo(@Query('poId') poId?: string) {
    return this.expenseService.syncFromPo(poId ? parseInt(poId) : undefined);
  }
}
```

### Task 9: Create ReportService + Controller

**Files:**
- Create: `mipsys-backend/src/finance/report.service.ts`
- Create: `mipsys-backend/src/finance/report.controller.ts`

- [ ] **Create ReportService**

```typescript
// report.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { invoices, expenses } from '../database/schema';

@Injectable()
export class ReportService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
  ) {}

  async getProfitLoss(startDate: string, endDate: string) {
    const revenue = await this.db.query.invoices.findMany({
      where: and(
        eq(invoices.status, 'PAID'),
        gte(invoices.paidDate, startDate),
        lte(invoices.paidDate, endDate),
      ),
    });
    const totalRevenue = revenue.reduce((s, i) => s + parseFloat(i.total || '0'), 0);

    const expensesData = await this.db.query.expenses.findMany({
      where: and(
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate),
      ),
    });
    const totalExpenses = expensesData.reduce((s, e) => s + parseFloat(e.amount || '0'), 0);

    return {
      period: { startDate, endDate },
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      revenueCount: revenue.length,
      expenseCount: expensesData.length,
    };
  }

  async getPpnReport(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const paidInvoices = await this.db.query.invoices.findMany({
      where: and(
        eq(invoices.status, 'PAID'),
        gte(invoices.paidDate, startDate),
        lte(invoices.paidDate, endDate),
      ),
    });

    const totalPpn = paidInvoices.reduce((s, i) => s + parseFloat(i.ppn || '0'), 0);
    const totalDpp = paidInvoices.reduce((s, i) => {
      const ppn = parseFloat(i.ppn || '0');
      const total = parseFloat(i.total || '0');
      return s + (total - ppn);
    }, 0);

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      totalInvoices: paidInvoices.length,
      totalDpp,
      totalPpn,
      ppnRate: paidInvoices.length > 0 ? paidInvoices[0].ppnRate : '11.00',
    };
  }

  async getDashboard() {
    // Last 12 months
    const now = new Date();
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      const label = `${year}-${String(month).padStart(2, '0')}`;

      const monthRevenue = await this.db.query.invoices.findMany({
        where: and(
          eq(invoices.status, 'PAID'),
          gte(invoices.paidDate, startDate),
          lte(invoices.paidDate, endDate),
        ),
      });
      const revenue = monthRevenue.reduce((s, i) => s + parseFloat(i.total || '0'), 0);

      const monthExpenses = await this.db.query.expenses.findMany({
        where: and(
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, endDate),
        ),
      });
      const expense = monthExpenses.reduce((s, e) => s + parseFloat(e.amount || '0'), 0);

      monthlyData.push({ label, revenue, expense, profit: revenue - expense });
    }

    return { monthly: monthlyData };
  }
}
```

- [ ] **Create ReportController**

```typescript
// report.controller.ts
import { Controller, Get, Query, Param } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('finance')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('reports/profit-loss')
  async profitLoss(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getProfitLoss(startDate, endDate);
  }

  @Get('reports/tax/ppn')
  async ppnReport(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.reportService.getPpnReport(year, month);
  }

  @Get('dashboard')
  async dashboard() {
    return this.reportService.getDashboard();
  }
}
```

### Task 10: Create SettingsService + Controller

**Files:**
- Create: `mipsys-backend/src/finance/settings.service.ts`
- Create: `mipsys-backend/src/finance/settings.controller.ts`
- Create: `mipsys-backend/src/finance/dto/update-settings.dto.ts`

- [ ] **Create UpdateSettingsDto**

```typescript
// dto/update-settings.dto.ts
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePpnRateDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  ppnRate!: number;
}

export class UpdateInvoicePrefixDto {
  @IsString()
  invoicePrefix!: string;
}
```

- [ ] **Create SettingsService**

```typescript
// settings.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { financeSettings } from '../database/schema';

@Injectable()
export class SettingsService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
  ) {}

  async getAll() {
    const settings = await this.db.query.financeSettings.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async get(key: string) {
    const setting = await this.db.query.financeSettings.findFirst({
      where: eq(financeSettings.key, key),
    });
    if (!setting) return null;
    return { key: setting.key, value: setting.value };
  }

  async set(key: string, value: string) {
    await this.db
      .insert(financeSettings)
      .values({ key, value })
      .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
    return { success: true, key, value };
  }

  async updatePpnRate(rate: number) {
    return this.set('ppn_rate', rate.toString());
  }

  async updateInvoicePrefix(prefix: string) {
    return this.set('invoice_prefix', prefix);
  }
}
```

- [ ] **Create SettingsController**

```typescript
// settings.controller.ts
import { Controller, Get, Patch, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdatePpnRateDto, UpdateInvoicePrefixDto } from './dto/update-settings.dto';

@Controller('finance/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAll() {
    return this.settingsService.getAll();
  }

  @Patch('ppn-rate')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updatePpnRate(@Body() dto: UpdatePpnRateDto) {
    return this.settingsService.updatePpnRate(dto.ppnRate);
  }

  @Patch('invoice-prefix')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateInvoicePrefix(@Body() dto: UpdateInvoicePrefixDto) {
    return this.settingsService.updateInvoicePrefix(dto.invoicePrefix);
  }
}
```

### Task 11: Update FinanceModule

**Files:**
- Modify: `mipsys-backend/src/finance/finance.module.ts`

- [ ] **Register all new services and controllers**

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OrderPartsModule } from '../order-parts/order-parts.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { ExportService } from './export.service';

@Module({
  imports: [DatabaseModule, OrderPartsModule],
  controllers: [
    FinanceController,
    ExpenseController,
    ReportController,
    SettingsController,
  ],
  providers: [
    FinanceService,
    ExpenseService,
    ReportService,
    SettingsService,
    ExportService,
  ],
  exports: [FinanceService],
})
export class FinanceModule {}
```

### Task 12: Enhance Frontend Types & API

**Files:**
- Modify: `mipsys-frontend-v2/src/features/finance/types/index.ts`
- Modify: `mipsys-frontend-v2/src/features/finance/api/finance-api.ts`

- [ ] **Add new types**

```typescript
// types/index.ts — add:
export interface PaymentHistory {
  id: number;
  invoiceId: number;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'QRIS';
  paidAt: string;
  referenceNumber?: string;
  notes?: string;
}

export interface Expense {
  id: number;
  expenseNumber: string;
  expenseType: 'PO' | 'OPERATIONAL';
  poId?: number;
  description: string;
  amount: number;
  expenseDate: string;
  category: 'UTILITY' | 'RENT' | 'SALARY' | 'TRANSPORT' | 'OTHER';
  createdBy?: number;
  createdAt: string;
}

export interface ProfitLoss {
  period: { startDate: string; endDate: string };
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueCount: number;
  expenseCount: number;
}

export interface PpnReport {
  period: string;
  totalInvoices: number;
  totalDpp: number;
  totalPpn: number;
  ppnRate: string;
}

export interface DashboardData {
  monthly: Array<{ label: string; revenue: number; expense: number; profit: number }>;
}
```

- [ ] **Add API methods**

```typescript
// api/finance-api.ts — add:
import { PaymentHistory, Expense, ProfitLoss, PpnReport, DashboardData } from '../types';

export const financeApi = {
  // ... existing methods ...

  // Payment
  recordPayment: async (id: number, data: { amount: number; paymentMethod: string; referenceNumber?: string; notes?: string }) => {
    const response = await apiClient.post(`/finance/invoices/${id}/pay`, data);
    return response.data;
  },

  // Void
  voidInvoice: async (id: number) => {
    const response = await apiClient.patch(`/finance/invoices/${id}/void`);
    return response.data;
  },

  // Expenses
  getExpenses: async (params?: { type?: string; category?: string; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/finance/expenses', { params });
    return response.data;
  },
  createExpense: async (data: { description: string; amount: number; expenseDate: string; category?: string }) => {
    const response = await apiClient.post('/finance/expenses', data);
    return response.data;
  },
  updateExpense: async (id: number, data: Partial<{ description: string; amount: number; expenseDate: string; category: string }>) => {
    const response = await apiClient.patch(`/finance/expenses/${id}`, data);
    return response.data;
  },
  deleteExpense: async (id: number) => {
    const response = await apiClient.delete(`/finance/expenses/${id}`);
    return response.data;
  },
  syncPoExpenses: async (poId?: number) => {
    const response = await apiClient.post('/finance/expenses/sync-po', null, { params: { poId } });
    return response.data;
  },

  // Reports
  getProfitLoss: async (startDate: string, endDate: string) => {
    const response = await apiClient.get('/finance/reports/profit-loss', { params: { startDate, endDate } });
    return response.data;
  },
  getPpnReport: async (year: number, month: number) => {
    const response = await apiClient.get('/finance/reports/tax/ppn', { params: { year, month } });
    return response.data;
  },
  getDashboard: async () => {
    const response = await apiClient.get('/finance/dashboard');
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await apiClient.get('/finance/settings');
    return response.data;
  },
  updatePpnRate: async (ppnRate: number) => {
    const response = await apiClient.patch('/finance/settings/ppn-rate', { ppnRate });
    return response.data;
  },
  updateInvoicePrefix: async (invoicePrefix: string) => {
    const response = await apiClient.patch('/finance/settings/invoice-prefix', { invoicePrefix });
    return response.data;
  },

  // Export
  exportInvoicePdf: async (id: number) => {
    const response = await apiClient.get(`/finance/invoices/${id}/export/pdf`, { responseType: 'blob' });
    return response.data;
  },
  exportInvoiceXlsx: async (id: number) => {
    const response = await apiClient.get(`/finance/invoices/${id}/export/xlsx`, { responseType: 'blob' });
    return response.data;
  },
};
```

### Task 13: Enhance Frontend Finance Page

**Files:**
- Modify: `mipsys-frontend-v2/src/features/finance/page.tsx`
- Modify: `mipsys-frontend-v2/src/features/finance/components/InvoiceTableRow.tsx`
- Create: `mipsys-frontend-v2/src/features/finance/components/InvoiceDetailModal.tsx`
- Create: `mipsys-frontend-v2/src/features/finance/components/PaymentForm.tsx`

- [ ] **Create InvoiceDetailModal component**

```tsx
'use client';
import React from 'react';
import { X } from 'lucide-react';
import { Invoice, PaymentHistory } from '../types';

interface Props {
  invoice: Invoice & { payments?: PaymentHistory[] };
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, onClose }: Props) {
  const totalPaid = (invoice.payments || []).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-lg">{invoice.invoiceNumber}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="font-bold">Tiket:</span> {invoice.ticketNumber}</p>
          <p><span className="font-bold">Klien:</span> {invoice.clientName}</p>
          <p><span className="font-bold">Status:</span> {invoice.status}</p>
          <p><span className="font-bold">Total:</span> Rp {parseFloat(invoice.total || '0').toLocaleString('id-ID')}</p>
          <p><span className="font-bold">PPN:</span> Rp {parseFloat(invoice.ppn || '0').toLocaleString('id-ID')} ({invoice.ppnRate}%)</p>
          <p><span className="font-bold">Tanggal:</span> {invoice.invoiceDate}</p>
          {invoice.paidDate && <p><span className="font-bold">Lunas:</span> {invoice.paidDate}</p>}
        </div>
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-4">
            <h4 className="font-bold text-sm mb-2">Riwayat Pembayaran</h4>
            <div className="space-y-1">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex justify-between text-xs bg-slate-50 p-2 rounded">
                  <span>{p.paymentMethod} {p.referenceNumber && `(${p.referenceNumber})`}</span>
                  <span className="font-bold">Rp {p.amount.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Create PaymentForm component**

```tsx
'use client';
import React, { useState } from 'react';
import { financeApi } from '../api/finance-api';
import { toast } from 'react-hot-toast';

interface Props {
  invoiceId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({ invoiceId, onSuccess, onCancel }: Props) {
  const [method, setMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS'>('CASH');
  const [amount, setAmount] = useState('');
  const [ref, setRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await financeApi.recordPayment(invoiceId, { amount: parseFloat(amount), paymentMethod: method, referenceNumber: ref || undefined });
      toast.success('Pembayaran berhasil dicatat');
      onSuccess();
    } catch (err) {
      toast.error('Gagal mencatat pembayaran');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-bold">Metode Pembayaran</label>
        <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="w-full p-2 border rounded-xl text-sm">
          <option value="CASH">Cash</option>
          <option value="TRANSFER">Transfer</option>
          <option value="QRIS">QRIS</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-bold">Jumlah</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded-xl text-sm" required />
      </div>
      <div>
        <label className="text-xs font-bold">No. Referensi (opsional)</label>
        <input type="text" value={ref} onChange={(e) => setRef(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-emerald-700">
          {submitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-xl text-sm">Batal</button>
      </div>
    </form>
  );
}
```

- [ ] **Enhance InvoiceTableRow with void button**

Add after the paid/unpaid button:

```tsx
{invoice.status === 'UNPAID' && (
  <button
    onClick={() => { if (confirm('Void invoice ini?')) onVoid?.(); }}
    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
    title="Void Invoice"
  >
    <Ban size={16} />
  </button>
)}
```

Add `onVoid` to the component props.

- [ ] **Enhance FinancePage with detail modal + payment flow**

Add state for selected invoice and modals. Import `InvoiceDetailModal` and `PaymentForm`. Modify the InvoiceTableRow to pass `onView` callback.

### Task 14: Create Expenses Frontend

**Files:**
- Create: `mipsys-frontend-v2/src/features/finance/hooks/useExpenses.ts`
- Create: `mipsys-frontend-v2/src/features/finance/components/ExpenseForm.tsx`
- Create: `mipsys-frontend-v2/src/features/finance/components/ExpenseTable.tsx`
- Create: `mipsys-frontend-v2/src/features/finance/expenses/page.tsx`
- Create: `mipsys-frontend-v2/src/app/finance/expenses/page.tsx`

- [ ] **Create useExpenses hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { financeApi, Expense } from '../api/finance-api';
import { toast } from 'react-hot-toast';

export const useExpenses = (filters?: { type?: string; category?: string }) => {
  const [data, setData] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await financeApi.getExpenses(filters);
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error('Gagal memuat data expense');
    } finally {
      setIsLoading(false);
    }
  }, [filters?.type, filters?.category]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { data, isLoading, refetch: fetchAll };
};
```

- [ ] **Create ExpenseForm, ExpenseTable, ExpensesPage**

Follow existing patterns from `InvoiceTableRow.tsx` and `page.tsx`. Use the same styling (DESIGN.md): dark blueprint theme.

### Task 15: Create Reports + Settings Frontend

**Files:**
- Create: `mipsys-frontend-v2/src/features/finance/reports/ProfitLossChart.tsx`
- Create: `mipsys-frontend-v2/src/features/finance/reports/PpnReport.tsx`
- Create: `mipsys-frontend-v2/src/features/finance/reports/ExportButton.tsx`
- Create: `mipsys-frontend-v2/src/features/finance/components/SettingsForm.tsx`
- Create: `mipsys-frontend-v2/src/app/finance/reports/page.tsx`
- Create: `mipsys-frontend-v2/src/app/finance/settings/page.tsx`

- [ ] **Create ProfitLossChart with recharts**

Install recharts first:

```bash
cd mipsys-frontend-v2 && npm install recharts
```

```tsx
'use client';
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { financeApi, DashboardData } from '../api/finance-api';

export function ProfitLossChart() {
  const [data, setData] = useState<DashboardData['monthly']>([]);

  useEffect(() => {
    financeApi.getDashboard().then((res) => setData(res.monthly || []));
  }, []);

  return (
    <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 shadow-sm">
      <h3 className="font-black text-sm mb-4">Revenue vs Expense (12 Bulan)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="revenue" fill="#059669" name="Pendapatan" />
          <Bar dataKey="expense" fill="#dc2626" name="Pengeluaran" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Create PpnReport, SettingsForm, route pages**

Follow existing patterns from the codebase. SettingsForm shows current PPN rate + invoice prefix with inline editing.

### Task 16: Add Export (PDF/XLSX)

**Files:**
- Create: `mipsys-backend/src/finance/export.service.ts`
- Modify: `mipsys-backend/src/finance/finance.controller.ts`
- Modify: `mipsys-backend/src/finance/finance.module.ts`

- [ ] **Install pdfkit**

```bash
cd mipsys-backend && npm install pdfkit @types/pdfkit
```

- [ ] **Create ExportService**

```typescript
// export.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { invoices } from '../database/schema';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ExportService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
  ) {}

  async exportXlsx(id: number): Promise<Buffer> {
    const invoice = await this.db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });
    if (!invoice) throw new Error('Invoice not found');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Invoice');

    sheet.columns = [
      { header: 'Field', key: 'field', width: 20 },
      { header: 'Value', key: 'value', width: 30 },
    ];

    sheet.addRows([
      { field: 'No. Invoice', value: invoice.invoiceNumber },
      { field: 'Tiket', value: invoice.ticketNumber },
      { field: 'Klien', value: invoice.clientName },
      { field: 'Service Fee', value: invoice.serviceFee },
      { field: 'Part Fee', value: invoice.partFee },
      { field: 'Shipping Fee', value: invoice.shippingFee },
      { field: 'PPN', value: invoice.ppn },
      { field: 'Total', value: invoice.total },
      { field: 'Status', value: invoice.status },
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportPdf(id: number): Promise<Buffer> {
    const invoice = await this.db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });
    if (!invoice) throw new Error('Invoice not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`No: ${invoice.invoiceNumber}`);
      doc.text(`Tanggal: ${invoice.invoiceDate}`);
      doc.text(`Klien: ${invoice.clientName}`);
      doc.text(`Tiket: ${invoice.ticketNumber}`);
      doc.moveDown(2);

      doc.fontSize(12).font('Helvetica-Bold').text('Rincian Biaya');
      doc.moveDown();
      const formatAmount = (v: string | null) => `Rp ${parseFloat(v || '0').toLocaleString('id-ID')}`;
      doc.fontSize(10).font('Helvetica').text(`Service Fee    : ${formatAmount(invoice.serviceFee)}`);
      doc.text(`Part Fee      : ${formatAmount(invoice.partFee)}`);
      doc.text(`Shipping Fee  : ${formatAmount(invoice.shippingFee)}`);
      doc.text(`PPN (${invoice.ppnRate}%)  : ${formatAmount(invoice.ppn)}`);
      doc.moveDown();
      doc.font('Helvetica-Bold').fontSize(14).text(`Total         : ${formatAmount(invoice.total)}`);
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica').text(`Status: ${invoice.status}`);

      doc.end();
    });
  }
}
```

- [ ] **Add export controller endpoints and register in module**

```typescript
// In finance.controller.ts — add imports:
import { Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

// Inject ExportService in constructor:
// constructor(
//   private readonly financeService: FinanceService,
//   private readonly exportService: ExportService,
// ) {}

// Add endpoints:
@Get('invoices/:id/export/xlsx')
async exportXlsx(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
  const buffer = await this.exportService.exportXlsx(id);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.xlsx`);
  res.send(buffer);
}

@Get('invoices/:id/export/pdf')
async exportPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
  const buffer = await this.exportService.exportPdf(id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
  res.send(buffer);
}
```

### Task 17: Integration Testing

**Files:**
- Tests covering core flows

- [ ] **Test: Generate invoice from SR → Pay → Stats update**

```bash
# Create SR first, then:
curl -X POST http://localhost:3000/finance/invoices/from-sr/TKT-001
curl -X POST http://localhost:3000/finance/invoices/1/pay -H 'Content-Type: application/json' -d '{"amount": 100000, "paymentMethod": "CASH"}'
curl http://localhost:3000/finance/stats
# Verify totalRevenue > 0, paidCount > 0
```

- [ ] **Test: PO Received → Expense auto-created**

```bash
# Update PO status to RECEIVED first
curl -X POST http://localhost:3000/finance/expenses/sync-po
curl http://localhost:3000/finance/expenses
# Verify at least 1 PO-type expense
```

- [ ] **Test: Double-payment prevention**

```bash
# Pay same invoice twice
curl -X POST http://localhost:3000/finance/invoices/1/pay -H 'Content-Type: application/json' -d '{"amount": 100000, "paymentMethod": "CASH"}'
# Should return 400 BadRequest "Already paid"
```

- [ ] **Run lint + type-check**

```bash
cd mipsys-backend && npm run lint && npm run build
cd mipsys-frontend-v2 && npm run lint && npm run build
```
