import {
  mysqlTable,
  varchar,
  text,
  decimal,
  int,
  timestamp,
  datetime,
  date,
  index,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { staff } from './service-request.schema';

export const purchaseOrders = mysqlTable(
  'purchase_orders',
  {
    id: int('id').autoincrement().primaryKey(),
    poNumber: varchar('po_number', { length: 100 }).unique().notNull(),
    supplierName: varchar('supplier_name', { length: 50 }).default('EPSON').notNull(),
    status: mysqlEnum('status', [
      'DRAFT',
      'REQUESTED',
      'APPROVED',
      'ORDERED',
      'SHIPPED',
      'PARTIALLY_RECEIVED',
      'RECEIVED',
      'CANCELLED',
    ]).default('DRAFT'),
    requestedBy: int('requested_by').references(() => staff.id),
    approvedBy: int('approved_by').references(() => staff.id),
    orderDate: date('order_date'),
    expectedDate: date('expected_date'),
    receivedDate: date('received_date'),
    totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).default('0.00'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    poNumberIdx: index('po_number_idx').on(table.poNumber),
    statusIdx: index('po_status_idx').on(table.status),
  })
);
