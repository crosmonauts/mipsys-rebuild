import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestService } from './service-requests.service';

@Module({
  imports: [DatabaseModule, InventoryModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestService],
  exports: [ServiceRequestService],
})
export class ServiceRequestsModule {}
