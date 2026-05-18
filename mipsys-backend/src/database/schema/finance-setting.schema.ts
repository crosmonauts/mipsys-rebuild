import { mysqlTable, varchar, int, timestamp } from 'drizzle-orm/mysql-core';

export const financeSettings = mysqlTable('finance_settings', {
  id: int('id').autoincrement().primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
