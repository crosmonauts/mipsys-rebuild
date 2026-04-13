import { db } from './db';
import { locations, partMappings } from './schema';
import { eq } from 'drizzle-orm';

// PERHATIKAN: Tidak ada lagi import dari folder '../service-requests/...'

async function main() {
  console.log('--- [SEEDING] Memulai proses... ---');

  try {
    // 1. Seed Lokasi Master
    const locData = { id: 1, name: 'EASC SEMARANG', warehouse_id: 8700, cost_center: 'E5SGTB' };
    const existingLoc = await db.select().from(locations).where(eq(locations.id, 1));
    
    if (existingLoc.length === 0) {
      await db.insert(locations).values(locData);
      console.log('✅ Lokasi: EASC SEMARANG siap.');
    } else {
      console.log('🟡 Info: Lokasi sudah ada.');
    }

    // 2. Seed Part Mappings (Otak Pemetaan)
    const mappings = [
      { keyword: 'mati total', machine_type: 'ANY', part_no: '02128471', part_name: 'MAIN BOARD' },
      { keyword: 'kertas macet', machine_type: 'ANY', part_no: '01033756', part_name: 'ROLLER FEED' },
      { keyword: 'hasil bergaris', machine_type: 'ANY', part_no: '0F190020', part_name: 'PRINT HEAD' },
      { keyword: 'partsale', machine_type: 'ANY', part_no: '01017319', part_name: 'SPAREPART TEST' }
    ];

    for (const m of mappings) {
      const exist = await db.select().from(partMappings).where(eq(partMappings.keyword, m.keyword));
      if (exist.length === 0) {
        await db.insert(partMappings).values(m);
      }
    }
    console.log('✅ Mapping: Kamus sparepart siap.');

  } catch (error) {
    console.error('❌ Gagal Seeding:', error);
  }

  console.log('--- [FINISH] Database siap tempur! ---');
  process.exit(0);
}

main();