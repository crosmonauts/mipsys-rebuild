import { Module } from '@nestjs/common'; // <--- INI KTM YANG HILANG!
import { ScraperService } from './scraper.service';

@Module({
  providers: [ScraperService],
  exports: [ScraperService], // Agar bisa dipakai modul lain seperti Service Request
})
export class ScraperModule {}