import {
  pgTable,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { serviceRequests, staff } from './service-request.schema';
import { orderPartStatusEnum } from './enums';
import { categoryModels } from './category-model.schema';

export const spareParts = pgTable(
  'spare_parts',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    partCode: varchar('part_code', { length: 100 }).unique(),
    modelName: varchar('model_name', { length: 255 }),
    block: varchar('block', { length: 100 }),
    refNo: varchar('ref_no', { length: 50 }),
    partName: varchar('part_name', { length: 255 }).notNull(),
    standard: varchar('standard', { length: 255 }),
    type: varchar('type', { length: 100 }),
    stock: integer('stock').default(0).notNull(),
    minStock: integer('min_stock').default(5).notNull(),
    location: varchar('location', { length: 100 }),
    price: numeric('price', { precision: 12, scale: 2, mode: 'number' }).default(0),
    note: text('note'),
    ipStatus: varchar('ip_status', { length: 50 }),
    categoryModelId: integer('category_model_id').references(
      () => categoryModels.id
    ),
    isUniversal: boolean('is_universal').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => sql`now()`),
    createdBy: integer('created_by').references(() => staff.id),
    updatedBy: integer('updated_by').references(() => staff.id),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
    deletedBy: integer('deleted_by').references(() => staff.id),
  },
  (table) => ({
    stockNonNeg: check('chk_stock_nonneg', sql`${table.stock} >= 0`),
    minStockNonNeg: check('chk_minstock_nonneg', sql`${table.minStock} >= 0`),
    priceNonNeg: check('chk_price_nonneg', sql`${table.price} >= 0`),
    categoryIdx: index('sp_category_idx').on(table.categoryModelId),
    stockMinIdx: index('sp_stock_min_idx').on(table.stock, table.minStock),
  })
);

export const orderParts = pgTable(
  'order_parts',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    serviceRequestId: integer('service_request_id').references(
      () => serviceRequests.id
    ),
    sparePartId: integer('spare_part_id').references(() => spareParts.id),
    partName: varchar('part_name', { length: 255 }).notNull(),
    quantity: integer('quantity').default(1).notNull(),
    priceAtAction: numeric('price_at_action', {
      precision: 12,
      scale: 2,
      mode: 'number',
    }).default(0),
    status: orderPartStatusEnum('status').default('IN_STOCK'),
    // Substitusi: part model lain yang dipasang dengan persetujuan admin.
    // Melewati validasi kompatibilitas, tetapi wajib beralasan dan tercatat.
    isSubstitute: boolean('is_substitute').default(false).notNull(),
    substituteReason: text('substitute_reason'),
    substituteApprovedBy: integer('substitute_approved_by').references(
      () => staff.id,
    ),
    substituteApprovedAt: timestamp('substitute_approved_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => sql`now()`),
    createdBy: integer('created_by').references(() => staff.id),
    updatedBy: integer('updated_by').references(() => staff.id),
  },
  (table) => ({
    serviceRequestIdx: index('op_sr_idx').on(table.serviceRequestId),
    sparePartIdx: index('op_sp_idx').on(table.sparePartId),
    srStatusIdx: index('op_sr_status_idx').on(
      table.serviceRequestId,
      table.status,
    ),
    substituteIdx: index('op_substitute_idx').on(table.isSubstitute),
    qtyPositive: check('chk_op_qty_positive', sql`${table.quantity} > 0`),
    priceNonNeg: check('chk_op_price_nonneg', sql`${table.priceAtAction} >= 0`),
  })
);
