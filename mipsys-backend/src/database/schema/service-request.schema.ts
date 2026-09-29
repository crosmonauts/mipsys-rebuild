import {
  pgTable,
  varchar,
  text,
  date,
  numeric,
  integer,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { staffRoleEnum, serviceTypeEnum, serviceStatusEnum } from './enums';

export const staff = pgTable('staff', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  role: staffRoleEnum('role').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => sql`now()`),
  createdBy: integer('created_by'),
  updatedBy: integer('updated_by'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: integer('deleted_by'),
});

export const customers = pgTable('customers', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  customerType: varchar('customer_type', { length: 50 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => sql`now()`),
  createdBy: integer('created_by').references(() => staff.id),
  updatedBy: integer('updated_by').references(() => staff.id),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: integer('deleted_by').references(() => staff.id),
});

export const serviceRequests = pgTable(
  'service_requests',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    ticketNumber: varchar('ticket_number', { length: 100 }).unique().notNull(),
    rmaNo: varchar('rma_no', { length: 100 }),
    incNo: varchar('inc_no', { length: 100 }),
    serviceType: serviceTypeEnum('service_type').notNull(),
    customerId: integer('customer_id').references(() => customers.id),
    modelName: varchar('model_name', { length: 100 }).notNull(),
    serialNumber: varchar('serial_number', { length: 100 }).notNull(),
    adminId: integer('admin_id').references(() => staff.id),
    technicianCheckId: integer('tech_check_id').references(() => staff.id),
    incomingDate: date('incoming_date').notNull(),
    checkDate: date('check_date'),
    spDate: date('sp_date'),
    approveDate: date('approve_date'),
    readyDate: date('ready_date'),
    closeDate: date('close_date'),
    pickUpDate: date('pick_up_date'),
    problemDescription: text('problem_description'),
    statusService: serviceStatusEnum('status_service').default('WAITING_CHECK'),
    // status_system: marker sistem terpisah dari alur layanan.
    // Nilai 'CLOSED' menandai SR ditutup (dibaca frontend & stats.service).
    statusSystem: varchar('status_system', { length: 50 }),
    remarksHistory: text('remarks_history'),
    serviceFee: numeric('service_fee', {
      precision: 12,
      scale: 2,
      mode: 'number',
    }).default(0),
    partFee: numeric('part_fee', { precision: 12, scale: 2, mode: 'number' }).default(0),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => sql`now()`),
    createdBy: integer('created_by').references(() => staff.id),
    updatedBy: integer('updated_by').references(() => staff.id),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
    deletedBy: integer('deleted_by').references(() => staff.id),
    version: integer('version').default(1).notNull(),
  },
  (table) => ({
    ticketIdx: index('ticket_idx').on(table.ticketNumber),
    rmaIdx: index('rma_idx').on(table.rmaNo),
    customerIdx: index('sr_customer_idx').on(table.customerId),
    modelIdx: index('sr_model_idx').on(table.modelName),
    serialIdx: index('sr_serial_idx').on(table.serialNumber),
    adminIdx: index('sr_admin_idx').on(table.adminId),
    techCheckIdx: index('sr_tech_check_idx').on(table.technicianCheckId),
    statusIdx: index('sr_status_idx').on(table.statusService),
    incomingDateIdx: index('sr_incoming_date_idx').on(table.incomingDate),
    checkDateOrder: check(
      'chk_sr_check_date',
      sql`${table.checkDate} IS NULL OR ${table.checkDate} >= ${table.incomingDate}`
    ),
  })
);

export const serviceLogs = pgTable(
  'service_logs',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    serviceRequestId: integer('service_request_id').references(
      () => serviceRequests.id
    ),
    action: varchar('action', { length: 100 }).notNull(),
    description: text('description'),
    performedBy: integer('performed_by').references(() => staff.id),
    correlationId: varchar('correlation_id', { length: 100 }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    serviceRequestIdx: index('sl_sr_idx').on(table.serviceRequestId),
    createdIdx: index('sl_created_idx').on(table.createdAt),
    srCreatedIdx: index('sl_sr_created_idx').on(
      table.serviceRequestId,
      table.createdAt,
    ),
  })
);
