import {
  pgTable,
  varchar,
  numeric,
  integer,
  timestamp,
  date,
  text,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { staff } from './service-request.schema';
import { purchaseOrders } from './purchase-order.schema';
import { expenseTypeEnum, expenseCategoryEnum } from './enums';

export const expenses = pgTable(
  'expenses',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    expenseNumber: varchar('expense_number', { length: 100 })
      .unique()
      .notNull(),
    expenseType: expenseTypeEnum('expense_type').notNull(),
    poId: integer('po_id').references(() => purchaseOrders.id),
    description: text('description').notNull(),
    amount: numeric('amount', {
      precision: 14,
      scale: 2,
      mode: 'number',
    }).notNull(),
    expenseDate: date('expense_date').notNull(),
    category: expenseCategoryEnum('category').default('OTHER'),
    createdBy: integer('created_by').references(() => staff.id),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => sql`now()`),
    updatedBy: integer('updated_by').references(() => staff.id),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
    deletedBy: integer('deleted_by').references(() => staff.id),
  },
  (table) => ({
    expenseTypeIdx: index('exp_type_idx').on(table.expenseType),
    poIdx: index('exp_po_idx').on(table.poId),
    dateIdx: index('exp_date_idx').on(table.expenseDate),
    categoryIdx: index('exp_category_idx').on(table.category),
    dateTypeIdx: index('exp_date_type_idx').on(table.expenseDate, table.expenseType),
    amountPositive: check('chk_exp_amount_positive', sql`${table.amount} > 0`),
  })
);
