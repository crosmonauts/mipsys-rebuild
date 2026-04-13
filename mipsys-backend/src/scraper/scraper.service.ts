import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio'

@Injectable()
export class ScraperService implements OnModuleInit {
  private readonly logger = new Logger(ScraperService.name);
  private client: AxiosInstance;
  private cookies: string[] = [];

  constructor() {
    // Inisialisasi Axios dengan Base URL agar request lebih pendek
    this.client = axios.create({
      baseURL: process.env.LEGACY_BASE_URL,
      withCredentials: true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  async onModuleInit() {
    // Otomatis login saat aplikasi NestJS pertama kali nyala
    await this.authenticate();
  }

  async authenticate() {
    this.logger.log('--- [AUTH] Memperbarui Sesi Akses VIP Mipsys ---');
    try {
      const formData = new URLSearchParams();
      formData.append('varUSERID', process.env.LEGACY_USER || '');
      formData.append('varPASSWORD', process.env.LEGACY_PASS || '');
      formData.append('submit1', 'SignOn');

      const res = await this.client.post('/defaultvalid.asp', formData, {
        maxRedirects: 0,
        validateStatus: (s) => s < 400,
      });

      this.cookies = res.headers['set-cookie'] || [];
      if (this.cookies.length === 0) throw new Error('Login Gagal: No Cookies.');

      // Kunci Sesi EASC SEMARANG (Lobby Registration)
      await this.client.get('/scmainmenu.asp', {
        headers: { Cookie: this.cookies.join('; ') },
      });

      this.logger.log('--- [AUTH] Sesi Semarang Aktif & Terkunci ---');
    } catch (error: any) {
      this.logger.error(`Autentikasi Gagal: ${error.message}`);
    }
  }

  // Fungsi sakti untuk dipakai semua modul
  async fetchHtml(url: string): Promise<string> {
    try {
      const response = await this.client.get(url, {
        headers: { Cookie: this.cookies.join('; ') },
      });
      return response.data;
    } catch (error) {
      this.logger.warn('Sesi mungkin habis, mencoba login ulang...');
      await this.authenticate(); // Re-login otomatis
      const retryResponse = await this.client.get(url, {
        headers: { Cookie: this.cookies.join('; ') },
      });
      return retryResponse.data;
    }
  }

  // Fungsi untuk mengirim data (POST) simulasi klik tombol
  async postHtml(url: string, data: Record<string, string>): Promise<string> {
    try {
      const formData = new URLSearchParams();
      for (const key in data) {
        formData.append(key, data[key]);
      }

      const response = await this.client.post(url, formData, {
        headers: { Cookie: this.cookies.join('; ') },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Gagal POST ke ${url}: ${error.message}`);
      
      // Auto Re-auth jika gagal
      this.logger.warn('Mencoba login ulang untuk POST...');
      await this.authenticate();
      
      const formData = new URLSearchParams();
      for (const key in data) {
        formData.append(key, data[key]);
      }
      const retryResponse = await this.client.post(url, formData, {
        headers: { Cookie: this.cookies.join('; ') },
      });
      return retryResponse.data;
    }
  }
  async getPartStock(partNo: string): Promise<number> {
    try {
      // Robot mensimulasikan input part number dan klik "Display"
      const html = await this.postHtml('/PARTSTATUSPULLSC.asp', {
        strWHNO: '8700', // Warehouse Semarang
        txtLIKEPN: partNo,
        submit1: 'Display',
      });

      const $ = cheerio.load(html);
      const stockRaw = $('input[name="txtOHQTY"]').val()?.toString() || '0';
      
      return parseInt(stockRaw, 10);
    } catch (error) {
      return 0; // Jika gagal, asumsikan stok 0 agar tetap aman (safe-fail)
    }
  }
}