// 1. TABEL LOKASI (Gunakan int().autoincrement())
export const locations = mysqlTable('locations', {
  id: int('id').autoincrement().primaryKey(), 
  name: varchar('name', { length: 255 }).notNull(),
  warehouse_id: int('warehouse_id'),
  cost_center: varchar('cost_center', { length: 50 }),
});

// 2. TABEL PART REQUEST
export const partRequests = mysqlTable('part_requests', {
  id: int('id').autoincrement().primaryKey(), // Ganti dari serial ke int
  sr_id: varchar('sr_id', { length: 36 }).references(() => serviceRequests.id, { onDelete: 'cascade' }),
  part_no: varchar('part_no', { length: 100 }),
  quantity: int('quantity').default(1),
  request_status: varchar('request_status', { length: 20 }).default('WAITING'),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  partIdx: index('part_no_idx').on(table.part_no),
}));

// 3. TABEL PART MAPPINGS
export const partMappings = mysqlTable('part_mappings', {
  id: int('id').autoincrement().primaryKey(), // Ganti dari serial ke int
  keyword: varchar('keyword', { length: 100 }).notNull(),
  machine_type: varchar('machine_type', { length: 100 }),
  part_no: varchar('part_no', { length: 100 }).notNull(),
  part_name: varchar('part_name', { length: 255 }),
});