import { db } from './db';
import { sql } from 'drizzle-orm';

async function reset() {
  console.log('--- [RESET] Menghancurkan database lama... ---');
  try {
    // 1. Matikan satpam keamanan (FK)
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

    // 2. Ambil semua nama tabel dan hapus
    const tables = ['part_requests', 'service_requests', 'shipments', 'part_mappings', 'locations'];
    for (const table of tables) {
      await db.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(table)}`);
    }
    
    // Hapus juga tabel history drizzle
    await db.execute(sql`DROP TABLE IF EXISTS __drizzle_migrations`);

    console.log('✅ Database bersih total.');
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
  } catch (e) {
    console.error('❌ Gagal Reset:', e);
  }
  process.exit(0);
}

reset();