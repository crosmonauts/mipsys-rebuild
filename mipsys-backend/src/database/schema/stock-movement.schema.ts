import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';
import { spareParts } from './spare-part.schema';
import { staff } from './service-request.schema';

export const stockMovements = mysqlTable(
  'stock_movements',
  {
    id: int('id').autoincrement().primaryKey(),
    sparePartId: int('spare_part_id')
      .notNull()
      .references(() => spareParts.id),
    quantity: int('quantity').notNull(),
    movementType: mysqlEnum('movement_type', [
      'PO_RECEIVE',
      'SERVICE_USE',
      'ADJUSTMENT',
      'SERVICE_RETURN',
    ]).notNull(),
    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: varchar('reference_id', { length: 100 }),
    performedBy: int('performed_by').references(() => staff.id),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    sparePartIdx: index('sm_sp_idx').on(table.sparePartId),
    movementTypeIdx: index('sm_type_idx').on(table.movementType),
  })
);
