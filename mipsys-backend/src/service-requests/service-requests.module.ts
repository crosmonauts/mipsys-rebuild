import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/db';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestService } from './service-requests.service';

/**
 * FIX: Modul sebelumnya me-redeclare DB_CONNECTION sendiri (konflik dengan DatabaseModule global)
 * dan mengimpor SparePartsModule yang tidak diperlukan.
 * Sekarang cukup impor DatabaseModule untuk mendapatkan DB_CONNECTION via @Global().
 */
@Module({
  imports: [DatabaseModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestService],
  exports: [ServiceRequestService],
})
export class ServiceRequestsModule {}
