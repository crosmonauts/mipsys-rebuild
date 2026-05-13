import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/db';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestService } from './service-requests.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestService],
  exports: [ServiceRequestService],
})
export class ServiceRequestsModule {}
