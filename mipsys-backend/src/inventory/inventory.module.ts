import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [DatabaseModule, StockMovementsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
