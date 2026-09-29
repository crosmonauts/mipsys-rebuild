import {
  pgTable,
  varchar,
  numeric,
  integer,
  timestamp,
  text,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { invoices } from './invoice.schema';
import { staff } from './service-request.schema';
import { paymentMethodEnum } from './enums';

export const paymentHistories = pgTable(
  'payment_histories',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => invoices.id),
    amount: numeric('amount', {
      precision: 14,
      scale: 2,
      mode: 'number',
    }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paidAt: timestamp('paid_at', { mode: 'date' }).defaultNow().notNull(),
    referenceNumber: varchar('reference_number', { length: 100 }),
    notes: text('notes'),
    performedBy: integer('performed_by').references(() => staff.id),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  },
  (table) => ({
    invoiceIdx: index('ph_invoice_idx').on(table.invoiceId),
    invPaidIdx: index('ph_inv_paid_idx').on(table.invoiceId, table.paidAt),
    amountNonNeg: check('chk_ph_amount_nonneg', sql`${table.amount} >= 0`),
  })
);
