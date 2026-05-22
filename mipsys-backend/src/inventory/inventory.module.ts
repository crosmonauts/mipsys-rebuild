import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { InventoryController } from './inventory.controller';
import { SparePartsController } from './spare-parts.controller';
import { InventoryService } from './inventory.service';
import { InventoryListener } from './listeners/inventory.listener';

@Module({
  imports: [DatabaseModule, StockMovementsModule],
  controllers: [InventoryController, SparePartsController],
  providers: [InventoryService, InventoryListener],
  exports: [InventoryService],
})
export class InventoryModule {}
