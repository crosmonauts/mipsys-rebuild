import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import 'dotenv/config'; // Mengambil kredensial dari file .env backend Anda

// ============================================================================
// MESIN PENYEMAI DATA OTOMATIS (DRIZZLE SEEDER)
// Eksekusi linier O(1) untuk menjamin integritas referensial pangkalan data
// ============================================================================

async function runSeeder() {
  console.log('⏳ [Seeder]: Menyiapkan truk logistik menuju pangkalan data...');

  // 1. Membuka jalur koneksi langsung ke MySQL menggunakan variabel lingkungan
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/mipsys_db',
  });

  const db = drizzle(connection, { schema, mode: 'default' });

  try {
    console.log('🌱 [Seeder]: Mulai menyuntikkan data induk (Master Data)...');

    // ------------------------------------------------------------------------
    // TAHAP 1: Menyuntikkan Master Spare Parts (Kebutuhan Modul Inventory)
    // ------------------------------------------------------------------------
    await db.insert(schema.spareParts).values([
      {
        partCode: 'PART-001',
        partName: 'LCD Display ROG Phone 3 Original',
        stock: 12,
        price: '1250000.00',
      },
      {
        partCode: 'PART-002',
        partName: 'IC Power Management ESP32 SMD',
        stock: 3,
        price: '45000.00',
      },
      {
        partCode: 'PART-003',
        partName: 'Konektor USB Type-C OEM',
        stock: 0,
        price: '15000.00',
      },
    ]);
    console.log('  ✔ Master Spare Parts berhasil diisi.');

    // ------------------------------------------------------------------------
    // TAHAP 2: Menyuntikkan Pelanggan & Produk (Prasyarat Mutlak Relasi)
    // ------------------------------------------------------------------------
    // Injeksi Pelanggan ID 1
    await db.insert(schema.customers).values([
      {
        name: 'PT. Solusi Digital Inklusif',
        address: 'Jl. Aksesibilitas AAA No. 1',
      },
    ]);

    // Injeksi Produk ID 1
    await db
      .insert(schema.products)
      .values([
        { modelName: 'ASUS ROG Phone 3', serialNumber: 'SN-ROG3-2026-X' },
      ]);
    console.log('  ✔ Master Customers & Products berhasil diisi.');

    // ------------------------------------------------------------------------
    // TAHAP 3: Menyuntikkan Tiket Perbaikan (Kebutuhan Dasbor Utama & Finance)
    // Menggunakan relasi ke Customer ID 1 dan Product ID 1 yang baru dibuat
    // ------------------------------------------------------------------------
    await db.insert(schema.serviceRequests).values([
      {
        ticketNumber: 'TICK-2026-001',
        serviceType: 'NON_WARRANTY', // Sesuaikan dengan nilai Enum skema Anda
        customerId: 1,
        productId: 1,
        incomingDate: new Date('2026-05-12'),
        problemDescription:
          'Layar bergaris hijau dan konektor daya longgar mati total',
        statusService: 'SERVICE', // Status aktif, masuk ke perhitungan Piutang
        serviceFee: '250000.00',
        partFee: '1250000.00',
        shippingFee: '35000.00',
      },
    ]);
    console.log('  ✔ Service Requests (Tiket Perbaikan) berhasil disuntikkan.');

    console.log(
      '🚀 [Seeder]: SELAMAT! Seluruh penyemaian data selesai 100% tanpa defect.'
    );
  } catch (error) {
    console.error(
      '❌ [Seeder Error]: Terjadi kendala saat menyisip data. Rincian:',
      error
    );
  } finally {
    // Menutup katup koneksi agar terminal tidak gantung (hanging)
    await connection.end();
  }
}

// Menjalankan konveyor
runSeeder();
