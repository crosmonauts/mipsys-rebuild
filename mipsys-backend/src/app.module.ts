import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { SparePartsModule } from './spare-parts/spare-parts.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { FinanceModule } from './finance/finance.module';
import { OrderPartsModule } from './order-parts/order-parts.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    DatabaseModule,
    ServiceRequestsModule,
    SparePartsModule,
    PurchaseOrdersModule,
    FinanceModule,
    OrderPartsModule,
    InventoryModule,
  ],
})
export class AppModule {}
