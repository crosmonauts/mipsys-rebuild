import { Module } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsRepository } from './service-requests.repository';
import { PartRequestsRepository } from './part-requests.repository';
import { ScraperModule } from 'src/scraper/scraper.module';
import { PartMappingsRepository } from './part-mappings.repository';

@Module({
  imports: [ScraperModule],
  controllers: [ServiceRequestsController],
  providers: [
    ServiceRequestsService, 
    ServiceRequestsRepository,
    PartRequestsRepository,
    PartMappingsRepository
  ],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}