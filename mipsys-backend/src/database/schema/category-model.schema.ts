import {
  mysqlTable,
  varchar,
  int,
  timestamp,
} from 'drizzle-orm/mysql-core';

export const categoryModels = mysqlTable('category_models', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
