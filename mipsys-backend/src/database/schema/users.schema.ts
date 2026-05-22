import {
  mysqlTable,
  int,
  varchar,
  mysqlEnum,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core';
import { staff } from './service-request.schema';

export const users = mysqlTable(
  'users',
  {
    id: int('id').autoincrement().primaryKey(),
    staffId: int('staff_id').references(() => staff.id),
    username: varchar('username', { length: 50 }).unique().notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: mysqlEnum('role', ['ADMIN', 'TECHNICIAN']).notNull(),
    refreshToken: varchar('refresh_token', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: index('username_idx').on(table.username),
  }),
);
