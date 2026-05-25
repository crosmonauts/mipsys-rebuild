import {
  mysqlTable, varchar, decimal, int, timestamp, mysqlEnum, text, index,
} from 'drizzle-orm/mysql-core';
import { invoices } from './invoice.schema';

export const paymentHistories = mysqlTable(
  'payment_histories',
  {
    id: int('id').autoincrement().primaryKey(),
    invoiceId: int('invoice_id').notNull().references(() => invoices.id),
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
