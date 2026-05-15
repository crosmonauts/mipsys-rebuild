import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PoItemsService } from './po-items.service';

@Module({
  imports: [DatabaseModule, StockMovementsModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PoItemsService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
