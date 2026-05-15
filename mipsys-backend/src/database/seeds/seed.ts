import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../schema';
import 'dotenv/config';

async function runSeeder() {
  console.log('⏳ [Seeder]: Menyiapkan data tes untuk aplikasi MiPSys...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'db_mipsys',
  });

  const db = drizzle(connection, { schema, mode: 'default' });

  try {
    console.log('🌱 [Seeder]: Mulai menyuntikkan data tes...\n');

    // ========================================================================
    // TAHAP 1: STAFF (Admin + Teknisi)
    // ========================================================================
    console.log('📦 Tahap 1: Staff...');
    await db.insert(schema.staff).values([
      { name: 'Admin Utama', role: 'ADMIN' },
      { name: 'Teknisi Budi', role: 'TECHNICIAN' },
      { name: 'Teknisi Andi', role: 'TECHNICIAN' },
    ]);
    console.log('  ✔ 3 staff dibuat (1 Admin, 2 Teknisi)');

    // ========================================================================
    // TAHAP 2: CUSTOMERS (Personal + Corporate)
    // ========================================================================
    console.log('📦 Tahap 2: Customers...');
    await db.insert(schema.customers).values([
      {
        name: 'Budi Santoso',
        phone: '081234567890',
        address: 'Jl. Merdeka No. 10, Jakarta',
        customerType: 'PERSONAL',
      },
      {
        name: 'Siti Rahayu',
        phone: '082345678901',
        address: 'Jl. Sudirman No. 25, Surabaya',
        customerType: 'PERSONAL',
      },
      {
        name: 'Ahmad Fauzi',
        phone: '083456789012',
        address: 'Jl. Gatot Subroto No. 5, Bandung',
        customerType: 'PERSONAL',
      },
      {
        name: 'PT. Teknologi Maju Jaya',
        phone: '0215551234',
        address: 'Jl. HR Rasuna Said Kav. 12, Jakarta Selatan',
        customerType: 'CORPORATE',
      },
      {
        name: 'CV. Elektronik Sejahtera',
        phone: '0315556789',
        address: 'Jl. Pemuda No. 88, Surabaya',
        customerType: 'CORPORATE',
      },
    ]);
    console.log('  ✔ 5 customers dibuat (3 Personal, 2 Corporate)');

    // ========================================================================
    // TAHAP 3: PRODUCTS (Berbagai model)
    // ========================================================================
    console.log('📦 Tahap 3: Products...');
    await db.insert(schema.products).values([
      { modelName: 'Midea AC 1PK Inverter', serialNumber: 'SN-AC-001-2026' },
      { modelName: 'Midea Washing Machine 8kg', serialNumber: 'SN-WM-002-2026' },
      { modelName: 'Midea Refrigerator 2 Pintu', serialNumber: 'SN-RF-003-2026' },
      { modelName: 'Midea Microwave 20L', serialNumber: 'SN-MW-004-2026' },
      { modelName: 'Midea Water Dispenser Hot&Cool', serialNumber: 'SN-WD-005-2026' },
      { modelName: 'Midea Air Purifier', serialNumber: 'SN-AP-006-2026' },
      { modelName: 'Midea Dehumidifier 20L', serialNumber: 'SN-DH-007-2026' },
      { modelName: 'Midea Standing Fan 16"', serialNumber: 'SN-SF-008-2026' },
    ]);
    console.log('  ✔ 8 products dibuat');

    // ========================================================================
    // TAHAP 4: SPARE PARTS (Inventory lengkap)
    // ========================================================================
    console.log('📦 Tahap 4: Spare Parts...');
    await db.insert(schema.spareParts).values([
      {
        partCode: 'COMP-001',
        partName: 'Compressor AC 1PK R32',
        modelName: 'Midea AC 1PK Inverter',
        block: 'A1',
        stock: 5,
        minStock: 3,
        location: 'Rak A-01',
        price: '1850000.00',
        type: 'COMPRESSOR',
        ipStatus: 'IP',
      },
      {
        partCode: 'FAN-001',
        partName: 'Fan Motor Indoor AC',
        modelName: 'Midea AC 1PK Inverter',
        block: 'A2',
        stock: 12,
        minStock: 5,
        location: 'Rak A-02',
        price: '350000.00',
        type: 'MOTOR',
        ipStatus: 'IP',
      },
      {
        partCode: 'PCB-001',
        partName: 'PCB Main Board AC Inverter',
        modelName: 'Midea AC 1PK Inverter',
        block: 'B1',
        stock: 3,
        minStock: 5,
        location: 'Rak B-01',
        price: '750000.00',
        type: 'ELECTRONIC',
        ipStatus: 'IP',
      },
      {
        partCode: 'CAP-001',
        partName: 'Capacitor 35uF 450V',
        modelName: 'Midea AC 1PK Inverter',
        block: 'B2',
        stock: 25,
        minStock: 10,
        location: 'Rak B-02',
        price: '45000.00',
        type: 'CAPACITOR',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'BELT-001',
        partName: 'Drive Belt Washing Machine',
        modelName: 'Midea Washing Machine 8kg',
        block: 'C1',
        stock: 8,
        minStock: 5,
        location: 'Rak C-01',
        price: '85000.00',
        type: 'BELT',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'PUMP-001',
        partName: 'Drain Pump Washing Machine',
        modelName: 'Midea Washing Machine 8kg',
        block: 'C2',
        stock: 0,
        minStock: 5,
        location: 'Rak C-02',
        price: '275000.00',
        type: 'PUMP',
        ipStatus: 'IP',
      },
      {
        partCode: 'THERMO-001',
        partName: 'Thermostat Kulkas 2 Pintu',
        modelName: 'Midea Refrigerator 2 Pintu',
        block: 'D1',
        stock: 6,
        minStock: 5,
        location: 'Rak D-01',
        price: '125000.00',
        type: 'SENSOR',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'MAGNET-001',
        partName: 'Magnet Door Seal Kulkas',
        modelName: 'Midea Refrigerator 2 Pintu',
        block: 'D2',
        stock: 0,
        minStock: 5,
        location: 'Rak D-02',
        price: '95000.00',
        type: 'SEAL',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'MAGTRON-001',
        partName: 'Magnetron Microwave 20L',
        modelName: 'Midea Microwave 20L',
        block: 'E1',
        stock: 4,
        minStock: 5,
        location: 'Rak E-01',
        price: '425000.00',
        type: 'ELECTRONIC',
        ipStatus: 'IP',
      },
      {
        partCode: 'FILTER-001',
        partName: 'HEPA Filter Air Purifier',
        modelName: 'Midea Air Purifier',
        block: 'F1',
        stock: 20,
        minStock: 10,
        location: 'Rak F-01',
        price: '185000.00',
        type: 'FILTER',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'VALVE-001',
        partName: 'Solenoid Valve Water Dispenser',
        modelName: 'Midea Water Dispenser Hot&Cool',
        block: 'G1',
        stock: 2,
        minStock: 5,
        location: 'Rak G-01',
        price: '165000.00',
        type: 'VALVE',
        ipStatus: 'IP',
      },
      {
        partCode: 'HEATER-001',
        partName: 'Heating Element Water Dispenser',
        modelName: 'Midea Water Dispenser Hot&Cool',
        block: 'G2',
        stock: 0,
        minStock: 5,
        location: 'Rak G-02',
        price: '210000.00',
        type: 'HEATER',
        ipStatus: 'IP',
      },
      {
        partCode: 'EP-001',
        partName: 'Print Head Assembly',
        modelName: 'L3110',
        block: 'Print Head',
        stock: 45,
        minStock: 10,
        location: 'Rak A-03',
        price: '850000.00',
        type: 'ELECTRONIC',
        ipStatus: 'IP',
      },
      {
        partCode: 'EP-002',
        partName: 'Cap Unit',
        modelName: 'L3110',
        block: 'Cap',
        stock: 3,
        minStock: 5,
        location: 'Rak A-04',
        price: '320000.00',
        type: 'MECHANICAL',
        ipStatus: 'IP',
      },
      {
        partCode: 'EP-003',
        partName: 'Wiper Blade',
        modelName: 'L3110',
        block: 'Wiper',
        stock: 0,
        minStock: 10,
        location: 'Rak B-03',
        price: '125000.00',
        type: 'MECHANICAL',
        ipStatus: 'Non IP',
      },
    ]);
    console.log('  ✔ 15 spare parts dibuat (5 OK, 6 LOW, 4 EMPTY)');

    // ========================================================================
    // TAHAP 5: SERVICE REQUESTS (Berbagai status untuk tes dashboard)
    // ========================================================================
    console.log('📦 Tahap 5: Service Requests...');
    await db.insert(schema.serviceRequests).values([
      {
        ticketNumber: 'SR-20260501-0001',
        serviceType: 'WARRANTY',
        customerId: 1,
        productId: 1,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: new Date('2026-05-01'),
        checkDate: new Date('2026-05-02'),
        problemDescription: 'AC tidak dingin, compressor tidak berbunyi',
        statusService: 'WAITING_CHECK',
        serviceFee: '0.00',
        partFee: '0.00',
        shippingFee: '0.00',
        createdAt: new Date('2026-05-01'),
      },
      {
        ticketNumber: 'SR-20260503-0002',
        serviceType: 'NON_WARRANTY',
        customerId: 2,
        productId: 2,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: new Date('2026-05-03'),
        checkDate: new Date('2026-05-04'),
        problemDescription: 'Mesin cuci berisik saat spin, ada bunyi benturan keras',
        statusService: 'CHECK',
        serviceFee: '0.00',
        partFee: '0.00',
        shippingFee: '0.00',
        createdAt: new Date('2026-05-03'),
      },
      {
        ticketNumber: 'SR-20260505-0003',
        serviceType: 'NON_WARRANTY',
        customerId: 3,
        productId: 3,
        adminId: 1,
        technicianCheckId: 3,
        incomingDate: new Date('2026-05-05'),
        checkDate: new Date('2026-05-06'),
        problemDescription: 'Kulkas bagian freezer tidak dingin, bagian bawah terlalu dingin',
        statusService: 'WAITING_APPROVE',
        serviceFee: '150000.00',
        partFee: '125000.00',
        shippingFee: '50000.00',
        createdAt: new Date('2026-05-05'),
      },
      {
        ticketNumber: 'SR-20260507-0004',
        serviceType: 'WARRANTY',
        customerId: 4,
        productId: 4,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: new Date('2026-05-07'),
        checkDate: new Date('2026-05-08'),
        spDate: new Date('2026-05-09'),
        approveDate: new Date('2026-05-10'),
        problemDescription: 'Microwave tidak bisa memanaskan, lampu nyala tapi food tidak panas',
        statusService: 'SERVICE',
        serviceFee: '200000.00',
        partFee: '425000.00',
        shippingFee: '75000.00',
        createdAt: new Date('2026-05-07'),
      },
      {
        ticketNumber: 'SR-20260508-0005',
        serviceType: 'NON_WARRANTY',
        customerId: 5,
        productId: 5,
        adminId: 1,
        technicianCheckId: 3,
        incomingDate: new Date('2026-05-08'),
        checkDate: new Date('2026-05-09'),
        spDate: new Date('2026-05-10'),
        approveDate: new Date('2026-05-11'),
        problemDescription: 'Water dispenser air panas tidak keluar, air normal lancar',
        statusService: 'SERVICE',
        serviceFee: '175000.00',
        partFee: '210000.00',
        shippingFee: '50000.00',
        createdAt: new Date('2026-05-08'),
      },
      {
        ticketNumber: 'SR-20260510-0006',
        serviceType: 'NON_WARRANTY',
        customerId: 1,
        productId: 6,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: new Date('2026-05-10'),
        checkDate: new Date('2026-05-11'),
        spDate: new Date('2026-05-12'),
        approveDate: new Date('2026-05-13'),
        readyDate: new Date('2026-05-14'),
        problemDescription: 'Air purifier indikator filter merah, suara berisik',
        statusService: 'DONE',
        serviceFee: '100000.00',
        partFee: '185000.00',
        shippingFee: '35000.00',
        createdAt: new Date('2026-05-10'),
      },
      {
        ticketNumber: 'SR-20260511-0007',
        serviceType: 'WARRANTY',
        customerId: 2,
        productId: 7,
        adminId: 1,
        technicianCheckId: 3,
        incomingDate: new Date('2026-05-11'),
        checkDate: new Date('2026-05-12'),
        spDate: new Date('2026-05-13'),
        approveDate: new Date('2026-05-14'),
        readyDate: new Date('2026-05-15'),
        closeDate: new Date('2026-05-15'),
        problemDescription: 'Dehumidifier tidak menyala sama sekali, display blank',
        statusService: 'DONE',
        serviceFee: '0.00',
        partFee: '0.00',
        shippingFee: '0.00',
        createdAt: new Date('2026-05-11'),
      },
      {
        ticketNumber: 'SR-20260512-0008',
        serviceType: 'NON_WARRANTY',
        customerId: 3,
        productId: 8,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: new Date('2026-05-12'),
        checkDate: new Date('2026-05-13'),
        problemDescription: 'Kipas angin mati total, sudah cek kabel dan colokan normal',
        statusService: 'CANCEL',
        closeDate: new Date('2026-05-13'),
        serviceFee: '0.00',
        partFee: '0.00',
        shippingFee: '0.00',
        createdAt: new Date('2026-05-12'),
      },
      {
        ticketNumber: 'SR-20260513-0009',
        serviceType: 'NON_WARRANTY',
        customerId: 4,
        productId: 1,
        adminId: 1,
        technicianCheckId: 3,
        incomingDate: new Date('2026-05-13'),
        problemDescription: 'AC bocor air dari unit indoor, menetes ke dinding',
        statusService: 'WAITING_CHECK',
        serviceFee: '0.00',
        partFee: '0.00',
        shippingFee: '0.00',
        createdAt: new Date('2026-05-13'),
      },
      {
        ticketNumber: 'SR-20260514-0010',
        serviceType: 'WARRANTY',
        customerId: 5,
        productId: 2,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: new Date('2026-05-14'),
        checkDate: new Date('2026-05-15'),
        problemDescription: 'Mesin cuci error code E3, tidak bisa drain air',
        statusService: 'CHECK',
        serviceFee: '0.00',
        partFee: '0.00',
        shippingFee: '0.00',
        createdAt: new Date('2026-05-14'),
      },
    ]);
    console.log('  ✔ 10 service requests dibuat');
    console.log('     - WAITING_CHECK: 2');
    console.log('     - CHECK: 2');
    console.log('     - WAITING_APPROVE: 1');
    console.log('     - SERVICE: 2');
    console.log('     - DONE: 2');
    console.log('     - CANCEL: 1');

    // ========================================================================
    // TAHAP 6: ORDER PARTS (Parts used in service requests)
    // ========================================================================
    console.log('📦 Tahap 6: Order Parts...');
    await db.insert(schema.orderParts).values([
      {
        serviceRequestId: 4,
        sparePartId: 9,
        partName: 'Magnetron Microwave 20L',
        quantity: 1,
        priceAtAction: '425000.00',
        status: 'IN_STOCK',
      },
      {
        serviceRequestId: 5,
        sparePartId: 12,
        partName: 'Heating Element Water Dispenser',
        quantity: 1,
        priceAtAction: '210000.00',
        status: 'IN_STOCK',
      },
      {
        serviceRequestId: 6,
        sparePartId: 10,
        partName: 'HEPA Filter Air Purifier',
        quantity: 1,
        priceAtAction: '185000.00',
        status: 'IN_STOCK',
      },
      {
        serviceRequestId: 3,
        sparePartId: 7,
        partName: 'Thermostat Kulkas 2 Pintu',
        quantity: 1,
        priceAtAction: '125000.00',
        status: 'IN_STOCK',
      },
    ]);
    console.log('  ✔ 4 order parts dibuat');

    // ========================================================================
    // TAHAP 7: SERVICE LOGS (Activity history)
    // ========================================================================
    console.log('📦 Tahap 7: Service Logs...');
    await db.insert(schema.serviceLogs).values([
      {
        serviceRequestId: 1,
        action: 'TICKET_CREATED',
        description: 'Tiket SR-20260501-0001 dibuat oleh Admin Utama',
        performedBy: 1,
        createdAt: new Date('2026-05-01T09:00:00'),
      },
      {
        serviceRequestId: 1,
        action: 'ASSIGNED_TO_TECHNICIAN',
        description: 'Ditugaskan ke Teknisi Budi untuk pengecekan',
        performedBy: 1,
        createdAt: new Date('2026-05-02T08:30:00'),
      },
      {
        serviceRequestId: 4,
        action: 'TICKET_CREATED',
        description: 'Tiket SR-20260507-0004 dibuat oleh Admin Utama',
        performedBy: 1,
        createdAt: new Date('2026-05-07T10:00:00'),
      },
      {
        serviceRequestId: 4,
        action: 'DIAGNOSIS_COMPLETED',
        description: 'Diagnosa: Magnetron rusak, perlu penggantian',
        performedBy: 2,
        createdAt: new Date('2026-05-08T14:00:00'),
      },
      {
        serviceRequestId: 4,
        action: 'PART_REPLACED',
        description: 'Magnetron Microwave 20L diganti',
        performedBy: 2,
        createdAt: new Date('2026-05-10T11:00:00'),
      },
      {
        serviceRequestId: 6,
        action: 'TICKET_CREATED',
        description: 'Tiket SR-20260510-0006 dibuat',
        performedBy: 1,
        createdAt: new Date('2026-05-10T09:00:00'),
      },
      {
        serviceRequestId: 6,
        action: 'SERVICE_COMPLETED',
        description: 'Service selesai, HEPA Filter diganti, unit normal',
        performedBy: 2,
        createdAt: new Date('2026-05-14T16:00:00'),
      },
      {
        serviceRequestId: 6,
        action: 'PAYMENT_RECEIVED',
        description: 'Pembayaran diterima: Rp 320.000',
        performedBy: 1,
        createdAt: new Date('2026-05-14T17:00:00'),
      },
      {
        serviceRequestId: 6,
        action: 'TICKET_CLOSED',
        description: 'Tiket ditutup, unit sudah diambil customer',
        performedBy: 1,
        createdAt: new Date('2026-05-15T10:00:00'),
      },
      {
        serviceRequestId: 8,
        action: 'TICKET_CANCELLED',
        description: 'Tiket dibatalkan: Customer tidak jadi service',
        performedBy: 1,
        createdAt: new Date('2026-05-13T15:00:00'),
      },
    ]);
    console.log('  ✔ 10 service logs dibuat');

    // ========================================================================
    // TAHAP 8: PURCHASE ORDERS (Berbagai status untuk tes workflow PO)
    // ========================================================================
    console.log('📦 Tahap 8: Purchase Orders...');
    await db.insert(schema.purchaseOrders).values([
      {
        sparePartId: 6,
        partName: 'Drain Pump Washing Machine',
        quantity: 5,
        unitPrice: '275000.00',
        status: 'REQUESTED',
        notes: 'Urgent - dibutuhkan untuk SR-20260503-0002',
        createdAt: new Date('2026-05-14'),
      },
      {
        sparePartId: 8,
        partName: 'Magnet Door Seal Kulkas',
        quantity: 10,
        unitPrice: '95000.00',
        status: 'ORDERED',
        notes: 'Stok habis, reorder dari supplier',
        orderedAt: new Date('2026-05-12T10:00:00'),
        createdAt: new Date('2026-05-12'),
      },
      {
        sparePartId: 12,
        partName: 'Heating Element Water Dispenser',
        quantity: 3,
        unitPrice: '210000.00',
        status: 'SHIPPED',
        notes: 'Dikirim via JNE, resi: JNE123456789',
        orderedAt: new Date('2026-05-10T09:00:00'),
        shippedAt: new Date('2026-05-12T14:00:00'),
        createdAt: new Date('2026-05-10'),
      },
      {
        sparePartId: 1,
        partName: 'Compressor AC 1PK R32',
        quantity: 2,
        unitPrice: '1850000.00',
        status: 'RECEIVED',
        notes: 'Diterima dalam kondisi baik',
        orderedAt: new Date('2026-05-05T08:00:00'),
        shippedAt: new Date('2026-05-07T10:00:00'),
        receivedAt: new Date('2026-05-09T11:00:00'),
        receivedQuantity: 2,
        createdAt: new Date('2026-05-05'),
      },
      {
        sparePartId: 11,
        partName: 'Solenoid Valve Water Dispenser',
        quantity: 5,
        unitPrice: '165000.00',
        status: 'CANCELLED',
        notes: 'Dibatalkan - supplier tidak bisa kirim',
        createdAt: new Date('2026-05-08'),
      },
    ]);
    console.log('  ✔ 5 purchase orders dibuat');
    console.log('     - REQUESTED: 1');
    console.log('     - ORDERED: 1');
    console.log('     - SHIPPED: 1');
    console.log('     - RECEIVED: 1');
    console.log('     - CANCELLED: 1');

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n🚀 [Seeder]: SELAMAT! Semua data tes berhasil disuntikkan.\n');
    console.log('📊 Ringkasan Data:');
    console.log('   ┌─────────────────────────────┬───────┐');
    console.log('   │ Entity                      │ Count │');
    console.log('   ├─────────────────────────────┼───────┤');
    console.log('   │ Staff                       │     3 │');
    console.log('   │ Customers                   │     5 │');
    console.log('   │ Products                    │     8 │');
    console.log('   │ Spare Parts                 │    15 │');
    console.log('   │ Service Requests            │    10 │');
    console.log('   │ Order Parts                 │     4 │');
    console.log('   │ Service Logs                │    10 │');
    console.log('   │ Purchase Orders             │     5 │');
    console.log('   └─────────────────────────────┴───────┘');
    console.log('\n💡 Tips Tes:');
    console.log('   - Dashboard: Lihat statistik 10 SR dengan berbagai status');
    console.log('   - Service Request: Test CRUD dengan 10 tiket sample');
    console.log('   - Inventory: 15 parts, 4 EMPTY + 6 LOW stock (alert demo)');
    console.log('   - Purchase Order: Test workflow 5 status berbeda');
    console.log('   - Payment: SR #6 (DONE) siap untuk tes pembayaran');

  } catch (error) {
    console.error('❌ [Seeder Error]:', error);
    await connection.end();
    process.exit(1);
  }

  await connection.end();
}

runSeeder();
