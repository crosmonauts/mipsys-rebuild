import {
  mysqlTable,
  varchar,
  text,
  date,
  decimal,
  mysqlEnum,
  int,
  timestamp,
  datetime,
  index,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================================
// ENUMS — Exported agar dapat dipakai di service & DTO
// ============================================================

export const StatusService = {
  WAITING_CHECK: 'WAITING_CHECK', // Unit baru masuk, belum dicek
  CHECK: 'CHECK', // Teknisi sedang melakukan pengecekan
  WAITING_APPROVE: 'WAITING_APPROVE', // Menunggu persetujuan biaya/perbaikan
  SERVICE: 'SERVICE', // Sedang dalam proses service
  DONE: 'DONE', // Selesai, siap diambil
  CANCEL: 'CANCEL', // Dibatalkan
} as const;

export type StatusServiceType =
  (typeof StatusService)[keyof typeof StatusService];

export const PurchaseOrderStatus = {
  REQUESTED: 'REQUESTED',
  ORDERED: 'ORDERED',
  SHIPPED: 'SHIPPED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;

export type PurchaseOrderStatusType =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

// ============================================================
// TABLES
// ============================================================

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

    // FIX: Gunakan mysqlEnum agar DB menolak nilai yang tidak valid
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
    spDate: date('sp_date'), // Tanggal naik ke WAITING_APPROVE
    approveDate: date('approve_date'), // Tanggal mulai SERVICE
    readyDate: date('ready_date'), // Tanggal DONE
    closeDate: date('close_date'), // Tanggal DONE atau CANCEL
    pickUpDate: date('pick_up_date'),
    agingDays: int('aging_days').default(0),

    problemDescription: text('problem_description'),

    // FIX: statusService sebagai mysqlEnum, bukan varchar bebas
    statusService: mysqlEnum('status_service', [
      'WAITING_CHECK',
      'CHECK',
      'WAITING_APPROVE',
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

export const spareParts = mysqlTable('spare_parts', {
  id: int('id').primaryKey().autoincrement(),
  partCode: varchar('part_code', { length: 100 }).unique(),
  modelName: varchar('model_name', { length: 255 }),
  block: varchar('block', { length: 100 }),
  ref_no: varchar('ref_no', { length: 50 }),
  partName: varchar('part_name', { length: 255 }).notNull(),
  standard: varchar('standard', { length: 255 }),
  type: varchar('type', { length: 100 }),
  stock: int('stock').default(0).notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).default('0.00'),
  note: text('note'),
  ipStatus: varchar('ip_status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const orderParts = mysqlTable('order_parts', {
  id: int('id').autoincrement().primaryKey(),
  serviceRequestId: int('service_request_id').references(
    () => serviceRequests.id
  ),
  sparePartId: int('spare_part_id').references(() => spareParts.id),

  // Backup nama part — dipakai jika input manual atau part dihapus dari master
  partName: varchar('part_name', { length: 255 }).notNull(),
  quantity: int('quantity').default(1).notNull(),

  // Harga dikunci saat transaksi agar tidak berubah jika harga master diupdate
  priceAtAction: decimal('price_at_action', {
    precision: 12,
    scale: 2,
  }).default('0.00'),

  // Status ketersediaan saat dicatat
  status: mysqlEnum('status', [
    'IN_STOCK',
    'OUT_OF_STOCK',
    'MANUAL_NEW',
  ]).default('IN_STOCK'),

  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * BARU: Tabel Purchase Order untuk workflow pengadaan spare part.
 * Alur: REQUESTED → ORDERED → SHIPPED → RECEIVED (stok bertambah) / CANCELLED
 */
export const purchaseOrders = mysqlTable(
  'purchase_orders',
  {
    id: int('id').autoincrement().primaryKey(),

    // Nullable: PO bisa untuk part yang belum ada di master
    sparePartId: int('spare_part_id').references(() => spareParts.id),

    // Nama part wajib diisi (backup jika sparePartId null)
    partName: varchar('part_name', { length: 255 }).notNull(),
    quantity: int('quantity').default(1).notNull(),

    // Harga beli per unit (opsional, bisa diisi setelah negosiasi dengan supplier)
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).default(
      '0.00'
    ),

    status: mysqlEnum('status', [
      'REQUESTED',
      'ORDERED',
      'SHIPPED',
      'RECEIVED',
      'CANCELLED',
    ]).default('REQUESTED'),

    // Jumlah yang benar-benar diterima (support partial receipt)
    receivedQuantity: int('received_quantity').default(0),

    notes: text('notes'),

    // Timestamp setiap milestone
    orderedAt: datetime('ordered_at'),
    shippedAt: datetime('shipped_at'),
    receivedAt: datetime('received_at'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    statusIdx: index('po_status_idx').on(table.status),
    spIdx: index('po_sp_idx').on(table.sparePartId),
  })
);

// ============================================================
// RELATIONS
// ============================================================

export const serviceRequestsRelations = relations(
  serviceRequests,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [serviceRequests.customerId],
      references: [customers.id],
    }),
    product: one(products, {
      fields: [serviceRequests.productId],
      references: [products.id],
    }),
    admin: one(staff, {
      fields: [serviceRequests.adminId],
      references: [staff.id],
      relationName: 'admin',
    }),
    technicianCheck: one(staff, {
      fields: [serviceRequests.technicianCheckId],
      references: [staff.id],
      relationName: 'technician',
    }),
    orderParts: many(orderParts),
  })
);

export const orderPartsRelations = relations(orderParts, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [orderParts.serviceRequestId],
    references: [serviceRequests.id],
  }),
  sparePart: one(spareParts, {
    fields: [orderParts.sparePartId],
    references: [spareParts.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one }) => ({
  sparePart: one(spareParts, {
    fields: [purchaseOrders.sparePartId],
    references: [spareParts.id],
  }),
}));

export const sparePartsRelations = relations(spareParts, ({ many }) => ({
  orderParts: many(orderParts),
  purchaseOrders: many(purchaseOrders),
}));
