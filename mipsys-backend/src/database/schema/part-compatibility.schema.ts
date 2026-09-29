import {
  pgTable,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { spareParts } from './spare-part.schema';
import { categoryModels } from './category-model.schema';
import { staff } from './service-request.schema';

export const partModelCompatibilities = pgTable(
  'part_model_compatibilities',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    sparePartId: integer('spare_part_id')
      .notNull()
      .references(() => spareParts.id),
    categoryModelId: integer('category_model_id')
      .notNull()
      .references(() => categoryModels.id),
    createdBy: integer('created_by').references(() => staff.id),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  },
  (table) => ({
    spareIdx: index('pmc_spare_idx').on(table.sparePartId),
    modelIdx: index('pmc_model_idx').on(table.categoryModelId),
    spareModelUnique: uniqueIndex('pmc_spare_model_unique').on(
      table.sparePartId,
      table.categoryModelId
    ),
  })
);
