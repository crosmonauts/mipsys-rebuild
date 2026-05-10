import { Module } from '@nestjs/common';
import { DatabaseModule } from './db/db';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { SparePartsModule } from './spare-parts/spare-parts.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';

@Module({
  imports: [
    DatabaseModule,         // Global DB provider
    ServiceRequestsModule,  // Alur servis: entry → check → approve → service → done
    SparePartsModule,       // Master spare part & inventory
    PurchaseOrdersModule,   // Pengadaan part: request → ordered → shipped → received
  ],
})
export class AppModule {}
