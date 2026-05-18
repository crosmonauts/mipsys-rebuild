import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { FinanceModule } from './finance/finance.module';
import { InventoryModule } from './inventory/inventory.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { OrderPartsModule } from './order-parts/order-parts.module';
import { CategoryModelsModule } from './category-models/category-models.module';
import { CustomersModule } from './customers/customers.module';
import { StaffModule } from './staff/staff.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    DatabaseModule,
    ServiceRequestsModule,
    PurchaseOrdersModule,
    FinanceModule,
    InventoryModule,
    StockMovementsModule,
    OrderPartsModule,
    CategoryModelsModule,
    CustomersModule,
    StaffModule,
    ProductsModule,
  ],
})
export class AppModule {}
