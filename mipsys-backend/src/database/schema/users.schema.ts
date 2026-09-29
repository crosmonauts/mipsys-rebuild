import {
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { staff } from './service-request.schema';
import { userRoleEnum } from './enums';

export const users = pgTable(
  'users',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    staffId: integer('staff_id').references(() => staff.id),
    username: varchar('username', { length: 50 }).unique().notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull(),
    refreshToken: text('refresh_token'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => sql`now()`),
    lastLoginAt: timestamp('last_login_at', { mode: 'date' }),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => ({
    usernameIdx: index('username_idx').on(table.username),
    // 1 staff = maksimal 1 akun login (kolom staff_id opsional)
    staffUnique: uniqueIndex('users_staff_unique')
      .on(table.staffId)
      .where(sql`${table.staffId} IS NOT NULL`),
  })
);
