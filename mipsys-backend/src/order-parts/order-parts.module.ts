import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrderPartsController } from './order-parts.controller';
import { OrderPartsService } from './order-parts.service';

@Module({
  imports: [DatabaseModule, InventoryModule],
  controllers: [OrderPartsController],
  providers: [OrderPartsService],
  exports: [OrderPartsService],
})
export class OrderPartsModule {}
