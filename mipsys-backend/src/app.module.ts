import { Module } from '@nestjs/common';
import { ShipmentsModule } from './shipments/shipments.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { ScraperModule } from './scraper/scraper.module';

@Module({
  imports: [ShipmentsModule, ServiceRequestsModule, ScraperModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
