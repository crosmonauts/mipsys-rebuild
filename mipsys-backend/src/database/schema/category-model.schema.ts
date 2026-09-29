import { pgTable, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { staff } from './service-request.schema';

export const categoryModels = pgTable('category_models', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => sql`now()`),
  createdBy: integer('created_by').references(() => staff.id),
  updatedBy: integer('updated_by').references(() => staff.id),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: integer('deleted_by').references(() => staff.id),
});
