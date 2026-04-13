import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ShipmentsRepository } from './shipments.repository';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto'; // Generator UUID untuk Drizzle ORM

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(private readonly repo: ShipmentsRepository) {}

  async findAll() {
    return await this.repo.findAll();
  }

  async syncFromLegacy() {
    const baseUrl = process.env.LEGACY_BASE_URL ?? '';
    const loginUrl = `${baseUrl}/defaultvalid.asp`;
    const lobbyUrl = `${baseUrl}/scmainmenu.asp`; 
    const dataUrl = `${baseUrl}/EASPSHPSTART.asp`; 

    try {
      this.logger.log('--- [START] Operasi Siphoning Data Dimulai ---');

      // =========================================================
      // PENGINGAT KRUSIAL:
      // Pastikan tabel `locations` di database kamu TIDAK KOSONG.
      // Harus ada data dengan id = 1 agar Foreign Key tidak gagal.
      // =========================================================

      // ---------------------------------------------------------
      // ZONA 1: NETWORK & AUTHENTICATION (JALUR MANUSIA)
      // ---------------------------------------------------------
      const formData = new URLSearchParams();
      formData.append('varUSERID', process.env.LEGACY_USER ?? '');
      formData.append('varPASSWORD', process.env.LEGACY_PASS ?? '');
      formData.append('submit1', 'SignOn');

      // 1. Ketuk Pintu Depan (Login)
      const loginResponse = await axios.post(loginUrl, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        maxRedirects: 0, 
        validateStatus: (status) => status >= 200 && status < 400,
      });

      const cookies = loginResponse.headers['set-cookie'];
      const redirectLocation = loginResponse.headers['location'];
      if (!cookies) throw new Error('Akses Ditolak: Session Cookie tidak ditemukan.');

      // 2. Ikuti Arah Redirect secara Manual (Sambil Bawa Cookie)
      if (redirectLocation) {
        const redirectUrl = redirectLocation.startsWith('http') 
            ? redirectLocation 
            : `${baseUrl}/${redirectLocation.replace(/^\//, '')}`;
        await axios.get(redirectUrl, { headers: { 'Cookie': cookies.join('; ') } });
      }

      // 3. Mampir ke Lobi (Wajib untuk mengunci Session 8700 Semarang)
      await axios.get(lobbyUrl, { headers: { 'Cookie': cookies.join('; ') } });

      // 4. Buka Pintu Gudang Penerimaan Barang (Target Asli)
      this.logger.log(`Menuju ruang penerimaan barang: ${dataUrl}`);
      const { data: html } = await axios.get(dataUrl, {
        headers: { 'Cookie': cookies.join('; ') }
      });

      // ---------------------------------------------------------
      // ZONA 2: PARSING & FILTERING 
      // ---------------------------------------------------------
      const $ = cheerio.load(html);
      let newEntriesCount = 0;
      let skippedCount = 0;

      const rows = $('tr').toArray();
      this.logger.log(`Memindai ${rows.length} baris HTML...`);

      for (const el of rows) {
        const cols = $(el).find('td');

        // KACAMATA PINTAR: Baris data asli memiliki minimal 11 kolom
        if (cols.length >= 11) {
          const statusVal = $(cols[0]).text().trim();    // Kolom 0: TC (ex: "TF")
          const rawDate = $(cols[3]).text().trim();      // Kolom 3: ISSUEDATE (ex: "20/10/2025")
          const picklistNo = $(cols[4]).text().trim();   // Kolom 4: PICKLIST (ex: "T43791")

          if (picklistNo && picklistNo !== 'PICKLIST' && rawDate.includes('/')) {
            
            // ---------------------------------------------------------
            // ZONA 3: DATABASE INTEGRITY CHECK & INSERTION
            // ---------------------------------------------------------
            const existing = await this.repo.findByPicklist(picklistNo);
            
            if (existing.length === 0) {
              // FORMAT TANGGAL MYSQL: Ubah 20/10/2025 menjadi 2025-10-20
              const [d, m, y] = rawDate.split('/');
              const mysqlDateStr = `${y}-${m}-${d}`; 

              // GENERATE UUID: Syarat mutlak untuk Drizzle ORM varchar(36)
              const newUuid = crypto.randomUUID();

              await this.repo.create({
                id: newUuid,           // Sandi VIP untuk Drizzle
                location_id: 1,        // Merujuk ke id: 1 di tabel locations
                status: statusVal,
                issue_date: mysqlDateStr as any, 
                picklist_no: picklistNo,
              });
              
              newEntriesCount++;
              this.logger.log(`[DATA BARU] Berhasil masuk MySQL! ID: ${newUuid.substring(0,8)}... | Picklist: ${picklistNo}`);
            } else {
              skippedCount++; // Duplikat
            }
          } else {
            skippedCount++; // Baris sampah
          }
        } else {
          skippedCount++; // Bukan baris data
        }
      }

      this.logger.log(`--- [FINISH] Sukses! Ditambah: ${newEntriesCount} | Dilewati: ${skippedCount} ---`);
      return { 
        success: true, 
        message: 'Sinkronisasi selesai',
        inserted: newEntriesCount, 
        skipped: skippedCount 
      };

    } catch (error: any) {
      // ---------------------------------------------------------
      // ERROR HANDLING PROFESIONAL
      // ---------------------------------------------------------
      console.error('\n[DATABASE ERROR RAW]:', error.sqlMessage || error.message, '\n');

      let errorMessage = 'Terjadi kesalahan sistem.';
      let statusCode = '500';

      if (axios.isAxiosError(error)) {
        statusCode = error.response?.status?.toString() ?? 'Network Error';
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      this.logger.error(`[GAGAL] Detail: ${statusCode} - ${errorMessage}`);
      throw new InternalServerErrorException(`Siphoning gagal: ${errorMessage}`);
    }
  }
}