import { mysqlTable, int, varchar, text, timestamp, date, index, uniqueIndex } from 'drizzle-orm/mysql-core';

// --- 1. LOKASI (Master) ---
export const locations = mysqlTable('locations', {
  id: int('id').autoincrement().primaryKey(), 
  name: varchar('name', { length: 255 }).notNull(),
  warehouse_id: int('warehouse_id'),
  cost_center: varchar('cost_center', { length: 50 }),
});

// --- 2. SERVICE REQUESTS (Gudang Data Utama) ---
export const serviceRequests = mysqlTable('service_requests', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sr_number: varchar('sr_number', { length: 50 }).notNull(),
  sp_number: varchar('sp_number', { length: 50 }),
  
  // Identitas & Tipe
  customer_name: varchar('customer_name', { length: 255 }).notNull(),
  customer_type: varchar('customer_type', { length: 50 }).default('Pribadi'),
  service_action: varchar('service_action', { length: 50 }).default('Service Only'),
  
  // Kontak & Alamat Lengkap
  phone_number: varchar('phone_number', { length: 20 }).notNull(),
  email: varchar('email', { length: 100 }),
  contact_person: varchar('contact_person', { length: 100 }),
  address_1: varchar('address_1', { length: 255 }).notNull(),
  address_2: varchar('address_2', { length: 255 }),
  address_3: varchar('address_3', { length: 255 }).notNull(), // Kota

  // Detail Mesin
  machine_model: varchar('machine_model', { length: 100 }).notNull(),
  serial_number: varchar('serial_number', { length: 100 }),
  warranty_status: varchar('warranty_status', { length: 50 }).notNull(),
  service_mode: varchar('service_mode', { length: 50 }).notNull(),
  ink_type: varchar('ink_type', { length: 10 }),
  accessories: text('accessories'),

  // Pekerjaan & Teknisi
  problem_desc: text('problem_desc').notNull(),
  tech_remarks: text('tech_remarks'),
  technician_name: varchar('technician_name', { length: 100 }),
  
  // Data Finansial
  labor_cost: int('labor_cost').default(0),
  part_cost: int('part_cost').default(0),
  onsite_cost: int('onsite_cost').default(0),
  other_cost: int('other_cost').default(0),
  tax_amount: int('tax_amount').default(0),
  total_amount: int('total_amount').default(0),
  is_approved: int('is_approved').default(0),

  status: varchar('status', { length: 10 }).default('0'),
  location_id: int('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  srIdx: uniqueIndex('sr_number_idx').on(table.sr_number),
  spIdx: index('sp_number_idx').on(table.sp_number),
  machineIdx: index('machine_model_idx').on(table.machine_model),
}));

// --- 3. PART REQUESTS (Daftar Suku Cadang) ---
export const partRequests = mysqlTable('part_requests', {
  id: int('id').autoincrement().primaryKey(),
  sr_id: varchar('sr_id', { length: 36 }).references(() => serviceRequests.id, { onDelete: 'cascade' }),
  part_no: varchar('part_no', { length: 100 }),
  part_name: varchar('part_name', { length: 255 }),
  quantity: int('quantity').default(1),
  unit_price: int('unit_price').default(0),
  line_total: int('line_total').default(0),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  srIdIdx: index('sr_id_part_idx').on(table.sr_id),
}));

// --- 4. SHIPMENTS (Logistik) ---
export const shipments = mysqlTable('shipments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  location_id: int('location_id').references(() => locations.id),
  status: varchar('status', { length: 50 }),
  issue_date: date('issue_date'),
  picklist_no: varchar('picklist_no', { length: 100 }).unique(),
});

// --- 5. MACHINES (Master Data Mesin) ---
export const machines = mysqlTable('machines', {
  id: int('id').autoincrement().primaryKey(),
  model: varchar('model', { length: 100 }).notNull().unique(), // Contoh: L3150
  brand: varchar('brand', { length: 50 }).default('EPSON'),
  created_at: timestamp('created_at').defaultNow(),
});