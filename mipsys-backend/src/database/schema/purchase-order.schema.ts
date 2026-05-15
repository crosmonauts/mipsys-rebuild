import {
  mysqlTable,
  varchar,
  text,
  decimal,
  int,
  timestamp,
  datetime,
  index,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { spareParts } from './spare-part.schema';

export const purchaseOrders = mysqlTable(
  'purchase_orders',
  {
    id: int('id').autoincrement().primaryKey(),
    sparePartId: int('spare_part_id').references(() => spareParts.id),
    partName: varchar('part_name', { length: 255 }).notNull(),
    quantity: int('quantity').default(1).notNull(),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).default(
      '0.00'
    ),
    status: mysqlEnum('status', [
      'REQUESTED',
      'ORDERED',
      'SHIPPED',
      'RECEIVED',
      'CANCELLED',
    ]).default('REQUESTED'),
    receivedQuantity: int('received_quantity').default(0),
    notes: text('notes'),
    orderedAt: datetime('ordered_at'),
    shippedAt: datetime('shipped_at'),
    receivedAt: datetime('received_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    statusIdx: index('po_status_idx').on(table.status),
    spIdx: index('po_sp_idx').on(table.sparePartId),
  })
);
