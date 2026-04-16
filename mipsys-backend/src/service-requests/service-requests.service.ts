import { Injectable, Logger } from '@nestjs/common';
import { db } from '../db/db';
import { serviceRequests, partRequests, machines } from '../db/schema';
import { eq, desc, like, or } from 'drizzle-orm';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateTechRequestDto } from './dto/update-tech-request.dto';
import { InputBiayaDto } from './dto/input-biaya.dto';
import * as crypto from 'crypto';
import * as cheerio from 'cheerio';
import { ScraperService } from '../scraper/scraper.service'; // Pastikan path ini sesuai dengan folder scraper kamu

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger('ServiceRequestEngine');

  // 👇 INJECT SCRAPER SERVICE DI SINI 👇
  constructor(private readonly scraperService: ScraperService) {}

  // --- HELPER: Generate Nomor Otomatis (PI / SG / SP) ---
  private async generateSRNumber(prefix: 'PI' | 'SG' | 'SP' = 'PI'): Promise<string> {
    const lastRecord = await db.select({ sr_number: serviceRequests.sr_number })
      .from(serviceRequests)
      .where(like(serviceRequests.sr_number, `${prefix}%`))
      .orderBy(desc(serviceRequests.sr_number))
      .limit(1);

    if (lastRecord.length === 0) return `${prefix}000001`;

    const lastNum = parseInt(lastRecord[0].sr_number.substring(prefix.length), 10);
    return `${prefix}${(lastNum + 1).toString().padStart(6, '0')}`;
  }

  // --- API 1: DASHBOARD RESEPSIONIS (Performa Tinggi) ---
  async getReceptionistDashboard(searchQuery?: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    try {
      let query = db.select({
        id: serviceRequests.id,
        sr_number: serviceRequests.sr_number,
        sp_number: serviceRequests.sp_number,
        customer_name: serviceRequests.customer_name,
        status: serviceRequests.status,
        created_at: serviceRequests.created_at,
      })
      .from(serviceRequests)
      .orderBy(desc(serviceRequests.created_at))
      .limit(limit)
      .offset(offset);

      if (searchQuery) {
        const searchPattern = `%${searchQuery}%`;
        query.where(
          or(
            like(serviceRequests.sr_number, searchPattern),
            like(serviceRequests.sp_number, searchPattern),
            like(serviceRequests.customer_name, searchPattern)
          )
        );
      }

      const results = await query;
      return { success: true, data: results, meta: { page, limit, returned: results.length } };
    } catch (error: any) {
      this.logger.error(`Gagal memuat dashboard: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // --- API 2: SR ENTRY / INPUT BARU ---
  async createEntry(dto: CreateServiceRequestDto) {
    try {
      const sr_number = await this.generateSRNumber('PI');
      const id = crypto.randomUUID();

      await this.handleMachineMaster(dto.machine_model);

      await db.insert(serviceRequests).values({
        id,
        sr_number,
        location_id: 1, // Default EASC Semarang
        ...dto,
        status: '0',
      });

      return { success: true, sr_number, message: 'SR Entry Berhasil Dibuat', id };
    } catch (error: any) {
      this.logger.error(`Gagal SR Entry: ${error.message}`);
      throw error;
    }
  }

  // --- API 3: UPDATE TEKNISI & SPAREPART ---
  async updateTechDiagnosis(id: string, dto: UpdateTechRequestDto) {
    try{
    // 1. Hitung total harga sparepart dari array (Quantity x Unit Price)
    let totalPartCost = 0;
    if (dto.parts && dto.parts.length > 0) {
      totalPartCost = dto.parts.reduce((sum, item) => {
        return sum + (item.unit_price * item.quantity);
      }, 0);
    }

    // 2. Update data utama Service Request
    await db.update(serviceRequests)
      .set({
        technician_name: dto.technician_name,
        tech_remarks: dto.tech_remarks,
        part_cost: totalPartCost, // Hasil hitung otomatis tersimpan di sini
        status: '1', 
      })
      .where(eq(serviceRequests.id, id));

    // 3. (Opsional) Simpan rincian ke tabel part_requests
    // Jika kamu ingin simpan rinciannya agar bisa dipanggil lagi nanti:
    if (dto.parts && dto.parts.length > 0) {
      const partEntries = dto.parts.map(p => ({
        sr_id: id,
        part_no: p.part_no,
        part_name: p.part_name,
        quantity: p.quantity,
        unit_price: p.unit_price,
        line_total: p.unit_price * p.quantity
      }));
      
      // Masukkan ke tabel rincian part
      await db.insert(partRequests).values(partEntries);
    }

    return { 
      success: true, 
      message: 'Diagnosa & Rincian Part berhasil disimpan',
      total_biaya_part: totalPartCost 
    };
    } catch (error: any) {
      this.logger.error(`Gagal Update Teknisi: ${error.message}`);
      throw error;
    }
  }

 // --- API 4: SINKRONISASI DATA DARI MIPSYS LAMA (GOD-MODE ETL) ---
  async syncFromLegacy() {
    this.logger.log('--- PHASE 1: Ekstraksi Daftar Antrean Utama ---');
    
    try {
      const html = await this.scraperService.fetchHtml('/easrsel.asp'); 
      const $ = cheerio.load(html);
      
      let syncedCount = 0;
      let skippedCount = 0;
      const dataToInsert: any[] = [];

      // [PHASE 1] Membaca Daftar Pintu (Dropdown List)
      $('select#txtSRNO option').each((index, element) => {
        const rawText = $(element).text().trim();
        if (!rawText) return; 

        const parts = rawText.split('|');
        const srNumber = parts[0]?.trim(); 
        const spNumber = parts[1]?.trim(); 
        const customerName = parts[2]?.trim(); 

        if (!srNumber) return;

        dataToInsert.push({
          sr_number: srNumber,
          sp_number: spNumber,
          customer_name: customerName || 'Tanpa Nama',
          
          // Default Sementara (Akan ditimpa di Phase 2)
          serial_number: '-',
          machine_model: 'Sedang Mengambil Data...',
          phone_number: '0000000', 
          address_1: 'Sedang Mengambil Data...',
          address_3: 'Semarang',
          problem_desc: 'Sedang Mengambil Data...',
          warranty_status: 'Non Warranty',
          service_mode: 'Carry-In',
          status: '0', 
        });
      });

      this.logger.log(`[PHASE 1 Selesai] Ditemukan ${dataToInsert.length} data. Menyimpan ke MySQL...`);

      // Menyimpan Blueprint awal ke Database
      for (const item of dataToInsert) {
        const existingSR = await db.select({ id: serviceRequests.id })
          .from(serviceRequests).where(eq(serviceRequests.sr_number, item.sr_number)).limit(1);

        if (existingSR.length === 0) {
          const newId = crypto.randomUUID();
          await db.insert(serviceRequests).values({ id: newId, location_id: 1, ...item });
          syncedCount++;
        } else {
          skippedCount++;
        }
      }

      // =========================================================================
      // 👇👇👇 PHASE 2: THE DEEP DIVE (Menyelam & Ekstraksi Total) 👇👇👇
      // =========================================================================
      
      this.logger.log(`--- PHASE 2: Memulai Deep Dive ke ${dataToInsert.length} Ruangan Detail ---`);
      let detailUpdatedCount = 0;

      for (const item of dataToInsert) {
        try {
          this.logger.log(`[Menyelam] Membuka data: ${item.sr_number} ...`);

          // 1. Robot mengetuk halaman detail
          const detailHtml = await this.scraperService.postHtml('/EASRSELPULL.asp', {
            varSRNO: item.sr_number
          });

          const $$ = cheerio.load(detailHtml);

          // 2. Ekstraksi Text Input
          const phoneRaw = $$('input[name="txtPHONE"]').val()?.toString();
          const address1Raw = $$('input[name="txtSPADDR1"]').val()?.toString();
          const machineModelRaw = $$('input[name="txtMACH"]').val()?.toString();
          const serialNumRaw = $$('input[name="txtSERIAL"]').val()?.toString();
          const problemRaw = $$('input[name="txtSPPROBLEM"]').val()?.toString();
          const techRemarksRaw = $$('input[name="txtSPREMARKS"]').val()?.toString();
          const techNameRaw = $$('input[name="txtTECH1"]').val()?.toString();

          // 3. Ekstraksi Radio Button (Mengambil value yang posisinya :checked)
          const svcModeVal = $$('input[name="txtSEV"]:checked').val();
          const warrantyVal = $$('input[name="varSTS"]:checked').val();
          const custTypeVal = $$('input[name="varCTA"]:checked').val();
          const svcTypeVal = $$('input[name="varCTS"]:checked').val();

          // Translasi Kode Angka ke Teks Manusia
          const mapSvcMode = { '1': 'Urgent Onsite', '2': 'Normal Onsite', '3': 'Carry-In' };
          const mapWarranty = { '0': 'Non Warranty', '1': 'Warranty', '3': 'Masih dapat diganti' };
          const mapCustType = { '0': 'Perusahaan', '1': 'Pribadi', '2': 'Internal MIP' };
          const mapSvcType = { '0': 'Service Only', '1': 'Part with Svc', '2': 'Part Only' };

          // 4. Update Database Sempurna
          if (phoneRaw || address1Raw || problemRaw) {
            await db.update(serviceRequests)
              .set({
                phone_number: phoneRaw || '0000000',
                address_1: address1Raw || 'Alamat tidak terdata',
                machine_model: machineModelRaw || 'Unknown',
                serial_number: serialNumRaw || '-',
                problem_desc: problemRaw || 'Kerusakan tidak terdata',
                technician_name: techNameRaw || null,
                tech_remarks: techRemarksRaw || null,
                
                // Menyimpan hasil translasi Radio Button
                service_mode: mapSvcMode[svcModeVal as string] || 'Carry-In',
                warranty_status: mapWarranty[warrantyVal as string] || 'Non Warranty',
                customer_type: mapCustType[custTypeVal as string] || 'Perusahaan',
                service_action: mapSvcType[svcTypeVal as string] || 'Service Only',

                status: techNameRaw && techNameRaw.trim() !== '' ? '1' : '0' 
              })
              .where(eq(serviceRequests.sr_number, item.sr_number));
              
            detailUpdatedCount++;
          }

          // 5. JEDA SAKTI: Tidur 1.5 detik
          await new Promise(resolve => setTimeout(resolve, 1500)); 

        } catch (error) {
          this.logger.warn(`Gagal Deep Dive untuk SR: ${item.sr_number}. Lanjut ke data berikutnya...`);
        }
      }

      this.logger.log(`[DEEP DIVE SELESAI] Berhasil melengkapi ${detailUpdatedCount} dari ${dataToInsert.length} data.`);

      return { 
        success: true, 
        message: "Sinkronisasi & Deep Dive Berhasil",
        stats: { total_found: dataToInsert.length, new_inserted: syncedCount, detail_updated: detailUpdatedCount }
      };

    } catch (error: any) {
      this.logger.error(`Sinkronisasi Gagal: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  // --- API 5: PROSES KASIR (Hitung Biaya & Buat SP) ---
  async prosesKasir(id: string, dto: InputBiayaDto) {
    try {
      // 1. Ambil data SR saat ini untuk mengecek harga sparepart
      const existingSR = await db.select({
        part_cost: serviceRequests.part_cost,
        status: serviceRequests.status
      })
      .from(serviceRequests)
      .where(eq(serviceRequests.id, id))
      .limit(1);

      if (existingSR.length === 0) throw new Error('Data SR tidak ditemukan');
      if (existingSR[0].status === '0') throw new Error('Mesin belum dicek Teknisi! Tidak bisa diproses Kasir.');

      // 2. Siapkan Variabel Biaya
      const partCost = existingSR[0].part_cost || 0;
      const laborCost = dto.labor_cost || 0;
      const onsiteCost = dto.onsite_cost || 0;
      const otherCost = dto.other_cost || 0;

      // 3. Mesin Kalkulasi Keuangan (Termasuk PPN 11%)
      const subTotal = partCost + laborCost + onsiteCost + otherCost;
      const taxAmount = Math.round(subTotal * 0.11); // Rumus PPN 11%
      const totalAmount = subTotal + taxAmount;

      // 4. Generate Nomor SP Otomatis (misal: SP000001)
      const sp_number = await this.generateSRNumber('SP');

      // 5. Update Database ke Status 2
      await db.update(serviceRequests)
        .set({
          sp_number,
          labor_cost: laborCost,
          onsite_cost: onsiteCost,
          other_cost: otherCost,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: '2', // 2 = Surat Penawaran (SP) Selesai Diproses
        })
        .where(eq(serviceRequests.id, id));

      return {
        success: true,
        message: 'Surat Penawaran (SP) berhasil dibuat!',
        data: {
          sp_number,
          biaya_sparepart: partCost,
          biaya_jasa: laborCost,
          sub_total_biaya: subTotal,
          pajak_ppn: taxAmount,
          total_tagihan: totalAmount
        }
      };

    } catch (error: any) {
      this.logger.error(`Gagal memproses Kasir: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async handleMachineMaster(modelName: string) {
    if (!modelName) return;

    // 1. Cek apakah model sudah ada
    const existing = await db.select()
      .from(machines)
      .where(eq(machines.model, modelName.toUpperCase()))
      .limit(1);

    // 2. Jika tidak ada, simpan sebagai model baru
    if (existing.length === 0) {
      await db.insert(machines).values({
        model: modelName.toUpperCase(),
        brand: 'EPSON' // Default
      });
      this.logger.log(`[Master Mesin] Model baru tersimpan: ${modelName}`);
    }
  }
}