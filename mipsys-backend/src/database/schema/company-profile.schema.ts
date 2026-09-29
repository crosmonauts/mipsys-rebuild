import {
  integer,
  timestamp,
  varchar,
  boolean,
  customType,
  pgTable,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/** bytea tidak diekspor pg-core, jadi didefinisikan sendiri. */
const bytea = customType<{ data: Buffer }>({
  dataType: () => 'bytea',
});

const singletonId = integer('id').primaryKey();

/**
 * Identitas legal perusahaan (satu baris, id=1). Dipakai sebagai sumber
 * tunggal untuk kop laporan, kop invoice, dan template cetakan.
 *
 * Logo disimpan sebagai bytea, bukan file di disk, agar tetap bekerja saat
 * backend dijalankan pada filesystem read-only (mis. Vercel).
 */
export const companyProfiles = pgTable('company_profiles', {
  id: singletonId,
  name: varchar('name', { length: 200 }).notNull(),
  address: varchar('address', { length: 500 }).notNull(),
  city: varchar('city', { length: 200 }),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 200 }),
  npwp: varchar('npwp', { length: 20 }),
  isPkp: boolean('is_pkp').default(false).notNull(),
  logoData: bytea('logo_data'),
  logoMime: varchar('logo_mime', { length: 100 }),
  logoSize: integer('logo_size'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => sql`now()`),
  updatedBy: integer('updated_by'),
});

/** Batas aman logo (1 MB) — cukup untuk logo vektor/raster kecil. */
export const MAX_LOGO_BYTES = 1024 * 1024;

/**
 * Hanya png + jpeg: keduanya bisa dirender ExcelJS (XLSX) maupun
 * PDFKit (PDF). Webp tidak didukung ExcelJS sehingga akan hilang
 * diam-diam di laporan.
 */
export const ALLOWED_LOGO_MIME = ['image/png', 'image/jpeg'] as const;
