import {
  mysqlTable,
  varchar,
  decimal,
  int,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core';
import { purchaseOrders } from './purchase-order.schema';
import { spareParts } from './spare-part.schema';

export const poItems = mysqlTable(
  'po_items',
  {
    id: int('id').autoincrement().primaryKey(),
    purchaseOrderId: int('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id),
    sparePartId: int('spare_part_id')
      .references(() => spareParts.id),
    partName: varchar('part_name', { length: 200 }),
    modelName: varchar('model_name', { length: 255 }),
    quantity: int('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
    receivedQty: int('received_qty').default(0),
    subtotal: decimal('subtotal', { precision: 14, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    poIdx: index('po_items_po_idx').on(table.purchaseOrderId),
    spIdx: index('po_items_sp_idx').on(table.sparePartId),
  })
);
