import {
  mysqlTable,
  varchar,
  text,
  decimal,
  int,
  timestamp,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { serviceRequests } from './service-request.schema';

export const spareParts = mysqlTable('spare_parts', {
  id: int('id').primaryKey().autoincrement(),
  partCode: varchar('part_code', { length: 100 }).unique(),
  modelName: varchar('model_name', { length: 255 }),
  block: varchar('block', { length: 100 }),
  refNo: varchar('ref_no', { length: 50 }),
  partName: varchar('part_name', { length: 255 }).notNull(),
  standard: varchar('standard', { length: 255 }),
  type: varchar('type', { length: 100 }),
  stock: int('stock').default(0).notNull(),
  minStock: int('min_stock').default(5).notNull(),
  location: varchar('location', { length: 100 }),
  price: decimal('price', { precision: 12, scale: 2 }).default('0.00'),
  note: text('note'),
  ipStatus: varchar('ip_status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const orderParts = mysqlTable('order_parts', {
  id: int('id').autoincrement().primaryKey(),
  serviceRequestId: int('service_request_id').references(
    () => serviceRequests.id
  ),
  sparePartId: int('spare_part_id').references(() => spareParts.id),
  partName: varchar('part_name', { length: 255 }).notNull(),
  quantity: int('quantity').default(1).notNull(),
  priceAtAction: decimal('price_at_action', {
    precision: 12,
    scale: 2,
  }).default('0.00'),
  status: mysqlEnum('status', [
    'IN_STOCK',
    'OUT_OF_STOCK',
    'MANUAL_NEW',
    'CANCELLED',
    'PROPOSED',
  ]).default('IN_STOCK'),
  createdAt: timestamp('created_at').defaultNow(),
});
