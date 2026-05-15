import {
  mysqlTable,
  varchar,
  decimal,
  int,
  timestamp,
  mysqlEnum,
  date,
  text,
  index,
} from 'drizzle-orm/mysql-core';
import { serviceRequests } from './service-request.schema';

export const invoices = mysqlTable(
  'invoices',
  {
    id: int('id').autoincrement().primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 100 }).unique().notNull(),
    ticketNumber: varchar('ticket_number', { length: 100 }).notNull(),
    serviceRequestId: int('service_request_id').references(() => serviceRequests.id),
    clientName: varchar('client_name', { length: 255 }).notNull(),
    serviceFee: decimal('service_fee', { precision: 12, scale: 2 }).default('0.00'),
    partFee: decimal('part_fee', { precision: 12, scale: 2 }).default('0.00'),
    shippingFee: decimal('shipping_fee', { precision: 12, scale: 2 }).default('0.00'),
    ppn: decimal('ppn', { precision: 12, scale: 2 }).default('0.00'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
    status: mysqlEnum('status', ['PAID', 'UNPAID', 'OVERDUE']).default('UNPAID'),
    paymentMethod: varchar('payment_method', { length: 50 }),
    invoiceDate: date('invoice_date').notNull(),
    paidDate: date('paid_date'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    ticketIdx: index('inv_ticket_idx').on(table.ticketNumber),
    statusIdx: index('inv_status_idx').on(table.status),
  })
);
