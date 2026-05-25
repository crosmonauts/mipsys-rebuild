import {
  mysqlTable, varchar, decimal, int, timestamp, date, mysqlEnum, text, index,
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
    category: mysqlEnum('category', ['UTILITY', 'RENT', 'SALARY', 'TRANSPORT', 'OTHER']).default('OTHER'),
    createdBy: int('created_by').references(() => staff.id),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    expenseTypeIdx: index('exp_type_idx').on(table.expenseType),
    poIdx: index('exp_po_idx').on(table.poId),
    dateIdx: index('exp_date_idx').on(table.expenseDate),
  })
);
