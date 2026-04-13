import { Injectable, Logger } from '@nestjs/common';
import { db } from '../db/db'; // Langsung ambil koneksi DB
import { serviceRequests, locations } from '../db/schema';
import { ScraperService } from '../scraper/scraper.service';
import { eq, desc } from 'drizzle-orm';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger('MipsyCore');

  constructor(private readonly scraper: ScraperService) {}

  // 1. QUERY LANGSUNG (Tanpa Repository)
  async findAll() {
    return await db.select().from(serviceRequests).orderBy(desc(serviceRequests.created_at));
  }

  // 2. LOGIKA SYNC RINGAN
  async syncFromLegacy() {
    try {
      const html = await this.scraper.fetchHtml('/EASRUPDSTART.asp');
      const $ = cheerio.load(html);
      const options = $('#txtSRNO option').toArray();
      
      let count = 0;
      for (const opt of options) {
        const [srNumber, , customerName] = $(opt).text().split('|').map(s => s.trim());
        if (!srNumber) continue;

        // Cek eksistensi langsung disini
        const [existing] = await db.select().from(serviceRequests).where(eq(serviceRequests.sr_number, srNumber)).limit(1);
        
        if (!existing) {
          const detail = await this.getMinimalDetail(srNumber);
          await db.insert(serviceRequests).values({
            id: crypto.randomUUID(),
            sr_number: srNumber,
            customer_name: customerName || 'Unknown',
            problem_desc: detail.problemDesc,
            status: 'OPEN',
            location_id: 1,
          });
          count++;
        }
      }
      return { success: true, added: count };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  private async getMinimalDetail(srNumber: string) {
    const html = await this.scraper.postHtml('/EASRSELPULL.asp', { varSRNO: srNumber, submit1: 'Tampilkan' });
    const $ = cheerio.load(html);
    return {
      problemDesc: $('input[name="txtSPPROBLEM"]').val()?.toString() || 'Kosong'
    };
  }
}