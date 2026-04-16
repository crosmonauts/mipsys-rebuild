import { db } from './db';
import { locations } from './schema';

async function main() {
  console.log('--- [SEEDING] Menanam Pondasi Master Data ---');

  // Pastikan setidaknya ada EASC Semarang agar Scraper tidak error
  await db.insert(locations).values({
    id: 1, // ID yang dirujuk oleh Scraper
    name: 'EASC SEMARANG',
    warehouse_id: 8700,
    cost_center: 'SMG-01'
  }).onDuplicateKeyUpdate({ set: { name: 'EASC SEMARANG' } });

  console.log('--- [SUCCESS] Master Data Siap Digunakan! ---');
}

main();