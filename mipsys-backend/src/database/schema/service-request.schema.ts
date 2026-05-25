import {
  mysqlTable,
  varchar,
  text,
  date,
  decimal,
  mysqlEnum,
  int,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core';

export const staff = mysqlTable('staff', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  role: mysqlEnum('role', ['ADMIN', 'TECHNICIAN']).notNull(),
});

export const customers = mysqlTable('customers', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  customerType: varchar('customer_type', { length: 50 }),
});

export const products = mysqlTable('products', {
  id: int('id').autoincrement().primaryKey(),
  modelName: varchar('model_name', { length: 100 }).notNull(),
  serialNumber: varchar('serial_number', { length: 100 }).unique().notNull(),
});

export const serviceRequests = mysqlTable(
  'service_requests',
  {
    id: int('id').autoincrement().primaryKey(),
    ticketNumber: varchar('ticket_number', { length: 100 }).unique().notNull(),
    rmaNo: varchar('rma_no', { length: 100 }),
    incNo: varchar('inc_no', { length: 100 }),
    serviceType: mysqlEnum('service_type', [
      'WARRANTY',
      'NON_WARRANTY',
    ]).notNull(),
    customerId: int('customer_id').references(() => customers.id),
    productId: int('product_id').references(() => products.id),
    adminId: int('admin_id').references(() => staff.id),
    technicianCheckId: int('tech_check_id').references(() => staff.id),
    incomingDate: date('incoming_date').notNull(),
    checkDate: date('check_date'),
    spDate: date('sp_date'),
    approveDate: date('approve_date'),
    readyDate: date('ready_date'),
    closeDate: date('close_date'),
    pickUpDate: date('pick_up_date'),
    agingDays: int('aging_days').default(0),
    problemDescription: text('problem_description'),
    statusService: mysqlEnum('status_service', [
      'WAITING_CHECK',
      'CHECK',
      'WAITING_APPROVE',
      'AWAITING_PARTS',
      'SERVICE',
      'DONE',
      'CANCEL',
    ]).default('WAITING_CHECK'),
    statusSystem: varchar('status_system', { length: 50 }),
    remarksHistory: text('remarks_history'),
    serviceFee: decimal('service_fee', { precision: 12, scale: 2 }).default(
      '0.00'
    ),
    partFee: decimal('part_fee', { precision: 12, scale: 2 }).default('0.00'),
    shippingFee: decimal('shipping_fee', { precision: 12, scale: 2 }).default(
      '0.00'
    ),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    ticketIdx: index('ticket_idx').on(table.ticketNumber),
    rmaIdx: index('rma_idx').on(table.rmaNo),
  })
);

export const serviceLogs = mysqlTable('service_logs', {
  id: int('id').autoincrement().primaryKey(),
  serviceRequestId: int('service_request_id').references(
    () => serviceRequests.id
  ),
  action: varchar('action', { length: 100 }).notNull(),
  description: text('description'),
  performedBy: int('performed_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
