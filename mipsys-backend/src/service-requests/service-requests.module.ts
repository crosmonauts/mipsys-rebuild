import { Module } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsController } from './service-requests.controller';
import { ScraperService } from '../scraper/scraper.service'; // Pastikan path ini benar sesuai folder scraper-mu

@Module({
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, ScraperService], // Tambahkan ScraperService di sini
})
export class ServiceRequestsModule {}