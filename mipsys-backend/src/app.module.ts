import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { FinanceModule } from './finance/finance.module';
import { InventoryModule } from './inventory/inventory.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { OrderPartsModule } from './order-parts/order-parts.module';
import { CategoryModelsModule } from './category-models/category-models.module';
import { CustomersModule } from './customers/customers.module';
import { StaffModule } from './staff/staff.module';
import { ReportsModule } from './reports/reports.module';
import { CompanyProfileModule } from './company-profile/company-profile.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 300 },
    ]),
    DatabaseModule,
    AuthModule,
    ServiceRequestsModule,
    PurchaseOrdersModule,
    FinanceModule,
    InventoryModule,
    StockMovementsModule,
    OrderPartsModule,
    CategoryModelsModule,
    CustomersModule,
    StaffModule,
    ReportsModule,
    CompanyProfileModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
